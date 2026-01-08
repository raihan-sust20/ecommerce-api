import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { container } from 'tsyringe';
import { UserRepository } from '../../user/repositories/user.repository';
import { env } from '../../../config/env.config';
import { logger } from '../../../shared/utils/logger.util';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
};

export const jwtStrategy = new JwtStrategy(options, async (payload, done) => {
  try {
    const userRepository = container.resolve(UserRepository);
    const user = await userRepository.findById(payload.id);

    if (!user || !user.isActive) {
      return done(null, false);
    }

    return done(null, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error('JWT Strategy Error:', JSON.stringify(error));
    return done(error, false);
  }
});
