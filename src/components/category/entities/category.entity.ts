import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('categories')
@Index(['slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @Column()
  @Index('idx_categories_slug')
  slug: string; // SEO-friendly URL part

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Adjacency List (parent → children)
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'RESTRICT', // blocks delete if children exist
  })
  @JoinColumn({
    name: 'parent_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_categories_parent_id',
  })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Optional denormalized path for faster reads (recommended)
  @Column({ nullable: true })
  path?: string; // e.g. electronics/mobiles/smartphones

  // Many-to-Many with Product
  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
