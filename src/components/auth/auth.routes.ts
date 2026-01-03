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
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authRateLimiter, validateDto(LoginDto), authController.login);

router.post('/refresh', authController.refreshToken);

router.get('/profile', authenticate, authController.getProfile);

export default router;
