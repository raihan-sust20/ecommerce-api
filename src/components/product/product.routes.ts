import { Router } from 'express';
import { container } from 'tsyringe';
import { ProductController } from './product.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { CreateProductDto } from './dtos/create-product.dto';
import { UserRole } from '../user/entities/user.entity';

const router = Router();
const productController = container.resolve(ProductController);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique product identifier
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (unique)
 *           example: "IPHONE-15-PRO-256"
 *         name:
 *           type: string
 *           description: Product name
 *           example: "iPhone 15 Pro 256GB"
 *         description:
 *           type: string
 *           description: Detailed product description
 *           example: "Latest iPhone with A17 Pro chip and titanium design"
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *           example: 999.99
 *         stock:
 *           type: integer
 *           description: Available stock quantity
 *           example: 50
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Product status
 *           example: "active"
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - description
 *         - price
 *         - stock
 *         - categoryIds
 *       properties:
 *         sku:
 *           type: string
 *           minLength: 3
 *           description: Unique Stock Keeping Unit identifier
 *           example: "IPHONE-15-PRO-256"
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Product name
 *           example: "iPhone 15 Pro 256GB"
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Detailed product description
 *           example: "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system"
 *         price:
 *           type: number
 *           format: decimal
 *           minimum: 0.01
 *           description: Product price (must be greater than 0)
 *           example: 999.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity (0 or greater)
 *           example: 50
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Product status (defaults to 'active')
 *           example: "active"
 *         categoryIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of category UUIDs (at least one required)
 *           example: ["550e8400-e29b-41d4-a716-446655440000", "7c9e6679-7425-40de-944b-e07fc1f90ae7"]
 */

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     description: |
 *       Creates a new product with categories. Admin access required.
 *       
 *       **Business Rules:**
 *       - SKU must be unique across all products
 *       - At least one category is required
 *       - All category IDs must exist and be active
 *       - Price must be greater than 0
 *       - Stock must be 0 or greater
 *       - Status defaults to 'active' if not provided
 *     
 *     security:
 *       - bearerAuth: []
 *     
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *           examples:
 *             smartphone:
 *               summary: Create a smartphone product
 *               value:
 *                 sku: "IPHONE-15-PRO-256"
 *                 name: "iPhone 15 Pro 256GB"
 *                 description: "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system"
 *                 price: 999.99
 *                 stock: 50
 *                 status: "active"
 *                 categoryIds:
 *                   - "550e8400-e29b-41d4-a716-446655440000"
 *                   - "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *             
 *             laptop:
 *               summary: Create a laptop product
 *               value:
 *                 sku: "MACBOOK-PRO-16-M3"
 *                 name: "MacBook Pro 16-inch M3"
 *                 description: "Powerful laptop with M3 chip, 16GB RAM, and stunning Retina display"
 *                 price: 2499.00
 *                 stock: 25
 *                 categoryIds:
 *                   - "660e8400-e29b-41d4-a716-446655440001"
 *             
 *             outOfStock:
 *               summary: Create product with zero stock
 *               value:
 *                 sku: "AIRPODS-PRO-2"
 *                 name: "AirPods Pro 2nd Generation"
 *                 description: "Premium wireless earbuds with active noise cancellation and spatial audio"
 *                 price: 249.99
 *                 stock: 0
 *                 status: "inactive"
 *                 categoryIds:
 *                   - "770e8400-e29b-41d4-a716-446655440002"
 *     
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               message: "Product created successfully"
 *               data:
 *                 id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                 sku: "IPHONE-15-PRO-256"
 *                 name: "iPhone 15 Pro 256GB"
 *                 description: "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system"
 *                 price: 999.99
 *                 stock: 50
 *                 status: "active"
 *                 categories:
 *                   - id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Electronics"
 *                     slug: "electronics"
 *                   - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                     name: "Smartphones"
 *                     slug: "smartphones"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       
 *       400:
 *         description: Validation error
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
 *               skuTooShort:
 *                 summary: SKU too short
 *                 value:
 *                   success: false
 *                   message: "SKU must be at least 3 characters"
 *               invalidPrice:
 *                 summary: Invalid price
 *                 value:
 *                   success: false
 *                   message: "Price must be greater than 0"
 *               negativeStock:
 *                 summary: Negative stock
 *                 value:
 *                   success: false
 *                   message: "Stock must be 0 or greater"
 *               noCategoriesProvided:
 *                 summary: No categories provided
 *                 value:
 *                   success: false
 *                   message: "At least one category is required"
 *               invalidCategoryId:
 *                 summary: Invalid category ID format
 *                 value:
 *                   success: false
 *                   message: "Each category ID must be a valid UUID"
 *               inactiveCategories:
 *                 summary: Inactive categories
 *                 value:
 *                   success: false
 *                   message: "Cannot create product with inactive categories: Discontinued Items"
 *       
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       
 *       403:
 *         description: Forbidden (Admin only)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Insufficient permissions"
 *       
 *       404:
 *         description: Categories not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Categories not found: 550e8400-e29b-41d4-a716-446655440000, 7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *       
 *       409:
 *         description: SKU already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Product with SKU 'IPHONE-15-PRO-256' already exists"
 *       
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateDto(CreateProductDto),
  productController.createProduct
);

router.get('/:id', productController.getProductById);

export default router;
