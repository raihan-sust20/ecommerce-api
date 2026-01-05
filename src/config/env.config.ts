// env.schema.ts
import 'reflect-metadata';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';
import { config } from 'dotenv';
import { formatValidationErrors } from '../shared/middleware/validation.middleware';

export type NodeEnv = 'development' | 'production' | 'test';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: NodeEnv = 'development';

  @IsInt()
  @Transform(({ value }) => Number(value))
  PORT = 5001;

  // Database
  @IsString()
  DB_HOST!: string;

  @IsInt()
  @Transform(({ value }) => Number(value))
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_DATABASE!: string;

  // Redis
  @IsString()
  REDIS_HOST!: string;

  @IsInt()
  @Transform(({ value }) => Number(value))
  REDIS_PORT!: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // JWT
  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN = '7d';

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN = '30d';

  // API
  @IsString()
  API_PREFIX = '/api/v1';

  @IsInt()
  @Transform(({ value }) => Number(value))
  RATE_LIMIT_WINDOW_MS = 900_000;

  @IsInt()
  @Transform(({ value }) => Number(value))
  RATE_LIMIT_MAX = 100;

  // CORS
  @IsString()
  CORS_ORIGIN = '*';

  // Logging
  @IsIn(['error', 'warn', 'info', 'debug'])
  LOG_LEVEL: LogLevel = 'info';
}

config();

const validateEnv = (): EnvironmentVariables => {
  const env = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(env, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.error('❌ Invalid environment variables:');
    const formatedErrors = formatValidationErrors(errors);
    console.error(formatedErrors);
    process.exit(1);
  }

  return env;
};

export const env = validateEnv();
