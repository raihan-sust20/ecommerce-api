import { createClient } from 'redis';
import { env } from './env.config';
import { logger } from '../shared/utils/logger.util';

export const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error', err);
});

// redisClient.on('ready', () => {
//   logger.info('✅ Redis connected successfully');
// });

export const initializeRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      console.log('Redis host: ', env.REDIS_HOST, 'redis port: ', env.REDIS_PORT);
      await redisClient.connect();
    }

    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.error('❌ Redis connection failed', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.close(); // graceful shutdown
      logger.info('✅ Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('❌ Redis disconnection failed', error);
  }
};
