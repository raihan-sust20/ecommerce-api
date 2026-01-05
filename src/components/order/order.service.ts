import { injectable, inject } from 'tsyringe';
import { OrderRepository } from './repositories/order.repository';
import { ProductRepository } from '../product/repositories/product.repository';
import { Order } from './entities/order.entity';
import { CreateOrderDto, CreateOrderItemDto } from './dtos/create-order.dto';
import { ValidationError, NotFoundError } from '../../shared/errors/app-error';
import Big from 'big.js';

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

  async getOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Ensure user can only access their own orders
    if (order.user_id !== userId) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}
