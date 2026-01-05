import { injectable } from 'tsyringe';
import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

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
    return await this.dataSource.transaction(async (manager) => {
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
    return this.orderRepo.findAndCount({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
      skip,
      take,
    });
  }
}
