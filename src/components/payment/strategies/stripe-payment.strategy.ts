import Stripe from 'stripe';
import { inject, injectable } from 'tsyringe';
import {
  PaymentStrategy,
  PaymentResult,
  type VerifyPaymentParam,
} from './payment-strategy.interface';
import { env } from '../../../config/env.config';
import { logger } from '../../../shared/utils/logger.util';
import type { PaymentStatus } from '../entities/payment.entity';
import { ValidationError } from '../../../shared/errors/app-error';

@injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async processPayment(
    orderId: string,
    amount: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Convert amount to cents (Stripe requires smallest currency unit)
      const amountInCents = Math.round(parseFloat(amount) * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          orderId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        rawResponse: paymentIntent,
        message: 'Payment intent created successfully',
      };
    } catch (error: any) {
      logger.error('Stripe payment error:', error);
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        rawResponse: { error: error.message },
        message: error.message || 'Payment processing failed',
      };
    }
  }

  // async verifyPayment(transactionId: string): Promise<PaymentResult> {
  //   try {
  //     const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

  //     return {
  //       success: paymentIntent.status === 'succeeded',
  //       transactionId: paymentIntent.id,
  //       status: this.mapStripeStatus(paymentIntent.status),
  //       rawResponse: paymentIntent,
  //       message: `Payment ${paymentIntent.status}`,
  //     };
  //   } catch (error: any) {
  //     logger.error('Stripe verification error:', error);
  //     return {
  //       success: false,
  //       transactionId,
  //       status: 'failed',
  //       rawResponse: { error: error.message },
  //       message: error.message || 'Payment verification failed',
  //     };
  //   }
  // }

  private async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error: any) {
      logger.error('Webhook signature verification failed:', error.message);
      throw new ValidationError(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // private async handleStripeWebhook(event: Stripe.Event): Promise<void> {
  //   logger.info(`Processing Stripe webhook: ${event.type}`);
  //   const paymentIntent = event.data.object as Stripe.PaymentIntent;
  //   const transactionId = paymentIntent.id;

  //   switch (event.type) {
  //     case 'payment_intent.succeeded':
  //       await this.paymentService.handlePaymentSucceeded(transactionId, paymentIntent);
  //       break;

  //     case 'payment_intent.payment_failed':
  //       await this.paymentService.handlePaymentFailed(transactionId, paymentIntent);
  //       break;

  //     case 'payment_intent.canceled':
  //       await this.paymentService.handlePaymentCanceled(transactionId, paymentIntent);
  //       break;

  //     default:
  //       logger.warn(`Unhandled webhook event type: ${event.type}`);
  //   }
  // }

  async verifyPayment(verifyPaymentParam: VerifyPaymentParam): Promise<PaymentResult> {
    const { req } = verifyPaymentParam;
    let transactionId: string | undefined;

    try {
      const { body, headers } = req!;
      const signature = headers['stripe-signature'] as string;
      // Verify webhook signature
      const event = await this.verifyWebhookSignature(body, signature);

      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      transactionId = paymentIntent.id;

      // Process webhook event
      // await this.handleStripeWebhook(event);
      
      return {
        success: true,
        transactionId: transactionId!,
        status: this.mapStripeStatus(paymentIntent.status),
        rawResponse: paymentIntent,
        message: `Payment ${paymentIntent.status}`,
      }
    } catch (error: any) {
      logger.error('Stripe verification error:', error);
      return {
        success: false,
        transactionId: transactionId,
        status: 'failed',
        rawResponse: { error: error.message },
        message: error.message || 'Payment verification failed',
      };
    }
  }

  // async refundPayment(transactionId: string, amount?: string): Promise<PaymentResult> {
  //   try {
  //     const refundData: Stripe.RefundCreateParams = {
  //       payment_intent: transactionId,
  //     };

  //     if (amount) {
  //       refundData.amount = Math.round(parseFloat(amount) * 100);
  //     }

  //     const refund = await this.stripe.refunds.create(refundData);

  //     logger.info(`Stripe refund created: ${refund.id}`);

  //     return {
  //       success: refund.status === 'succeeded',
  //       transactionId: refund.id,
  //       status: refund.status === 'succeeded' ? 'completed' : 'failed',
  //       rawResponse: refund,
  //       message: 'Refund processed successfully',
  //     };
  //   } catch (error: any) {
  //     logger.error('Stripe refund error:', error);
  //     return {
  //       success: false,
  //       transactionId,
  //       status: 'failed',
  //       rawResponse: { error: error.message },
  //       message: error.message || 'Refund processing failed',
  //     };
  //   }
  // }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return 'completed';
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'pending';
      case 'canceled':
        return 'canceled';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
