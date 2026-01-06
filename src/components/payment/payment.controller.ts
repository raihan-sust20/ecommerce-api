import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PaymentService } from './payment.service';
import { ResponseUtil } from '../../shared/utils/response.util';

@injectable()
export class PaymentController {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {}

  processPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payment = await this.paymentService.processPayment(req.body);
      ResponseUtil.created(res, payment, 'Payment processed successfully');
    } catch (error) {
      next(error);
    }
  };

  verifyPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const payment = await this.paymentService.verifyPayment(transactionId);
      ResponseUtil.success(res, payment, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  };

  getPaymentByTransactionId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const payment = await this.paymentService.getPaymentByTransactionId(transactionId);
      ResponseUtil.success(res, payment, 'Payment retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getPaymentsByOrderId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const payments = await this.paymentService.getPaymentsByOrderId(orderId);
      ResponseUtil.success(res, payments, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
