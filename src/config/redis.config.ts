import { createClient } from 'redis';
import { env } from './env.config';
import { logger } from '../shared/utils/logger.util';

export const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD,
});

redisClient.on('error', (err: any) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('✅ Redis connected successfully'));

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    redisClient.destroy();
  } catch (error) {
    logger.error('❌ Redis disconnection failed:', error);
  }
};
