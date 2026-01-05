import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new UnauthorizedError(info?.message || 'Unauthorized'));
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
