import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { ProductService } from './product.service';
import { ResponseUtil } from '../../shared/utils/response.util';

@injectable()
export class ProductController {
  constructor(@inject(ProductService) private productService: ProductService) {}

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.createProduct(req.body);
      ResponseUtil.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.getProductById(req.params.id);
      ResponseUtil.success(res, product);
    } catch (error) {
      next(error);
    }
  };
}
