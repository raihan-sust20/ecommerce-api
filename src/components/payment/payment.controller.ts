import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { PaymentService } from './payment.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { logger } from '../../shared/utils/logger.util';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';
import { ValidationError } from 'class-validator';
import { formatValidationErrors } from '../../shared/middleware/validation.middleware';

@injectable()
export class PaymentController {
  constructor(
    @inject(PaymentService) private paymentService: PaymentService,
    @inject(StripePaymentStrategy) private stripePaymentStrategy: StripePaymentStrategy
  ) {}

  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.processPayment(req.body);
      ResponseUtil.created(res, payment, 'Payment processed successfully');
    } catch (error) {
      next(error);
    }
  };

  // verifyPayment = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> => {
  //   try {
  //     const { transactionId } = req.params;
  //     const payment = await this.paymentService.verifyPayment(transactionId);
  //     ResponseUtil.success(res, payment, 'Payment verified successfully');
  //   } catch (error) {
  //     next(error);
  //   }
  // };

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

  getPaymentsByOrderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const payments = await this.paymentService.getPaymentsByOrderId(orderId);
      ResponseUtil.success(res, payments, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  handleStripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        logger.error('Missing stripe-signature header');
        res.status(400).json({
          success: false,
          message: 'Missing stripe-signature header',
        });
        return;
      }

      this.paymentService.verifyPayment('stripe', { req }).catch((error) => {
        logger.error('Error handling Stripe webhook:', error);

        if (error.message.includes('Webhook signature verification failed')) {
          res.status(400).json({
            success: false,
            message: 'Webhook signature verification failed',
          });
        }
      });

      // Respond to Stripe
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        received: true,
      });
    } catch (error: any) {
      logger.error('Webhook processing error:', error);

      // Still return 200 to Stripe to prevent retries for non-transient errors
      res.status(200).json({
        success: false,
        message: error.message || 'Webhook processing failed',
        received: true,
      });
    }
  };
}
