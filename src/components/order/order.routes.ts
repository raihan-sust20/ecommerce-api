import { Router } from 'express';
import { container } from 'tsyringe';
import { OrderController } from './order.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { CreateOrderDto } from './dtos/create-order.dto';

const router = Router();
const orderController = container.resolve(OrderController);

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         user_id:
 *           type: string
 *           format: uuid
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *         total_amount:
 *           type: string
 *           example: "299.99"
 *           description: Total amount in decimal format
 *         status:
 *           type: string
 *           enum: [pending, paid, canceled]
 *           example: "paid"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         user:
 *           $ref: '#/components/schemas/User'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         order_id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *           format: uuid
 *         price:
 *           type: string
 *           example: "99.99"
 *         quantity:
 *           type: integer
 *           example: 2
 *         subtotal:
 *           type: string
 *           example: "199.98"
 *         product:
 *           $ref: '#/components/schemas/Product'
 *     PaginatedOrders:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 45
 *             totalPages:
 *               type: integer
 *               example: 5
 *             hasNext:
 *               type: boolean
 *               example: true
 *             hasPrev:
 *               type: boolean
 *               example: false
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *         error:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     description: Creates a new order for the authenticated user with the specified products and quantities. The order will be created with 'pending' status. Stock is validated but not decremented until payment is completed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Order details including array of products with their quantities and prices
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of order items containing product details
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                     - price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                       description: UUID of the product to order
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity of the product to order
 *                       example: 2
 *                     price:
 *                       type: number
 *                       format: decimal
 *                       minimum: 0
 *                       description: Current price of the product (must match product's actual price)
 *                       example: 29.99
 *           examples:
 *             singleProduct:
 *               summary: Order with single product
 *               value:
 *                 items:
 *                   - product_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     quantity: 2
 *                     price: 29.99
 *             multipleProducts:
 *               summary: Order with multiple products
 *               value:
 *                 items:
 *                   - product_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     quantity: 2
 *                     price: 29.99
 *                   - product_id: "b2c3d4e5-f6g7-8901-bcde-fg2345678901"
 *                     quantity: 1
 *                     price: 149.99
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: "Order created successfully. Please proceed to payment."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Unique order identifier
 *                       example: "c3d4e5f6-g7h8-9012-cdef-gh3456789012"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       description: UUID of the user who placed the order
 *                       example: "d4e5f6g7-h8i9-0123-defg-hi4567890123"
 *                     total_amount:
 *                       type: string
 *                       description: Total order amount (calculated from items)
 *                       example: "209.97"
 *                     status:
 *                       type: string
 *                       enum: [pending, paid, canceled]
 *                       description: Current order status
 *                       example: "pending"
 *                     items:
 *                       type: array
 *                       description: Array of order items with product details
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "e5f6g7h8-i9j0-1234-efgh-ij5678901234"
 *                           order_id:
 *                             type: string
 *                             format: uuid
 *                             example: "c3d4e5f6-g7h8-9012-cdef-gh3456789012"
 *                           product_id:
 *                             type: string
 *                             format: uuid
 *                             example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                           price:
 *                             type: string
 *                             example: "29.99"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           subtotal:
 *                             type: string
 *                             example: "59.98"
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               sku:
 *                                 type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-05T10:30:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-05T10:30:00.000Z"
 *             examples:
 *               successResponse:
 *                 summary: Successful order creation
 *                 value:
 *                   success: true
 *                   message: "Order created successfully. Please proceed to payment."
 *                   data:
 *                     id: "c3d4e5f6-g7h8-9012-cdef-gh3456789012"
 *                     user_id: "d4e5f6g7-h8i9-0123-defg-hi4567890123"
 *                     total_amount: "209.97"
 *                     status: "pending"
 *                     items:
 *                       - id: "e5f6g7h8-i9j0-1234-efgh-ij5678901234"
 *                         order_id: "c3d4e5f6-g7h8-9012-cdef-gh3456789012"
 *                         product_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                         price: "29.99"
 *                         quantity: 2
 *                         subtotal: "59.98"
 *                         product:
 *                           id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                           name: "Wireless Mouse"
 *                           sku: "WM-001"
 *                       - id: "f6g7h8i9-j0k1-2345-fghi-jk6789012345"
 *                         order_id: "c3d4e5f6-g7h8-9012-cdef-gh3456789012"
 *                         product_id: "b2c3d4e5-f6g7-8901-bcde-fg2345678901"
 *                         price: "149.99"
 *                         quantity: 1
 *                         subtotal: "149.99"
 *                         product:
 *                           id: "b2c3d4e5-f6g7-8901-bcde-fg2345678901"
 *                           name: "Mechanical Keyboard"
 *                           sku: "MK-002"
 *                     created_at: "2025-01-05T10:30:00.000Z"
 *                     updated_at: "2025-01-05T10:30:00.000Z"
 *       400:
 *         description: Validation error - Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               emptyItems:
 *                 summary: Empty items array
 *                 value:
 *                   success: false
 *                   message: "Order must contain at least one item"
 *               invalidQuantity:
 *                 summary: Invalid quantity
 *                 value:
 *                   success: false
 *                   message: "Quantity must be at least 1"
 *               insufficientStock:
 *                 summary: Insufficient stock
 *                 value:
 *                   success: false
 *                   message: "Insufficient stock for product \"Wireless Mouse\". Available: 5, Requested: 10"
 *               priceMismatch:
 *                 summary: Price mismatch
 *                 value:
 *                   success: false
 *                   message: "Price mismatch for product \"Wireless Mouse\". Current price: 29.99, Provided: 25.00"
 *               productNotAvailable:
 *                 summary: Product not available
 *                 value:
 *                   success: false
 *                   message: "Product \"Wireless Mouse\" is not available for purchase"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               productNotFound:
 *                 summary: Product does not exist
 *                 value:
 *                   success: false
 *                   message: "Product with ID a1b2c3d4-e5f6-7890-abcd-ef1234567890 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post(
  '/',
  authenticate,
  validateDto(CreateOrderDto),
  orderController.createOrder
);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders with filtering and pagination
 *     description: |
 *       Retrieve a paginated list of orders. Admin users can see all orders,
 *       while regular users will only see their own orders unless userId filter is used.
 *       Results can be filtered by status and userId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, canceled]
 *         description: Filter orders by status
 *         example: paid
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter orders by user ID (admin only)
 *         example: "660e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                   example: "Orders retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedOrders'
 *             example:
 *               success: true
 *               message: "Orders retrieved successfully"
 *               data:
 *                 data:
 *                   - id: "550e8400-e29b-41d4-a716-446655440000"
 *                     user_id: "660e8400-e29b-41d4-a716-446655440001"
 *                     total_amount: "299.99"
 *                     status: "paid"
 *                     created_at: "2024-01-15T10:30:00Z"
 *                     updated_at: "2024-01-15T10:30:00Z"
 *                     user:
 *                       id: "660e8400-e29b-41d4-a716-446655440001"
 *                       email: "john.doe@example.com"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                     items:
 *                       - id: "770e8400-e29b-41d4-a716-446655440002"
 *                         order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                         product_id: "880e8400-e29b-41d4-a716-446655440003"
 *                         price: "99.99"
 *                         quantity: 2
 *                         subtotal: "199.98"
 *                         product:
 *                           id: "880e8400-e29b-41d4-a716-446655440003"
 *                           name: "Wireless Headphones"
 *                           price: "99.99"
 *                       - id: "770e8400-e29b-41d4-a716-446655440004"
 *                         order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                         product_id: "880e8400-e29b-41d4-a716-446655440005"
 *                         price: "49.99"
 *                         quantity: 2
 *                         subtotal: "99.98"
 *                         product:
 *                           id: "880e8400-e29b-41d4-a716-446655440005"
 *                           name: "Phone Case"
 *                           price: "49.99"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 45
 *                   totalPages: 5
 *                   hasNext: true
 *                   hasPrev: false
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Status must be one of: pending, paid, canceled"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Insufficient permissions"
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Too many requests from this IP, please try again later."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.get('/', authenticate, orderController.getOrders);

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get current user's orders
 *     description: Retrieve a paginated list of orders belonging to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *         example: 10
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
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
 *                   example: "User orders retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedOrders'
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.get('/my-orders', authenticate, orderController.getUserOrders);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     description: Retrieve detailed information about a specific order by its ID. Users can only access their own orders unless they are admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
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
 *                   example: "Order retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               message: "Order retrieved successfully"
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 user_id: "660e8400-e29b-41d4-a716-446655440001"
 *                 total_amount: "299.99"
 *                 status: "paid"
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T10:30:00Z"
 *                 user:
 *                   id: "660e8400-e29b-41d4-a716-446655440001"
 *                   email: "john.doe@example.com"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                 items:
 *                   - id: "770e8400-e29b-41d4-a716-446655440002"
 *                     order_id: "550e8400-e29b-41d4-a716-446655440000"
 *                     product_id: "880e8400-e29b-41d4-a716-446655440003"
 *                     price: "99.99"
 *                     quantity: 2
 *                     subtotal: "199.98"
 *                     product:
 *                       id: "880e8400-e29b-41d4-a716-446655440003"
 *                       name: "Wireless Headphones"
 *                       description: "High-quality wireless headphones"
 *                       price: "99.99"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.get('/:id', authenticate, orderController.getOrderById);

export default router;
