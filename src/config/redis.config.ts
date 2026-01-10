import { createClient } from 'redis';
import { env } from './env.config';
import { logger } from '../shared/utils/logger.util';
import { log } from 'node:console';

log('redis host:', env.REDIS_HOST);
log('redis port:', env.REDIS_PORT);

export const redisClient = createClient({
  // socket: {
  //   host: env.REDIS_HOST,
  //   port: env.REDIS_PORT,
  // },
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error', err);
});

export const initializeRedis = async (): Promise<void> => {
  log('redis host:', env.REDIS_HOST);
  log('redis port:', env.REDIS_PORT);
  try {
    if (!redisClient.isOpen) {
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
