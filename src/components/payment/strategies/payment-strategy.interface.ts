import type { Request } from "express";
import type { PaymentStatus } from "../entities/payment.entity";
export interface PaymentResult {
  success: boolean;
  transactionId: string | undefined;
  status: PaymentStatus;
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
  // refundPayment(transactionId: string, amount?: string): Promise<PaymentResult>;
}
