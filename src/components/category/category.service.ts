import { injectable, inject } from 'tsyringe';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { cacheService } from '../../shared/utils/cache.util';
import slugify from 'slugify';
import type { UpdateCategoryDto } from './dtos/update-category.dto';
import { CACHE_TTL } from '../../shared/constants';
import type { QueryCategoryDto } from './dtos/query-category.dto';

@injectable()
export class CategoryService {
  constructor(@inject(CategoryRepository) private categoryRepository: CategoryRepository) {}

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    if (!data.slug) {
      const categorySlug = slugify(data.name, { lower: true, remove: /[*+~.()'"!:@]/g });
      data.slug = categorySlug;
    }

    // Validate slug uniqueness
    const slugExists = await this.categoryRepository.slugExists(data.slug);
    if (slugExists) {
      throw new ConflictError(`Category with slug '${data.slug}' already exists`);
    }

    // Validate parent exists if provided
    let parent: Category | null = null;
    if (data.parentId) {
      parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw new NotFoundError(`Parent category with ID '${data.parentId}' not found`);
      }

      // Prevent creating category under inactive parent
      if (!parent.isActive) {
        throw new ValidationError('Cannot create category under an inactive parent');
      }
    }

    // Create category
    const category = await this.categoryRepository.create(data, parent);

    // Invalidate cache
    // await cacheService.delPattern('categories:*');

    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    // Check if category exists
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(`Category with ID '${id}' not found`);
    }

    // Validate slug uniqueness if slug is being updated
    if (data.slug && data.slug !== category.slug) {
      const slugExists = await this.categoryRepository.slugExists(data.slug, id);
      if (slugExists) {
        throw new ConflictError(`Category with slug '${data.slug}' already exists`);
      }
    }

    // Validate parent change
    let newParent: Category | null = null;
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        // Moving to root level
        newParent = null;
      } else if (data.parentId === id) {
        // Prevent self-referencing
        throw new ValidationError('Category cannot be its own parent');
      } else {
        // Validate new parent exists
        newParent = await this.categoryRepository.findById(data.parentId);
        if (!newParent) {
          throw new NotFoundError(`Parent category with ID '${data.parentId}' not found`);
        }

        const isParentDescendant = await this.isDescendant(id, data.parentId);
        // Prevent circular reference (moving parent under its own descendant)
        if (isParentDescendant) {
          throw new ValidationError('Cannot move category under its own descendant');
        }

        // Prevent moving under inactive parent
        if (!newParent.isActive) {
          throw new ValidationError('Cannot move category under an inactive parent');
        }
      }
    }

    // Update basic fields
    const updateData: Partial<Category> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Handle slug and path updates
    const slugChanged = data.slug && data.slug !== category.slug;
    const parentChanged = data.parentId !== undefined && data.parentId !== category.parent?.id;

    if (slugChanged || parentChanged) {
      // Update slug if provided
      if (data.slug) {
        updateData.slug = data.slug;
      }

      // Update parent relationship if changed
      if (parentChanged) {
        category.parent = newParent;
      }

      // Recalculate path
      const finalSlug = data.slug || category.slug;
      if (parentChanged && newParent) {
        updateData.path = newParent.path
          ? `${newParent.path}/${finalSlug}`
          : `${newParent.slug}/${finalSlug}`;
      } else if (parentChanged && !newParent) {
        updateData.path = finalSlug;
      } else if (slugChanged && category.parent) {
        updateData.path = category.parent.path
          ? `${category.parent.path}/${finalSlug}`
          : `${category.parent.slug}/${finalSlug}`;
      } else if (slugChanged && !category.parent) {
        updateData.path = finalSlug;
      }

      // Update the category first
      await this.categoryRepository.update(id, updateData);

      // If parent changed, update the relationship
      if (parentChanged) {
        const updatedCategory = await this.categoryRepository.findById(id);
        if (updatedCategory) {
          updatedCategory.parent = newParent;
          await this.categoryRepository.updateWithRelations(updatedCategory);
        }
      }

      // Update all descendant paths if slug or parent changed
      if (slugChanged || parentChanged) {
        await this.updateDescendantPaths(id);
      }
    } else {
      // Simple update without path changes
      await this.categoryRepository.update(id, updateData);
    }

    // Get updated category
    const updatedCategory = await this.categoryRepository.findByIdWithParent(id);

    // Invalidate cache
    await cacheService.del(`category:${id}`);
    await cacheService.delPattern('categories:*');

    return updatedCategory as Category;
  }

  // Helper method to check if targetId is a descendant of categoryId
  private async isDescendant(categoryId: string, targetId: string): Promise<boolean> {
    const descendants = await this.categoryRepository.findDescendants(categoryId);
    return descendants.some((desc) => desc.id === targetId);
  }

  // Helper method to update all descendant paths recursively
  private async updateDescendantPaths(categoryId: string): Promise<void> {
    const parent = await this.categoryRepository.findById(categoryId);
    if (!parent) return;

    const children = await this.categoryRepository.findChildren(categoryId);

    for (const child of children) {
      const newPath = parent.path ? `${parent.path}/${child.slug}` : `${parent.slug}/${child.slug}`;

      await this.categoryRepository.update(child.id, { path: newPath });

      // Recursively update grandchildren
      await this.updateDescendantPaths(child.id);
    }
  }

  async getCategories(query: QueryCategoryDto): Promise<Category[]> {
    const cacheKey = `categories:list:${JSON.stringify(query)}`;
    const cached = await cacheService.get<Category[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const categories = await this.categoryRepository.findAll(query);
    await cacheService.set(cacheKey, categories, CACHE_TTL.MEDIUM);

    return categories;
  }

  async getCategoryById(id: string): Promise<Category> {
    const cacheKey = `category:${id}`;
    const cached = await cacheService.get<Category>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(`Category with ID '${id}' not found`);
    }

    await cacheService.set(cacheKey, category, CACHE_TTL.MEDIUM);
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const cacheKey = `category:slug:${slug}`;
    const cached = await cacheService.get<Category>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError(`Category with slug '${slug}' not found`);
    }

    await cacheService.set(cacheKey, category, CACHE_TTL.MEDIUM);
    return category;
  }

  async getCategoryTree(): Promise<Category[]> {
    const cacheKey = 'categories:tree';
    const cached = await cacheService.get<Category[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const tree = await this.categoryRepository.findTree();
    await cacheService.set(cacheKey, tree, CACHE_TTL.LONG);

    return tree;
  }

  async getCategoryWithProductCount(id: string): Promise<Category> {
    const cacheKey = `category:${id}:with-count`;
    const cached = await cacheService.get<Category>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findWithProductCount(id);
    if (!category) {
      throw new NotFoundError(`Category with ID '${id}' not found`);
    }

    await cacheService.set(cacheKey, category, CACHE_TTL.SHORT);
    return category;
  }
}
