import axios from 'axios';
import { injectable } from 'tsyringe';
import { PaymentStrategy, PaymentResult, type VerifyPaymentParam } from './payment-strategy.interface';
import { env } from '../../../config/env.config';
import { logger } from '../../../shared/utils/logger.util';

interface BkashTokenResponse {
  id_token: string;
  expires_in: number;
  token_type: string;
}

interface BkashPaymentResponse {
  paymentID: string;
  bkashURL: string;
  transactionStatus: string;
  statusCode: string;
  statusMessage: string;
}

@injectable()
export class BkashPaymentStrategy implements PaymentStrategy {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private username: string;
  private password: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.baseUrl = env.BKASH_BASE_URL;
    this.appKey = env.BKASH_APP_KEY;
    this.appSecret = env.BKASH_APP_SECRET;
    this.username = env.BKASH_USERNAME;
    this.password = env.BKASH_PASSWORD;
  }

  async processPayment(
    orderId: string,
    amount: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      const token = await this.getToken();

      const response = await axios.post<BkashPaymentResponse>(
        `${this.baseUrl}/checkout/payment/create`,
        {
          mode: '0011',
          payerReference: orderId,
          callbackURL: `${env.APP_URL}/api/v1/payments/bkash/callback`,
          amount: amount,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: `INV-${orderId}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.appKey,
          },
        }
      );

      const data = response.data;

      logger.info(`bKash payment created: ${data.paymentID}`);

      return {
        success: data.statusCode === '0000',
        transactionId: data.paymentID,
        status: this.mapBkashStatus(data.transactionStatus),
        rawResponse: data,
        message: data.statusMessage || 'Payment initiated successfully',
      };
    } catch (error: any) {
      logger.error('bKash payment error:', error);
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        rawResponse: { error: error.message },
        message: error.response?.data?.statusMessage || 'Payment processing failed',
      };
    }
  }

  async verifyPayment(verifyPaymentParam: VerifyPaymentParam): Promise<PaymentResult> {
    const { transactionId } = verifyPaymentParam;
    try {
      const token = await this.getToken();

      const response = await axios.post(
        `${this.baseUrl}/checkout/payment/query`,
        {
          paymentID: transactionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.appKey,
          },
        }
      );

      const data = response.data;

      return {
        success: data.transactionStatus === 'Completed',
        transactionId: data.paymentID,
        status: this.mapBkashStatus(data.transactionStatus),
        rawResponse: data,
        message: data.statusMessage || 'Payment verified',
      };
    } catch (error: any) {
      logger.error('bKash verification error:', error);
      return {
        success: false,
        transactionId: transactionId!,
        status: 'failed',
        rawResponse: { error: error.message },
        message: error.response?.data?.statusMessage || 'Payment verification failed',
      };
    }
  }

  async refundPayment(transactionId: string, amount?: string): Promise<PaymentResult> {
    try {
      const token = await this.getToken();

      const response = await axios.post(
        `${this.baseUrl}/checkout/payment/refund`,
        {
          paymentID: transactionId,
          amount: amount,
          trxID: transactionId,
          sku: 'refund',
          reason: 'Customer requested refund',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.appKey,
          },
        }
      );

      const data = response.data;

      logger.info(`bKash refund created: ${data.refundTrxID}`);

      return {
        success: data.statusCode === '0000',
        transactionId: data.refundTrxID,
        status: data.transactionStatus === 'Completed' ? 'completed' : 'failed',
        rawResponse: data,
        message: data.statusMessage || 'Refund processed successfully',
      };
    } catch (error: any) {
      logger.error('bKash refund error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        rawResponse: { error: error.message },
        message: error.response?.data?.statusMessage || 'Refund processing failed',
      };
    }
  }

  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    try {
      const response = await axios.post<BkashTokenResponse>(
        `${this.baseUrl}/checkout/token/grant`,
        {
          app_key: this.appKey,
          app_secret: this.appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            username: this.username,
            password: this.password,
          },
        }
      );

      const { id_token, expires_in } = response.data;

      // Cache token with expiry (subtract 60 seconds for safety)
      this.tokenCache = {
        token: id_token,
        expiresAt: Date.now() + (expires_in - 60) * 1000,
      };

      return id_token;
    } catch (error: any) {
      logger.error('bKash token generation error:', error);
      throw new Error('Failed to generate bKash token');
    }
  }

  private mapBkashStatus(
    bkashStatus: string
  ): 'pending' | 'completed' | 'failed' {
    switch (bkashStatus.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'initiated':
      case 'inprogress':
        return 'pending';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
