import { Router } from 'express';
import { container } from 'tsyringe';
import { CategoryController } from './category.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UserRole } from '../user/entities/user.entity';
import { UpdateCategoryDto } from './dtos/update-category.dto';

const router = Router();
const categoryController = container.resolve(CategoryController);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the category
 *         name:
 *           type: string
 *           description: Display name of the category
 *           example: "Smartphones"
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *           example: "smartphones"
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *           example: "Latest smartphones from top brands"
 *         parent:
 *           type: object
 *           nullable: true
 *           description: Parent category (null for root categories)
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *         path:
 *           type: string
 *           description: Materialized path for hierarchy
 *           example: "electronics/phones/smartphones"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           description: Display name of the category
 *           example: "Smartphones"
 *         slug:
 *           type: string
 *           minLength: 2
 *           pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *           description: URL-friendly identifier (lowercase, alphanumeric with hyphens)
 *           example: "smartphones"
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *           example: "Discover the latest smartphones with cutting-edge technology"
 *         parentId:
 *           type: string
 *           format: uuid
 *           description: ID of the parent category (optional, null for root categories)
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         isActive:
 *           type: boolean
 *           description: Whether the category should be active
 *           default: true
 *           example: true
 *
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Category created successfully"
 *         data:
 *           $ref: '#/components/schemas/Category'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Category with slug 'smartphones' already exists"
 */

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     description: |
 *       Creates a new product category. Categories can be nested by providing a parentId.
 *
 *       **Business Rules:**
 *       - Slug must be unique across all categories
 *       - Slug format: lowercase alphanumeric with hyphens (e.g., electronics-phones)
 *       - Cannot create a category under an inactive parent
 *       - Materialized path is automatically generated for hierarchy navigation
 *
 *       **Examples:**
 *       - Root category: "{ "name": "Electronics", "slug": "electronics" }"
 *       - Child category: "{ "name": "Phones", "slug": "phones", "parentId": "parent-uuid" }"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *           examples:
 *             rootCategory:
 *               summary: Create a root category
 *               value:
 *                 name: "Electronics"
 *                 slug: "electronics"
 *                 description: "Electronic devices and accessories"
 *                 isActive: true
 *             childCategory:
 *               summary: Create a child category
 *               value:
 *                 name: "Smartphones"
 *                 slug: "smartphones"
 *                 description: "Latest smartphones from top brands"
 *                 parentId: "550e8400-e29b-41d4-a716-446655440000"
 *                 isActive: true
 *             nestedCategory:
 *               summary: Create a deeply nested category
 *               value:
 *                 name: "iPhone"
 *                 slug: "iphone"
 *                 description: "Apple iPhone series"
 *                 parentId: "660e8400-e29b-41d4-a716-446655440001"
 *                 isActive: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *             example:
 *               success: true
 *               message: "Category created successfully"
 *               data:
 *                 id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                 name: "Smartphones"
 *                 slug: "smartphones"
 *                 description: "Latest smartphones from top brands"
 *                 parent:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                 isActive: true
 *                 path: "electronics/smartphones"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidSlug:
 *                 summary: Invalid slug format
 *                 value:
 *                   success: false
 *                   message: "Slug must be lowercase alphanumeric with hyphens only (e.g., electronics-phones)"
 *               missingName:
 *                 summary: Missing required field
 *                 value:
 *                   success: false
 *                   message: "Name must be at least 2 characters"
 *               inactiveParent:
 *                 summary: Inactive parent category
 *                 value:
 *                   success: false
 *                   message: "Cannot create category under an inactive parent"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Insufficient permissions (Admin only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Insufficient permissions"
 *       404:
 *         description: Parent category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Parent category with ID '550e8400-e29b-41d4-a716-446655440000' not found"
 *       409:
 *         description: Conflict - Slug already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Category with slug 'smartphones' already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateDto(CreateCategoryDto),
  categoryController.createCategory
);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update an existing category
 *     description: |
 *       Updates a product category. All fields are optional for partial updates.
 *
 *       **Key Rules:**
 *       - Slug must be unique and lowercase-with-hyphens format
 *       - Cannot self-reference or create circular hierarchies
 *       - Cannot move under inactive parent
 *       - Set "parentId: null" to move to root level
 *       - Changing slug or parent triggers path recalculation for all descendants
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
 *         description: Category UUID
 *         example: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Mobile Phones"
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly identifier (triggers path recalculation)
 *                 example: "mobile-phones"
 *               description:
 *                 type: string
 *                 example: "Wide range of mobile phones from various brands"
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Parent category ID (null = root level, omit = no change)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *
 *           examples:
 *             updateName:
 *               summary: Update name only
 *               value:
 *                 name: "Mobile Phones"
 *
 *             updateSlug:
 *               summary: Change slug (recalculates paths)
 *               value:
 *                 slug: "mobile-phones"
 *
 *             changeParent:
 *               summary: Move to different parent
 *               value:
 *                 parentId: "660e8400-e29b-41d4-a716-446655440001"
 *
 *             moveToRoot:
 *               summary: Move to root level
 *               value:
 *                 parentId: null
 *
 *             fullUpdate:
 *               summary: Update multiple fields
 *               value:
 *                 name: "Mobile Devices"
 *                 slug: "mobile-devices"
 *                 description: "All types of mobile devices"
 *                 parentId: "550e8400-e29b-41d4-a716-446655440000"
 *                 isActive: true
 *
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: "Category updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     parent:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                     isActive:
 *                       type: boolean
 *                     path:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *             example:
 *               success: true
 *               message: "Category updated successfully"
 *               data:
 *                 id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                 name: "Mobile Phones"
 *                 slug: "mobile-phones"
 *                 description: "Latest smartphones from top brands"
 *                 parent:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                 isActive: true
 *                 path: "electronics/mobile-phones"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T14:22:00.000Z"
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
 *               selfReference:
 *                 summary: Self-referencing
 *                 value:
 *                   success: false
 *                   message: "Category cannot be its own parent"
 *               circularReference:
 *                 summary: Circular reference
 *                 value:
 *                   success: false
 *                   message: "Cannot move category under its own descendant"
 *               inactiveParent:
 *                 summary: Inactive parent
 *                 value:
 *                   success: false
 *                   message: "Cannot move category under an inactive parent"
 *               invalidSlug:
 *                 summary: Invalid slug format
 *                 value:
 *                   success: false
 *                   message: "Slug must be lowercase alphanumeric with hyphens only"
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
 *         description: Category or parent not found
 *         content:
 *           application/json:
 *             examples:
 *               categoryNotFound:
 *                 value:
 *                   success: false
 *                   message: "Category with ID '7c9e6679-7425-40de-944b-e07fc1f90ae7' not found"
 *               parentNotFound:
 *                 value:
 *                   success: false
 *                   message: "Parent category with ID '550e8400-e29b-41d4-a716-446655440000' not found"
 *
 *       409:
 *         description: Slug already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Category with slug 'mobile-phones' already exists"
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
  validateDto(UpdateCategoryDto),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories with filtering
 *     description: |
 *       Retrieves categories with optional filtering and sorting.
 *
 *       **Query Parameters:**
 *       - "parentId": Filter by parent category
 *       - "rootOnly": Get only root-level categories
 *       - "activeOnly": Get only active categories
 *       - "search": Search in name and description
 *       - "sortBy": Sort by field (name, createdAt, updatedAt)
 *       - "sortOrder": ASC or DESC
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent category ID
 *       - in: query
 *         name: rootOnly
 *         schema:
 *           type: boolean
 *         description: Get only root categories
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Get only active categories
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                   description: "Electronic devices and accessories"
 *                   parent: null
 *                   children:
 *                     - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                       name: "Smartphones"
 *                       slug: "smartphones"
 *                   isActive: true
 *                   path: "electronics"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/tree:
 *   get:
 *     tags: [Categories]
 *     summary: Get category tree
 *     description: Retrieves the complete category hierarchy as a tree structure
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                   children:
 *                     - id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                       name: "Smartphones"
 *                       slug: "smartphones"
 *                       children:
 *                         - id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                           name: "iPhone"
 *                           slug: "iphone"
 *                           children: []
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @swagger
 * /api/v1/categories/slug/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by slug
 *     description: Retrieves a single category by its slug with parent and children
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *         example: "smartphones"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                 name: "Smartphones"
 *                 slug: "smartphones"
 *                 description: "Latest smartphones from top brands"
 *                 parent:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                 children:
 *                   - id: "8d0e7680-8536-51ef-055c-f18gd2g01bf8"
 *                     name: "iPhone"
 *                     slug: "iphone"
 *                 isActive: true
 *                 path: "electronics/smartphones"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Category with slug 'smartphones' not found"
 */
router.get('/slug/:slug', categoryController.getCategoryBySlug);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     description: Retrieves a single category by ID with parent and children
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category UUID
 *         example: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                 name: "Smartphones"
 *                 slug: "smartphones"
 *                 description: "Latest smartphones from top brands"
 *                 parent:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   slug: "electronics"
 *                 children: []
 *                 isActive: true
 *                 path: "electronics/smartphones"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Category with ID '7c9e6679-7425-40de-944b-e07fc1f90ae7' not found"
 */
router.get('/:id', categoryController.getCategoryById);

export default router;
