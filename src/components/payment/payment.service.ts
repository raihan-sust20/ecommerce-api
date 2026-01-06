import { injectable, inject } from 'tsyringe';
import { DataSource } from 'typeorm';
import { PaymentRepository } from './repositories/payment.repository';
import { OrderRepository } from '../order/repositories/order.repository';
import { Payment } from './entities/payment.entity';
import { ProcessPaymentDto } from './dtos/process-payment.dto';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { AppDataSource } from '../../config/database.config';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/app-error';
import { logger } from '../../shared/utils/logger.util';

@injectable()
export class PaymentService {
  constructor(
    @inject(PaymentRepository) private paymentRepository: PaymentRepository,
    @inject(OrderRepository) private orderRepository: OrderRepository,
    @inject(PaymentStrategyFactory) private strategyFactory: PaymentStrategyFactory
  ) {}

  async processPayment(data: ProcessPaymentDto): Promise<Payment> {
    // Start transaction
    return await AppDataSource.transaction(async (transactionManager) => {
      // 1. Verify order exists and is in correct state
      const order = await this.orderRepository.findById(data.orderId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'pending') {
        throw new ConflictError(
          `Order cannot be paid. Current status: ${order.status}`
        );
      }

      // 2. Check if payment already exists for this order
      const existingPayments = await this.paymentRepository.findByOrderId(data.orderId);
      const completedPayment = existingPayments.find((p) => p.status === 'completed');

      if (completedPayment) {
        throw new ConflictError('Order has already been paid');
      }

      // 3. Get payment strategy and process payment
      const strategy = this.strategyFactory.getStrategy(data.provider);
      const paymentResult = await strategy.processPayment(
        data.orderId,
        order.total_amount,
        data.metadata
      );

      if (!paymentResult.success) {
        logger.error('Payment processing failed:', paymentResult);
        throw new ValidationError(
          paymentResult.message || 'Payment processing failed'
        );
      }

      // 4. Create payment record
      const payment = await this.paymentRepository.create({
        orderId: data.orderId,
        provider: data.provider,
        transactionId: paymentResult.transactionId,
        amount: order.total_amount,
        status: paymentResult.status === 'completed' ? 'completed' : 'pending',
        rawResponse: paymentResult.rawResponse,
      });

      // 5. Update order status if payment is completed
      if (paymentResult.status === 'completed') {
        await transactionManager.update(
          'orders',
          { id: data.orderId },
          { status: 'paid' }
        );
      }

      logger.info(
        `Payment processed successfully. Order: ${data.orderId}, Transaction: ${paymentResult.transactionId}`
      );

      return payment;
    });
  }

  // async verifyPayment(transactionId: string): Promise<Payment> {
  //   // 1. Find existing payment record
  //   const payment = await this.paymentRepository.findByTransactionId(transactionId);
  //   if (!payment) {
  //     throw new NotFoundError('Payment not found');
  //   }

  //   // 2. If already completed, return it
  //   if (payment.status === 'completed') {
  //     return payment;
  //   }

  //   // 3. Verify with payment provider
  //   const strategy = this.strategyFactory.getStrategy(payment.provider);
  //   const verificationResult = await strategy.verifyPayment(transactionId);

  //   // 4. Update payment status
  //   await this.paymentRepository.updateStatus(
  //     transactionId,
  //     verificationResult.status === 'completed' ? 'completed' : payment.status,
  //     verificationResult.rawResponse
  //   );

  //   // 5. Update order status if payment is completed
  //   if (verificationResult.status === 'completed' && payment.order.status === 'pending') {
  //     await AppDataSource.createQueryBuilder()
  //       .update('orders')
  //       .set({ status: 'paid' })
  //       .where('id = :id', { id: payment.orderId })
  //       .execute();
  //   }

  //   logger.info(`Payment verified. Transaction: ${transactionId}, Status: ${verificationResult.status}`);

  //   // Return updated payment
  //   return (await this.paymentRepository.findByTransactionId(transactionId)) as Payment;
  // }

  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.id;

    await AppDataSource.transaction(async (transactionManager) => {
      // 1. Find payment record
      const payment = await this.webhookRepository.findPaymentByTransactionId(transactionId);

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        throw new NotFoundError(`Payment not found for transaction: ${transactionId}`);
      }

      // 2. Check if already processed
      if (payment.status === 'completed') {
        logger.info(`Payment already processed: ${transactionId}`);
        return;
      }

      // 3. Update payment status
      await this.webhookRepository.updatePaymentStatus(transactionId, 'completed', paymentIntent);

      // 4. Update order status
      await this.webhookRepository.updateOrderStatus(payment.orderId, 'paid');

      // 5. Reduce product stock for each order item
      if (payment.order && payment.order.items) {
        for (const item of payment.order.items) {
          const currentStock = await this.webhookRepository.getProductStock(item.product_id);

          if (currentStock === null) {
            logger.error(`Product not found: ${item.product_id}`);
            throw new NotFoundError(`Product not found: ${item.product_id}`);
          }

          if (currentStock < item.quantity) {
            logger.error(
              `Insufficient stock for product ${item.product_id}. Required: ${item.quantity}, Available: ${currentStock}`
            );
            throw new AppError(
              `Insufficient stock for product ${item.product_id}`,
              400
            );
          }

          await this.webhookRepository.reduceProductStock(item.product_id, item.quantity);

          logger.info(
            `Reduced stock for product ${item.product_id} by ${item.quantity} units`
          );
        }
      }

      logger.info(
        `Payment succeeded and processed: ${transactionId}, Order: ${payment.orderId}`
      );
    });
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.id;

    await AppDataSource.transaction(async (transactionManager) => {
      // 1. Find payment record
      const payment = await this.webhookRepository.findPaymentByTransactionId(transactionId);

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        return;
      }

      // 2. Update payment status
      await this.webhookRepository.updatePaymentStatus(transactionId, 'failed', paymentIntent);

      // 3. Keep order in pending status (don't cancel automatically)
      // Business decision: Allow users to retry payment

      logger.info(`Payment failed: ${transactionId}, Order: ${payment.orderId}`);
    });
  }

  private async handlePaymentCanceled(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.id;

    await AppDataSource.transaction(async (transactionManager) => {
      // 1. Find payment record
      const payment = await this.webhookRepository.findPaymentByTransactionId(transactionId);

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        return;
      }

      // 2. Update payment status
      await this.webhookRepository.updatePaymentStatus(transactionId, 'failed', paymentIntent);

      // 3. Update order status to canceled
      await this.webhookRepository.updateOrderStatus(payment.orderId, 'canceled');

      logger.info(`Payment canceled: ${transactionId}, Order: ${payment.orderId}`);
    });
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByTransactionId(transactionId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.findByOrderId(orderId);
  }
}
