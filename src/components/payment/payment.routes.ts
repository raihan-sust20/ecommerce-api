import { Router } from 'express';
import { container } from 'tsyringe';
import { PaymentController } from './payment.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { ProcessPaymentDto } from './dtos/process-payment.dto';

const router = Router();
const paymentController = container.resolve(PaymentController);

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "990e8400-e29b-41d4-a716-446655440000"
 *         order_id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         provider:
 *           type: string
 *           enum: [stripe, bkash]
 *           example: "stripe"
 *         transaction_id:
 *           type: string
 *           example: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *           example: "completed"
 *         amount:
 *           type: string
 *           example: "299.99"
 *         raw_response:
 *           type: object
 *           description: Raw response from payment provider
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/payments/process:
 *   post:
 *     tags: [Payments]
 *     summary: Process payment for an order
 *     description: |
 *       Process payment for an order using the specified payment provider.
 *       Supports Stripe and bKash payment methods. The order must be in 'pending' status.
 *       This endpoint uses the Strategy Pattern to handle different payment providers seamlessly.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Payment processing details including order ID and payment provider
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - provider
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the order to be paid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               provider:
 *                 type: string
 *                 enum: [stripe, bkash]
 *                 description: Payment provider to use
 *                 example: "stripe"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the payment
 *                 example:
 *                   customerName: "John Doe"
 *                   email: "john@example.com"
 *           example:
 *             orderId: "550e8400-e29b-41d4-a716-446655440000"
 *             provider: "stripe"
 *             metadata:
 *               customerName: "John Doe"
 *               email: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment processed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *             example:
 *               success: true
 *               message: "Payment processed successfully"
 *               data:
 *                 id: "990e8400-e29b-41d4-a716-446655440000"
 *                 order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 provider: "stripe"
 *                 transaction_id: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *                 status: "completed"
 *                 amount: "299.99"
 *                 raw_response:
 *                   id: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *                   object: "payment_intent"
 *                   amount: 29999
 *                   currency: "usd"
 *                   status: "succeeded"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T10:30:00Z"
*       400:
 *         description: Invalid request data or validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Provider must be either stripe or bkash"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Order not found"
 *       409:
 *         description: Order already paid or invalid status
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Order has already been paid"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post(
  '/process',
  authenticate,
  validateDto(ProcessPaymentDto),
  paymentController.processPayment
);

/**
 * @swagger
 * /api/v1/payments/verify/{transactionId}:
 *   post:
 *     tags: [Payments]
 *     summary: Verify payment status with provider
 *     description: |
 *       Verify the current status of a payment with the payment provider.
 *       This endpoint fetches the latest status from Stripe or bKash and updates
 *       the local payment record accordingly. Useful for webhook failures or manual verification.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The transaction ID from the payment provider
 *         example: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Payment verified successfully"
 *               data:
 *                 id: "990e8400-e29b-41d4-a716-446655440000"
 *                 order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 provider: "stripe"
 *                 transaction_id: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *                 status: "completed"
 *                 amount: "299.99"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T10:31:00Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Payment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post('/verify/:transactionId', authenticate, paymentController.verifyPayment);

/**
 * @swagger
 * /api/v1/payments/transaction/{transactionId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by transaction ID
 *     description: Retrieve payment details by transaction ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *         example: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Payment retrieved successfully"
 *               data:
 *                 id: "990e8400-e29b-41d4-a716-446655440000"
 *                 order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 provider: "stripe"
 *                 transaction_id: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *                 status: "completed"
 *                 amount: "299.99"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get('/transaction/:transactionId', authenticate, paymentController.getPaymentByTransactionId);

/**
 * @swagger
 * /api/v1/payments/order/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments for an order
 *     description: Retrieve all payment attempts for a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Payments retrieved successfully"
 *               data:
 *                 - id: "990e8400-e29b-41d4-a716-446655440000"
 *                   order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   provider: "stripe"
 *                   transaction_id: "pi_3OJqK2ABCDEFGHIJ1234567890"
 *                   status: "completed"
 *                   amount: "299.99"
 *                   created_at: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized
 */
router.get('/order/:orderId', authenticate, paymentController.getPaymentsByOrderId);

export default router;
