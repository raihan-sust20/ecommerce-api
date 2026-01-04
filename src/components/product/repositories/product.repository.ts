import { injectable } from 'tsyringe';
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { Category } from '../../category/entities/category.entity';

@injectable()
export class ProductRepository {
  private repository: Repository<Product>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repository.findOne({ where: { sku } });
  }

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    queryBuilder.where('product.sku = :sku', { sku });
    
    if (excludeId) {
      queryBuilder.andWhere('product.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  async findCategoriesByIds(categoryIds: string[]): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { id: In(categoryIds) },
    });
  }

  async create(data: CreateProductDto, categories: Category[]): Promise<Product> {
    const product = this.repository.create({
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      status: data.status || 'active',
      categories: categories,
    });

    return this.repository.save(product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['categories'],
    });
  }

  async findAll(skip: number, take: number): Promise<[Product[], number]> {
    return this.repository.findAndCount({
      relations: ['categories'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
