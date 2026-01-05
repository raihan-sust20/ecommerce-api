import { injectable, inject } from 'tsyringe';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { UserRepository } from '../user/repositories/user.repository';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { UnauthorizedError, ConflictError } from '../../shared/errors/app-error';
import { env } from '../../config/env.config';
import type { AuthTokens, TokenPayload } from './interfaces/auth.interface';

@injectable()
export class AuthService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async register(data: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = await this.userRepository.create(data);
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  async login(data: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
      const user = await this.userRepository.findById(payload.id);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
