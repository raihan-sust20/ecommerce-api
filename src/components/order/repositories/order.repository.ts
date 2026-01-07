import { injectable } from 'tsyringe';
import { Repository, DataSource, type EntityManager } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Order, type OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { logger } from '../../../shared/utils/logger.util';

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
}

@injectable()
export class OrderRepository {
  private orderRepo: Repository<Order>;
  private orderItemRepo: Repository<OrderItem>;
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
    this.orderRepo = this.dataSource.getRepository(Order);
    this.orderItemRepo = this.dataSource.getRepository(OrderItem);
  }

  async createOrder(
    userId: string,
    totalAmount: string,
    items: Array<{ product_id: string; price: string; quantity: number; subtotal: string }>
  ): Promise<Order> {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // Create order
      const order = manager.create(Order, {
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending',
      });
      const savedOrder = await manager.save(Order, order);

      // Create order items
      const orderItems = items.map((item) =>
        manager.create(OrderItem, {
          order_id: savedOrder.id,
          product_id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      );
      await manager.save(OrderItem, orderItems);

      // Load order with relations
      return (await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: { items: { product: true } },
      })) as Order;
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: { items: { product: true }, user: true },
    });
  }

  async findByUserId(userId: string, skip: number, take: number): Promise<[Order[], number]> {
    logger.log('userId: ', userId);
    return this.orderRepo.findAndCount({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });
  }

  async findAll(skip: number, take: number, filters?: OrderFilters): Promise<[Order[], number]> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('order.user_id = :userId', { userId: filters.userId });
    }

    query.orderBy('order.created_at', 'DESC');
    query.skip(skip).take(take);

    return query.getManyAndCount();
  }
}
