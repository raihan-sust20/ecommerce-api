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

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.updateProduct(req.params.id, req.body);
      ResponseUtil.success(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.getProducts(req.query);
      ResponseUtil.success(res, result);
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

  getProductBySku = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.getProductBySku(req.params.sku);
      ResponseUtil.success(res, product);
    } catch (error) {
      next(error);
    }
  };
}
