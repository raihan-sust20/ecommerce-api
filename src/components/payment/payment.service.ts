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

  async verifyPayment(transactionId: string): Promise<Payment> {
    // 1. Find existing payment record
    const payment = await this.paymentRepository.findByTransactionId(transactionId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // 2. If already completed, return it
    if (payment.status === 'completed') {
      return payment;
    }

    // 3. Verify with payment provider
    const strategy = this.strategyFactory.getStrategy(payment.provider);
    const verificationResult = await strategy.verifyPayment(transactionId);

    // 4. Update payment status
    await this.paymentRepository.updateStatus(
      transactionId,
      verificationResult.status === 'completed' ? 'completed' : payment.status,
      verificationResult.rawResponse
    );

    // 5. Update order status if payment is completed
    if (verificationResult.status === 'completed' && payment.order.status === 'pending') {
      await AppDataSource.createQueryBuilder()
        .update('orders')
        .set({ status: 'paid' })
        .where('id = :id', { id: payment.order_id })
        .execute();
    }

    logger.info(`Payment verified. Transaction: ${transactionId}, Status: ${verificationResult.status}`);

    // Return updated payment
    return (await this.paymentRepository.findByTransactionId(transactionId)) as Payment;
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
