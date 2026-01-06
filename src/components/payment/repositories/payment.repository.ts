import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Payment, PaymentProvider, PaymentStatus } from '../entities/payment.entity';

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
      relations: ['order'],
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
}
