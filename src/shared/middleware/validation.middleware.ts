import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '../errors/app-error';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoInstance = plainToInstance(dtoClass, req.body);
      console.log('Validating DTO:', dtoInstance);
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationError(formattedErrors);
      }

      req.body = dtoInstance;
      next();
    } catch (error) {
      console.error('Validation Error:', JSON.stringify(error));
      next(error);
    }
  };
};

// export const formatValidationErrors = (errors: ClassValidatorError[]): string => {
//   return errors
//     .map((error) => {
//       const constraints = error.constraints;
//       return constraints ? Object.values(constraints).join(', ') : '';
//     })
//     .join('; ');
// };

export const formatValidationErrors = (errors: ClassValidatorError[]): string => {
  const recursivelyExtractErrors = (errorArray: ClassValidatorError[]): string[] => {
    const result: string[] = [];

    errorArray.forEach((error: ClassValidatorError) => {
      // Add top-level constraints
      if (error.constraints) {
        result.push(...Object.values(error.constraints));
      }

      // Recurse into children (for nested DTOs / arrays)
      if (error.children && error.children.length > 0) {
        result.push(...recursivelyExtractErrors(error.children));
      }
    });

    return result;
  };

  return recursivelyExtractErrors(errors).join('; ');
};
