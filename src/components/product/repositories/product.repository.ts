import { injectable } from 'tsyringe';
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Category } from '../../category/entities/category.entity';
import type { QueryProductDto } from '../dtos/query-product.dto';

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

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.repository.update(id, data);
    return this.findById(id) as Promise<Product>;
  }

  async updateWithCategories(product: Product, categories: Category[]): Promise<Product> {
    product.categories = categories;
    return this.repository.save(product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['categories'],
    });
  }

  async findAll(query: QueryProductDto, skip: number, take: number): Promise<[Product[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories');

    // Filter by category
    if (query.categoryId) {
      queryBuilder.andWhere('categories.id = :categoryId', { categoryId: query.categoryId });
    }

    // Filter by status
    if (query.status) {
      queryBuilder.andWhere('product.status = :status', { status: query.status });
    }

    // Search by name, sku, or description
    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Filter by price range
    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      });
    } else if (query.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    } else if (query.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip(skip).take(take);

    return queryBuilder.getManyAndCount();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
