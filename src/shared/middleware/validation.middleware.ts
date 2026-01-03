import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '../errors/app-error';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoInstance = plainToInstance(dtoClass, req.body);
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationError(formattedErrors);
      }

      req.body = dtoInstance;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const formatValidationErrors = (errors: ClassValidatorError[]): string => {
  return errors
    .map((error) => {
      const constraints = error.constraints;
      return constraints ? Object.values(constraints).join(', ') : '';
    })
    .join('; ');
};
