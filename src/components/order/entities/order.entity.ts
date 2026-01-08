import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'paid' | 'canceled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK → users.id
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user: User) => user.orders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_orders_user_id',
  })
  user: User;

  // Use decimal for money (never float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: string;

  @Column()
  status: OrderStatus;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order)
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
