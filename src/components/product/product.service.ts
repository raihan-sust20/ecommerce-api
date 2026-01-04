import { injectable, inject } from 'tsyringe';
import { ProductRepository } from './repositories/product.repository';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { cacheService } from '../../shared/utils/cache.util';

@injectable()
export class ProductService {
  constructor(@inject(ProductRepository) private productRepository: ProductRepository) {}

  async createProduct(data: CreateProductDto): Promise<Product> {
    // Validate SKU uniqueness
    const skuExists = await this.productRepository.skuExists(data.sku);
    if (skuExists) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    }

    // Validate all categories exist
    const categories = await this.productRepository.findCategoriesByIds(data.categoryIds);
    
    if (categories.length !== data.categoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = data.categoryIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(
        `Categories not found: ${missingIds.join(', ')}`
      );
    }

    // Validate all categories are active
    const inactiveCategories = categories.filter(c => !c.isActive);
    if (inactiveCategories.length > 0) {
      const inactiveNames = inactiveCategories.map(c => c.name).join(', ');
      throw new ValidationError(
        `Cannot create product with inactive categories: ${inactiveNames}`
      );
    }

    // Create product
    const product = await this.productRepository.create(data, categories);

    // Invalidate cache
    await cacheService.delPattern('products:*');

    return product;
  }

  async getProductById(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cached = await cacheService.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    await cacheService.set(cacheKey, product);
    return product;
  }
}
