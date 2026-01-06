import type { Request } from "express";

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  rawResponse: Record<string, any>;
  message?: string;
}

export interface VerifyPaymentParam {
  transactionId?: string;
  req?: Request;
}

export interface PaymentStrategy {
  processPayment(orderId: string, amount: string, metadata?: Record<string, any>): Promise<PaymentResult>;
  verifyPayment(verifyPaymentParam: VerifyPaymentParam): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: string): Promise<PaymentResult>;
}
