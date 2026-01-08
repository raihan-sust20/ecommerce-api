import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const SERVER_URL =
  env.APP_URL ?? `http://localhost:${env.PORT}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'E-commerce REST API documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: SERVER_URL,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/components/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
