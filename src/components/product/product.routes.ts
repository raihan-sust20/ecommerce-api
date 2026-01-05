import { Router } from 'express';
import { container } from 'tsyringe';
import { ProductController } from './product.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
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
 *     
 *     UpdateProductRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Product name
 *           example: "iPhone 15 Pro Max 256GB"
 *         description:
 *           type: string
 *           minLength: 10
 *           description: Detailed product description
 *           example: "Updated description with new features"
 *         price:
 *           type: number
 *           format: decimal
 *           minimum: 0.01
 *           description: Product price (must be greater than 0)
 *           example: 1099.99
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity (0 or greater)
 *           example: 75
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Product status
 *           example: "active"
 *         categoryIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of category UUIDs (at least one required if provided)
 *           example: ["550e8400-e29b-41d4-a716-446655440000"]
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

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update an existing product
 *     description: |
 *       Updates a product. All fields are optional for partial updates. Admin access required.
 *       
 *       **Business Rules:**
 *       - SKU cannot be updated (immutable)
 *       - If categoryIds provided, all must exist and be active
 *       - At least one category required if updating categories
 *       - Price must be greater than 0 if provided
 *       - Stock must be 0 or greater if provided
 *     
 *     security:
 *       - bearerAuth: []
 *     
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product UUID
 *         example: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *     
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *           examples:
 *             updatePrice:
 *               summary: Update price only
 *               value:
 *                 price: 1099.99
 *             
 *             updateStock:
 *               summary: Update stock and status
 *               value:
 *                 stock: 75
 *                 status: "active"
 *             
 *             updateCategories:
 *               summary: Update categories
 *               value:
 *                 categoryIds:
 *                   - "550e8400-e29b-41d4-a716-446655440000"
 *                   - "880e8400-e29b-41d4-a716-446655440003"
 *             
 *             fullUpdate:
 *               summary: Update multiple fields
 *               value:
 *                 name: "iPhone 15 Pro Max 256GB"
 *                 description: "Updated with new features and improved battery life"
 *                 price: 1199.99
 *                 stock: 100
 *                 status: "active"
 *                 categoryIds:
 *                   - "550e8400-e29b-41d4-a716-446655440000"
 *     
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Product updated successfully"
 *               data:
 *                 id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                 sku: "IPHONE-15-PRO-256"
 *                 name: "iPhone 15 Pro Max 256GB"
 *                 description: "Updated with new features and improved battery life"
 *                 price: 1199.99
 *                 stock: 100
 *                 status: "active"
 *                 categories:
 *                   - id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Electronics"
 *                     slug: "electronics"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T14:45:00.000Z"
 *       
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             examples:
 *               invalidPrice:
 *                 value:
 *                   success: false
 *                   message: "Price must be greater than 0"
 *               negativeStock:
 *                 value:
 *                   success: false
 *                   message: "Stock must be 0 or greater"
 *               inactiveCategories:
 *                 value:
 *                   success: false
 *                   message: "Cannot update product with inactive categories: Discontinued Items"
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
 *         description: Product or categories not found
 *         content:
 *           application/json:
 *             examples:
 *               productNotFound:
 *                 value:
 *                   success: false
 *                   message: "Product with ID '8d0e7680-8536-51ef-055c-f18gd2g01bf8' not found"
 *               categoriesNotFound:
 *                 value:
 *                   success: false
 *                   message: "Categories not found: 550e8400-e29b-41d4-a716-446655440000"
 *       
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validateDto(UpdateProductDto),
  productController.updateProduct
);

router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products with filtering, search, and pagination
 *     description: |
 *       Retrieves a paginated list of products with comprehensive filtering and search capabilities.
 *       
 *       ## Features
 *       - **Pagination**: Control page number and items per page
 *       - **Category Filtering**: Filter by specific category
 *       - **Status Filtering**: Filter by active/inactive status
 *       - **Search**: Full-text search across name, SKU, and description
 *       - **Price Range**: Filter by minimum and/or maximum price
 *       - **Sorting**: Sort by name, price, stock, or creation date
 *       - **Caching**: Results are cached for improved performance
 *       
 *       ## Query Parameters
 *       
 *       ### Pagination Parameters
 *       - "page" (integer, optional): Page number starting from 1. Default: 1
 *       - "limit" (integer, optional): Number of items per page. Min: 1, Max: 100, Default: 10
 *       
 *       ### Filter Parameters
 *       - "categoryId" (string, optional): UUID of category to filter by
 *       - "status" (enum, optional): Product status - either 'active' or 'inactive'
 *       - "search" (string, optional): Search term to match against product name, SKU, or description (case-insensitive)
 *       - "minPrice" (number, optional): Minimum price (inclusive). Must be >= 0
 *       - "maxPrice" (number, optional): Maximum price (inclusive). Must be >= 0
 *       
 *       ### Sorting Parameters
 *       - "sortBy" (enum, optional): Field to sort by. Options: 'name', 'price', 'stock', 'createdAt'. Default: 'createdAt'
 *       - "sortOrder" (enum, optional): Sort direction. Options: 'ASC' (ascending), 'DESC' (descending). Default: 'DESC'
 *       
 *       ## Response Structure
 *       The response includes both the data array and pagination metadata:
 *       - "data": Array of product objects with their categories
 *       - "pagination": Object containing pagination information (page, limit, total, totalPages, hasNext, hasPrev)
 *     
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination (starts at 1)
 *         example: 1
 *       
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *         example: 20
 *       
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter products by category UUID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by product status
 *         example: "active"
 *       
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, SKU, or description (case-insensitive partial match)
 *         example: "iphone"
 *       
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0
 *         description: Minimum price filter (inclusive)
 *         example: 500.00
 *       
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0
 *         description: Maximum price filter (inclusive)
 *         example: 1500.00
 *       
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, stock, createdAt]
 *           default: createdAt
 *         description: Field to sort results by
 *         example: "price"
 *       
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order direction (ASC = ascending, DESC = descending)
 *         example: "ASC"
 *     
 *     responses:
 *       200:
 *         description: Products retrieved successfully with pagination
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
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: Array of product objects
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Unique product identifier
 *                           sku:
 *                             type: string
 *                             description: Stock Keeping Unit
 *                           name:
 *                             type: string
 *                             description: Product name
 *                           description:
 *                             type: string
 *                             description: Product description
 *                           price:
 *                             type: number
 *                             format: decimal
 *                             description: Product price
 *                           stock:
 *                             type: integer
 *                             description: Available stock quantity
 *                           status:
 *                             type: string
 *                             enum: [active, inactive]
 *                             description: Product status
 *                           categories:
 *                             type: array
 *                             description: Associated categories
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                 slug:
 *                                   type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       description: Pagination metadata
 *                       properties:
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           description: Items per page
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           description: Total number of items matching criteria
 *                           example: 47
 *                         totalPages:
 *                           type: integer
 *                           description: Total number of pages
 *                           example: 5
 *                         hasNext:
 *                           type: boolean
 *                           description: Whether there are more pages after current
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           description: Whether there are pages before current
 *                           example: false
 *             
 *             examples:
 *               basicPagination:
 *                 summary: Basic pagination (page 1)
 *                 value:
 *                   success: true
 *                   message: "Success"
 *                   data:
 *                     data:
 *                       - id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                         sku: "IPHONE-15-PRO-256"
 *                         name: "iPhone 15 Pro 256GB"
 *                         description: "Latest iPhone with A17 Pro chip and titanium design"
 *                         price: 999.99
 *                         stock: 50
 *                         status: "active"
 *                         categories:
 *                           - id: "550e8400-e29b-41d4-a716-446655440000"
 *                             name: "Electronics"
 *                             slug: "electronics"
 *                           - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                             name: "Smartphones"
 *                             slug: "smartphones"
 *                         createdAt: "2024-01-15T10:30:00.000Z"
 *                         updatedAt: "2024-01-15T10:30:00.000Z"
 *                       - id: "9e1e8791-9647-62fg-166d-g29he3h12cg9"
 *                         sku: "MACBOOK-PRO-16-M3"
 *                         name: "MacBook Pro 16-inch M3"
 *                         description: "Powerful laptop with M3 chip"
 *                         price: 2499.00
 *                         stock: 25
 *                         status: "active"
 *                         categories:
 *                           - id: "550e8400-e29b-41d4-a716-446655440000"
 *                             name: "Electronics"
 *                             slug: "electronics"
 *                           - id: "660e8400-e29b-41d4-a716-446655440001"
 *                             name: "Laptops"
 *                             slug: "laptops"
 *                         createdAt: "2024-01-14T08:20:00.000Z"
 *                         updatedAt: "2024-01-14T08:20:00.000Z"
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 47
 *                       totalPages: 5
 *                       hasNext: true
 *                       hasPrev: false
 *               
 *               filteredByCategory:
 *                 summary: Filtered by category with search
 *                 value:
 *                   success: true
 *                   message: "Success"
 *                   data:
 *                     data:
 *                       - id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                         sku: "IPHONE-15-PRO-256"
 *                         name: "iPhone 15 Pro 256GB"
 *                         description: "Latest iPhone with A17 Pro chip"
 *                         price: 999.99
 *                         stock: 50
 *                         status: "active"
 *                         categories:
 *                           - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                             name: "Smartphones"
 *                             slug: "smartphones"
 *                         createdAt: "2024-01-15T10:30:00.000Z"
 *                         updatedAt: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       total: 15
 *                       totalPages: 1
 *                       hasNext: false
 *                       hasPrev: false
 *               
 *               sortedByPrice:
 *                 summary: Sorted by price (ascending)
 *                 value:
 *                   success: true
 *                   message: "Success"
 *                   data:
 *                     data:
 *                       - id: "af2f9802-a758-73gh-277e-h30if4i23dha"
 *                         sku: "AIRPODS-PRO-2"
 *                         name: "AirPods Pro 2nd Generation"
 *                         description: "Premium wireless earbuds"
 *                         price: 249.99
 *                         stock: 100
 *                         status: "active"
 *                         categories:
 *                           - id: "770e8400-e29b-41d4-a716-446655440002"
 *                             name: "Audio"
 *                             slug: "audio"
 *                         createdAt: "2024-01-13T15:45:00.000Z"
 *                         updatedAt: "2024-01-13T15:45:00.000Z"
 *                       - id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                         sku: "IPHONE-15-PRO-256"
 *                         name: "iPhone 15 Pro 256GB"
 *                         description: "Latest iPhone with A17 Pro chip"
 *                         price: 999.99
 *                         stock: 50
 *                         status: "active"
 *                         categories:
 *                           - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                             name: "Smartphones"
 *                             slug: "smartphones"
 *                         createdAt: "2024-01-15T10:30:00.000Z"
 *                         updatedAt: "2024-01-15T10:30:00.000Z"
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 47
 *                       totalPages: 5
 *                       hasNext: true
 *                       hasPrev: false
 *               
 *               emptyResults:
 *                 summary: No products found (empty result)
 *                 value:
 *                   success: true
 *                   message: "Success"
 *                   data:
 *                     data: []
 *                     pagination:
 *                       page: 1
 *                       limit: 10
 *                       total: 0
 *                       totalPages: 0
 *                       hasNext: false
 *                       hasPrev: false
 *       
 *       400:
 *         description: Bad Request - Invalid query parameters
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
 *               invalidPage:
 *                 summary: Invalid page number
 *                 value:
 *                   success: false
 *                   message: "page must not be less than 1"
 *               
 *               invalidLimit:
 *                 summary: Limit exceeds maximum
 *                 value:
 *                   success: false
 *                   message: "limit must not be greater than 100"
 *               
 *               invalidStatus:
 *                 summary: Invalid status value
 *                 value:
 *                   success: false
 *                   message: "status must be one of the following values: active, inactive"
 *               
 *               invalidSortBy:
 *                 summary: Invalid sort field
 *                 value:
 *                   success: false
 *                   message: "sortBy must be one of the following values: name, price, stock, createdAt"
 *               
 *               invalidPrice:
 *                 summary: Negative price value
 *                 value:
 *                   success: false
 *                   message: "minPrice must not be less than 0"
 *       
 *       500:
 *         description: Internal Server Error
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
router.get('/', productController.getProducts);

export default router;