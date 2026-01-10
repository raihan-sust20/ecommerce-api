import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';
import path from 'node:path';

const SERVER_URL = env.APP_URL ?? `http://localhost:${env.PORT}`;
const API_PATHS =
  env.NODE_ENV === 'development'
    ? [path.join(process.cwd(), 'src/components/**/*.routes.ts')]
    : [path.join(process.cwd(), 'dist/components/**/*.routes.js')];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'E-commerce REST API documentation',
      contact: {
        name: 'API Support',
        email: 'raihan.sust20@gmail.com',
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
  apis: API_PATHS,
};

export const swaggerSpec = swaggerJsdoc(options);
