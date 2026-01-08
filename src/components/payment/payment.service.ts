import { injectable, inject } from 'tsyringe';
import { DataSource, type EntityManager } from 'typeorm';
import { PaymentRepository } from './repositories/payment.repository';
import { OrderRepository } from '../order/repositories/order.repository';
import { Payment, type PaymentProvider } from './entities/payment.entity';
import { ProcessPaymentDto } from './dtos/process-payment.dto';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { AppDataSource } from '../../config/database.config';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors/app-error';
import { logger } from '../../shared/utils/logger.util';
import type { VerifyPaymentParam } from './strategies/payment-strategy.interface';

@injectable()
export class PaymentService {
  constructor(
    @inject(PaymentRepository) private paymentRepository: PaymentRepository,
    @inject(OrderRepository) private orderRepository: OrderRepository,
    @inject(PaymentStrategyFactory) private strategyFactory: PaymentStrategyFactory
  ) {}

  async processPayment(data: ProcessPaymentDto): Promise<Payment> {
    if (data.provider === 'bkash') {
      throw new ValidationError('Bkash payment provider is currently not supported.');
    }
    // 1. Verify order exists and is in correct state
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'pending') {
      throw new ConflictError(`Order cannot be paid. Current status: ${order.status}`);
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
      throw new ValidationError(paymentResult.message || 'Payment processing failed');
    }

    // 4. Create payment record
    const payment = await this.paymentRepository.create({
      orderId: data.orderId,
      provider: data.provider,
      transactionId: paymentResult.transactionId as string,
      amount: order.total_amount,
      status: paymentResult.status === 'completed' ? 'completed' : 'pending',
      rawResponse: paymentResult.rawResponse,
    });

    logger.info(
      `Payment processed successfully. Order: ${data.orderId}, Transaction: ${paymentResult.transactionId}`
    );

    return payment;
  }

  async verifyPayment(
    paymentProvider: PaymentProvider,
    verifyPaymentParam: VerifyPaymentParam
  ): Promise<Payment> {
    if (!verifyPaymentParam.transactionId && !verifyPaymentParam.req) {
      throw new ValidationError('Either transactionId or req must be provided');
    }

    const strategy = this.strategyFactory.getStrategy(paymentProvider);
    const verificationResult = await strategy.verifyPayment(verifyPaymentParam);

    if (!verificationResult.success) {
      throw new ValidationError(verificationResult.message as string);
    }

    const { rawResponse } = verificationResult;
    const transactionId = verificationResult.transactionId as string;

    // Update payment status based on verification result
    switch (verificationResult.status) {
      case 'completed':
        await this.handlePaymentSucceeded(transactionId, rawResponse);
        break;

      case 'failed':
        await this.handlePaymentFailed(transactionId, rawResponse);
        break;

      case 'canceled':
        await this.handlePaymentCanceled(transactionId, rawResponse);
        break;

      default:
        logger.warn(`Invalid payment status: ${verificationResult.status}`);
    }

    const updatePayment = await this.paymentRepository.findByTransactionId(transactionId);

    return updatePayment as Payment;
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

  async handlePaymentSucceeded(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await this.paymentRepository.updateDbOnPaymentSucceed(transactionId, rawResponse);
  }

  async handlePaymentFailed(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await this.paymentRepository.updateDbOnPaymentFailed(transactionId, rawResponse);
  }

  async handlePaymentCanceled(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await this.paymentRepository.updateDbOnPaymentCanceled(transactionId, rawResponse);
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
