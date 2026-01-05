import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK → orders.id
  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'order_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_order_items_order_id',
  })
  order: Order;

  // FK → products.id
  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => Product, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_order_items_product_id',
  })
  product: Product;
  
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ type: 'int' })
  quantity: number;

  // price * quantity
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: string;
}
