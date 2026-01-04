import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { CategoryService } from './category.service';
import { ResponseUtil } from '../../shared/utils/response.util';

@injectable()
export class CategoryController {
  constructor(@inject(CategoryService) private categoryService: CategoryService) {}

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.categoryService.createCategory(req.body);
      ResponseUtil.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.categoryService.updateCategory(req.params.id, req.body);
      ResponseUtil.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getCategories(req.query);
      ResponseUtil.success(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.categoryService.getCategoryById(req.params.id);
      ResponseUtil.success(res, category);
    } catch (error) {
      next(error);
    }
  };

  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.categoryService.getCategoryBySlug(req.params.slug);
      ResponseUtil.success(res, category);
    } catch (error) {
      next(error);
    }
  };

  getCategoryTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await this.categoryService.getCategoryTree();
      ResponseUtil.success(res, tree);
    } catch (error) {
      next(error);
    }
  };
}
