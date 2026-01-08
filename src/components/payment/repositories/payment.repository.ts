import { injectable } from 'tsyringe';
import { Repository, type EntityManager } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Payment, PaymentProvider, PaymentStatus } from '../entities/payment.entity';
import { Order } from '../../order/entities/order.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Product } from '../../product/entities/product.entity';
import { logger } from '../../../shared/utils/logger.util';
import { AppError, NotFoundError } from '../../../shared/errors/app-error';
import { log } from 'node:console';

@injectable()
export class PaymentRepository {
  private repository: Repository<Payment>;

  constructor() {
    this.repository = AppDataSource.getRepository(Payment);
  }

  async create(data: {
    orderId: string;
    provider: PaymentProvider;
    transactionId: string;
    amount: string;
    status: PaymentStatus;
    rawResponse: Record<string, any>;
  }): Promise<Payment> {
    const payment = this.repository.create({
      orderId: data.orderId,
      provider: data.provider,
      transactionId: data.transactionId,
      amount: data.amount,
      status: data.status,
      rawResponse: data.rawResponse,
    });

    return this.repository.save(payment);
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { transactionId: transactionId },
      relations: { order: true },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.repository.find({
      where: { orderId: orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    transactionId: string,
    status: PaymentStatus,
    rawResponse?: Record<string, any>
  ): Promise<void> {
    const updateData: any = { status };
    if (rawResponse) {
      updateData.rawResponse = rawResponse;
    }

    await this.repository.update({ transactionId: transactionId }, updateData);
  }

  async exists(transactionId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { transactionId: transactionId },
    });
    return count > 0;
  }

  async findPaymentByTransactionId(
    transactionId: string,
    transactionalPaymentRepo?: Repository<Payment>
  ): Promise<Payment | null> {
    const repo = transactionalPaymentRepo || this.repository;

    return repo.findOne({
      where: { transactionId },
      relations: { order: { items: true } },
    });
  }

  async updatePaymentStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed',
    rawResponse: Record<string, any>,
    transactionalPaymentRepo: Repository<Payment>
  ): Promise<void> {
    await transactionalPaymentRepo.update(
      { transactionId },
      {
        status,
        rawResponse,
      }
    );
  }

  async reduceProductStock(
    productId: string,
    quantity: number,
    transactionalProductRepo: Repository<Product>
  ): Promise<void> {
    await transactionalProductRepo
      .createQueryBuilder()
      .update(Product)
      .set({
        stock: () => `stock - ${quantity}`,
      })
      .where('id = :productId', { productId })
      .andWhere('stock >= :quantity', { quantity })
      .execute();
  }

  async getProductStock(
    productId: string,
    transactionalProductRepo: Repository<Product>
  ): Promise<number | null> {
    const product = await transactionalProductRepo.findOne({
      where: { id: productId },
      select: { stock: true },
    });
    return product ? product.stock : null;
  }

  async updateDbOnPaymentSucceed(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await AppDataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      const transactionalPaymentRepo = transactionalEntityManager.getRepository(Payment);
      const transactionalOrderRepo = transactionalEntityManager.getRepository(Order);
      const transactionalOrderItemRepo = transactionalEntityManager.getRepository(OrderItem);
      const transactionalProductRepo = transactionalEntityManager.getRepository(Product);
      // 1. Find payment record
      const payment = await this.findPaymentByTransactionId(
        transactionId,
        transactionalPaymentRepo
      );

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
      await this.updatePaymentStatus(
        transactionId,
        'completed',
        rawResponse,
        transactionalPaymentRepo
      );

      // 4. Update order status
      await transactionalOrderRepo.update({ id: payment.orderId }, { status: 'paid' });

      log(`Order ${payment.orderId} marked as paid`);

      log('payment.order.items:', payment.order?.items);

      // 5. Reduce product stock for each order item
      if (payment.order && payment.order.items) {
        for (const item of payment.order.items) {
          const currentStock = await this.getProductStock(item.productId, transactionalProductRepo);

          if (currentStock === null) {
            logger.error(`Product not found: ${item.productId}`);
            throw new NotFoundError(`Product not found: ${item.productId}`);
          }

          if (currentStock < item.quantity) {
            logger.error(
              `Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${currentStock}`
            );
            throw new AppError(`Insufficient stock for product ${item.productId}`, 400);
          }

          log(`Reducing stock for product ${item.productId} by ${item.quantity} units`);

          await this.reduceProductStock(item.productId, item.quantity, transactionalProductRepo);

          log(`Reduced stock for product ${item.productId} by ${item.quantity} units`);

          logger.info(`Reduced stock for product ${item.productId} by ${item.quantity} units`);
        }
      }
    });
  }

  async updateDbOnPaymentFailed(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await AppDataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      const transactionalPaymentRepo = transactionalEntityManager.getRepository(Payment);
      const transactionalOrderRepo = transactionalEntityManager.getRepository(Order);

      // 1. Find payment record
      const payment = await this.findPaymentByTransactionId(
        transactionId,
        transactionalPaymentRepo
      );

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        return;
      }

      // 2. Update payment status
      await this.updatePaymentStatus(
        transactionId,
        'failed',
        rawResponse,
        transactionalPaymentRepo
      );

      // 3. Keep order in pending status (don't cancel automatically)
      // Business decision: Allow users to retry payment

      logger.info(`Payment failed: ${transactionId}, Order: ${payment.orderId}`);
    });
  }

  async updateDbOnPaymentCanceled(
    transactionId: string,
    rawResponse: Record<string, any>
  ): Promise<void> {
    await AppDataSource.transaction(async (transactionalEntityManager: EntityManager) => {
      const transactionalPaymentRepo = transactionalEntityManager.getRepository(Payment);
      const transactionalOrderRepo = transactionalEntityManager.getRepository(Order);

      // 1. Find payment record
      const payment = await this.findPaymentByTransactionId(
        transactionId,
        transactionalPaymentRepo
      );

      if (!payment) {
        logger.warn(`Payment not found for transaction: ${transactionId}`);
        return;
      }

      // 2. Update payment status
      await this.updatePaymentStatus(
        transactionId,
        'failed',
        rawResponse,
        transactionalPaymentRepo
      );

      // 3. Update order status to canceled
      await transactionalOrderRepo.update({ id: payment.orderId }, { status: 'canceled' });

      logger.info(`Payment canceled: ${transactionId}, Order: ${payment.orderId}`);
    });
  }
}
