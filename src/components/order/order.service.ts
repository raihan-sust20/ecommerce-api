import { injectable, inject } from 'tsyringe';
import { OrderRepository, type OrderFilters } from './repositories/order.repository';
import { ProductRepository } from '../product/repositories/product.repository';
import { Order } from './entities/order.entity';
import { CreateOrderDto, CreateOrderItemDto } from './dtos/create-order.dto';
import { ValidationError, NotFoundError } from '../../shared/errors/app-error';
import Big from 'big.js';
import { PaginationUtil, type PaginatedResult } from '../../shared/utils/pagination.util';
import { cacheService } from '../../shared/utils/cache.util';
import { CACHE_TTL } from '../../shared/constants';

interface OrderCreationResult {
  order: Order;
  message: string;
}

@injectable()
export class OrderService {
  constructor(
    @inject(OrderRepository) private orderRepository: OrderRepository,
    @inject(ProductRepository) private productRepository: ProductRepository
  ) {}

  async createOrder(userId: string, data: CreateOrderDto): Promise<OrderCreationResult> {
    console.log('Creating order for user:', userId);
    // Validate all products exist and are active
    await this.validateProducts(data.items);

    // Validate stock availability
    await this.validateStock(data.items);

    // Validate prices match current product prices
    await this.validatePrices(data.items);

    // Calculate order items with subtotals
    const orderItems = this.calculateOrderItems(data.items);

    // Calculate total amount
    const totalAmount = this.calculateTotal(orderItems);

    // Create order with items in transaction
    const order = await this.orderRepository.createOrder(
      userId,
      totalAmount,
      orderItems
    );

    return {
      order,
      message: 'Order created successfully. Please proceed to payment.',
    };
  }

  private async validateProducts(items: CreateOrderItemDto[]): Promise<void> {
    console.log('Validating products...');
    const productIds = items.map((item) => item.product_id);
    const uniqueProductIds = [...new Set(productIds)];

    for (const productId of uniqueProductIds) {
      const product = await this.productRepository.findById(productId);
      
      if (!product) {
        throw new NotFoundError(`Product with ID ${productId} not found`);
      }

      if (product.status !== 'active') {
        throw new ValidationError(
          `Product "${product.name}" is not available for purchase`
        );
      }
    }
  }

  private async validateStock(items: CreateOrderItemDto[]): Promise<void> {
    // Group items by product_id to handle duplicate products in order
    const productQuantities = new Map<string, number>();
    
    items.forEach((item) => {
      const currentQty = productQuantities.get(item.product_id) || 0;
      productQuantities.set(item.product_id, currentQty + item.quantity);
    });

    for (const [productId, requestedQty] of productQuantities) {
      const product = await this.productRepository.findById(productId);
      
      if (!product) {
        throw new NotFoundError(`Product with ID ${productId} not found`);
      }

      if (product.stock < requestedQty) {
        throw new ValidationError(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${requestedQty}`
        );
      }
    }
  }

  private async validatePrices(items: CreateOrderItemDto[]): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findById(item.product_id);
      
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.product_id} not found`);
      }

      const productPrice = new Big(product.price);
      const requestedPrice = new Big(item.price);

      if (!productPrice.eq(requestedPrice)) {
        throw new ValidationError(
          `Price mismatch for product "${product.name}". Current price: ${product.price}, Provided: ${item.price}`
        );
      }
    }
  }

  private calculateOrderItems(
    items: CreateOrderItemDto[]
  ): Array<{ product_id: string; price: string; quantity: number; subtotal: string }> {
    return items.map((item) => {
      const price = new Big(item.price);
      const quantity = new Big(item.quantity);
      const subtotal = price.times(quantity).toFixed(2);

      return {
        product_id: item.product_id,
        price: item.price.toString(),
        quantity: item.quantity,
        subtotal,
      };
    });
  }

  private calculateTotal(
    items: Array<{ subtotal: string }>
  ): string {
    return items
      .reduce((total, item) => total.plus(new Big(item.subtotal)), new Big(0))
      .toFixed(2);
  }

  async getOrders(
    requestUser: Express.User,
    page: number,
    limit: number,
    filters?: OrderFilters
  ): Promise<PaginatedResult<Order>> {
    if (requestUser.role === 'customer') {
      if (!filters?.userId) {
        filters = { ...filters, userId: requestUser.id };
      }

      else if (filters.userId !== requestUser.id) {
        throw new ValidationError('Customers can only access their own orders');
      }
    }

    const cacheKey = `orders:list:${page}:${limit}:${filters?.status || 'all'}:${
      filters?.userId || 'all'
    }`;
    const cached = await cacheService.get<PaginatedResult<Order>>(cacheKey);

    if (cached) {
      return cached;
    }

    const { skip, take } = PaginationUtil.getSkipTake(page, limit);
    const [orders, total] = await this.orderRepository.findAll(skip, take, filters);

    const result = PaginationUtil.paginate(orders, total, page, limit);
    await cacheService.set(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  }

  async getOrderById(id: string): Promise<Order> {
    const cacheKey = `order:${id}`;
    const cached = await cacheService.get<Order>(cacheKey);

    if (cached) {
      return cached;
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    await cacheService.set(cacheKey, order, CACHE_TTL.SHORT);
    return order;
  }

  async getUserOrders(userId: string, page: number, limit: number): Promise<PaginatedResult<Order>> {
    const cacheKey = `orders:user:${userId}:${page}:${limit}`;
    const cached = await cacheService.get<PaginatedResult<Order>>(cacheKey);

    if (cached) {
      return cached;
    }

    const { skip, take } = PaginationUtil.getSkipTake(page, limit);
    const [orders, total] = await this.orderRepository.findByUserId(userId, skip, take);

    const result = PaginationUtil.paginate(orders, total, page, limit);
    await cacheService.set(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  }
}
