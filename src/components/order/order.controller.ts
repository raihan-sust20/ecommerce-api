import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { OrderService } from './order.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import type { GetOrdersQueryDto } from './dtos/get-orders-query.dto';
import { PAGINATION } from '../../shared/constants';

@injectable()
export class OrderController {
  constructor(@inject(OrderService) private orderService: OrderService) {}

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.orderService.createOrder(userId, req.body);

      ResponseUtil.created(res, result.order, result.message);
    } catch (error) {
      next(error);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetOrdersQueryDto;
      const requestUser = req.user;

      const page = query.page || PAGINATION.DEFAULT_PAGE;
      const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

      const filters = {
        status: query.status,
        userId: query.userId,
      };

      const result = await this.orderService.getOrders(requestUser, page, limit, filters);
      ResponseUtil.success(res, result, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      ResponseUtil.success(res, order, 'Order retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(new Error('User not authenticated'));
      }

      const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
      const limit = Math.min(
        parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_LIMIT
      );

      const result = await this.orderService.getUserOrders(userId, page, limit);
      ResponseUtil.success(res, result, 'User orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
