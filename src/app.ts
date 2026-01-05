import 'reflect-metadata';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.config';
import { swaggerSpec } from './config/swagger.config';
// import { jwtStrategy } from './components/auth/strategies/jwt.strategy';

// Middleware
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { rateLimiter } from './shared/middleware/rate-limit.middleware';
import { logger } from './shared/utils/logger.util';

// Routes
import authRoutes from './components/auth/auth.routes';
// import userRoutes from './components/user/user.routes';
import productRoutes from './components/product/product.routes';
import categoryRoutes from './components/category/category.routes';
import orderRoutes from './components/order/order.routes';

// Register dependencies
import './shared/di/container';
import { jwtStrategy } from './components/auth/strategies/jwt.strategy';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(rateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Passport
  passport.use(jwtStrategy);
  app.use(passport.initialize());

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API Routes
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  // app.use(`${env.API_PREFIX}/users`, userRoutes);
  app.use(`${env.API_PREFIX}/products`, productRoutes);
  app.use(`${env.API_PREFIX}/categories`, categoryRoutes);
  app.use(`${env.API_PREFIX}/orders`, orderRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
