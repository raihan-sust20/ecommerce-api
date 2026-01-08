import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from './auth.controller';
import { validateDto } from '../../shared/middleware/validation.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authRateLimiter } from '../../shared/middleware/rate-limit.middleware';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

const router = Router();
const authController = container.resolve(AuthController);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: User entity representing a system user (admin or customer)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "e9601e19-b4bd-483d-992e-dfb074956de2"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *
 *         firstName:
 *           type: string
 *           example: "John"
 *
 *         lastName:
 *           type: string
 *           example: "Doe"
 *
 *         role:
 *           type: string
 *           enum: [admin, customer]
 *           example: "customer"
 *
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T10:15:30.000Z"
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-10T08:45:12.000Z"
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: strong@password123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', validateDto(RegisterDto), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: strong@password123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authRateLimiter, validateDto(LoginDto), authController.login);

router.post('/refresh', authController.refreshToken);

router.get('/profile', authenticate, authController.getProfile);

export default router;
