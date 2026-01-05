import { injectable, inject } from 'tsyringe';
import { ProductRepository } from './repositories/product.repository';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { cacheService } from '../../shared/utils/cache.util';
import type { UpdateProductDto } from './dtos/update-product.dto';
import { CACHE_TTL, PAGINATION } from '../../shared/constants';
import { PaginationUtil, type PaginatedResult } from '../../shared/utils/pagination.util';
import type { QueryProductDto } from './dtos/query-product.dto';

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
      const foundIds = categories.map((c) => c.id);
      const missingIds = data.categoryIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Categories not found: ${missingIds.join(', ')}`);
    }

    // Validate all categories are active
    const inactiveCategories = categories.filter((c) => !c.isActive);
    if (inactiveCategories.length > 0) {
      const inactiveNames = inactiveCategories.map((c) => c.name).join(', ');
      throw new ValidationError(`Cannot create product with inactive categories: ${inactiveNames}`);
    }

    // Create product
    const product = await this.productRepository.create(data, categories);

    // Invalidate cache
    await cacheService.delPattern('products:*');

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    // Check if product exists
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    // Validate categories if provided
    let categories = product.categories;
    if (data.categoryIds && data.categoryIds.length > 0) {
      const foundCategories = await this.productRepository.findCategoriesByIds(data.categoryIds);

      if (foundCategories.length !== data.categoryIds.length) {
        const foundIds = foundCategories.map((c) => c.id);
        const missingIds = data.categoryIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundError(`Categories not found: ${missingIds.join(', ')}`);
      }

      const inactiveCategories = foundCategories.filter((c) => !c.isActive);
      if (inactiveCategories.length > 0) {
        const inactiveNames = inactiveCategories.map((c) => c.name).join(', ');
        throw new ValidationError(
          `Cannot update product with inactive categories: ${inactiveNames}`
        );
      }

      categories = foundCategories;
    }

    // Update basic fields
    const updateData: Partial<Product> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.status !== undefined) updateData.status = data.status;

    // Update product
    await this.productRepository.update(id, updateData);

    // Update categories if changed
    if (data.categoryIds) {
      const updatedProduct = await this.productRepository.findById(id);
      if (updatedProduct) {
        await this.productRepository.updateWithCategories(updatedProduct, categories);
      }
    }

    // Get updated product
    const updatedProduct = await this.productRepository.findById(id);

    // Invalidate cache
    await cacheService.del(`product:${id}`);
    await cacheService.delPattern('products:*');

    return updatedProduct as Product;
  }

  async getProducts(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const cacheKey = `products:list:${JSON.stringify({ ...query, page, limit })}`;
    const cached = await cacheService.get<PaginatedResult<Product>>(cacheKey);

    if (cached) {
      return cached;
    }

    const { skip, take } = PaginationUtil.getSkipTake(page, limit);
    const [products, total] = await this.productRepository.findAll(query, skip, take);

    const result = PaginationUtil.paginate(products, total, page, limit);
    await cacheService.set(cacheKey, result, CACHE_TTL.SHORT);

    return result;
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

    await cacheService.set(cacheKey, product, CACHE_TTL.MEDIUM);
    return product;
  }

  async getProductBySku(sku: string): Promise<Product> {
    const cacheKey = `product:sku:${sku}`;
    const cached = await cacheService.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundError(`Product with SKU '${sku}' not found`);
    }

    await cacheService.set(cacheKey, product, CACHE_TTL.MEDIUM);
    return product;
  }

}
