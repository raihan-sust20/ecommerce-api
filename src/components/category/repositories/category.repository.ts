import { injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import type { QueryCategoryDto } from '../dtos/query-category.dto';

@injectable()
export class CategoryRepository {
  private repository: Repository<Category>;

  constructor() {
    this.repository = AppDataSource.getRepository(Category);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { slug },
      relations: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll(query: QueryCategoryDto): Promise<Category[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children');

    // Filter by parent
    if (query.parentId) {
      queryBuilder.andWhere('category.parent.id = :parentId', { parentId: query.parentId });
    }

    // Filter root categories only
    if (query.rootOnly) {
      queryBuilder.andWhere('category.parent IS NULL');
    }

    // Filter active categories
    if (query.activeOnly) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    // Search by name or description
    if (query.search) {
      queryBuilder.andWhere('(category.name ILIKE :search OR category.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder);

    return queryBuilder.getMany();
  }

  async findTree(): Promise<Category[]> {
    // Get ALL categories in a single query
    const allCategories = await this.repository.find({
      relations: {
        parent: true,
      },
      order: { name: 'ASC' },
    });

    // Build tree structure in memory
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Initialize all categories with empty children array
    allCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build parent-child relationships
    allCategories.forEach((category) => {
      const cat = categoryMap.get(category.id)!;

      if (!category.parent) {
        rootCategories.push(cat);
      } else {
        const parent = categoryMap.get(category.parent.id);
        if (parent) {
          parent.children.push(cat);
        }
      }
    });

    return rootCategories;
  }

  async findWithProductCount(id: string): Promise<Category | null> {
    return this.repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .loadRelationCountAndMap('category.productCount', 'category.products')
      .where('category.id = :id', { id })
      .getOne();
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        parent: true,
        children: true,
      },
    });
  }

  async findByIdWithParent(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: { parent: true },
    });
  }

  async create(data: CreateCategoryDto, parent: Category | null): Promise<Category> {
    const category = this.repository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      isActive: data.isActive ?? true,
      parent: parent,
    });

    // Build materialized path
    if (parent) {
      category.path = parent.path ? `${parent.path}/${data.slug}` : `${parent.slug}/${data.slug}`;
    } else {
      category.path = data.slug;
    }

    return this.repository.save(category);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.repository.update(id, data);
    return this.findByIdWithParent(id) as Promise<Category>;
  }

  async updateWithRelations(category: Category): Promise<Category> {
    return this.repository.save(category);
  }

  async findChildren(parentId: string): Promise<Category[]> {
    return this.repository.find({
      where: { parent: { id: parentId } },
    });
  }

  async findDescendants(categoryId: string): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category) return [];

    return this.repository
      .createQueryBuilder('category')
      .where('category.path LIKE :path', { path: `${category.path}%` })
      .andWhere('category.id != :id', { id: categoryId })
      .getMany();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.repository.createQueryBuilder('category');
    queryBuilder.where('category.slug = :slug', { slug });

    if (excludeId) {
      queryBuilder.andWhere('category.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }
}
