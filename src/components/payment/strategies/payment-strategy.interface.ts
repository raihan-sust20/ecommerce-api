export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  rawResponse: Record<string, any>;
  message?: string;
}

export interface PaymentStrategy {
  processPayment(orderId: string, amount: string, metadata?: Record<string, any>): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: string): Promise<PaymentResult>;
}
