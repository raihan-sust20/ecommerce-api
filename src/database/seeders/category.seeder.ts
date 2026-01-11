import { DataSource } from 'typeorm';
import { Category } from '../../components/category/entities/category.entity';
import { faker } from './faker.config';

export async function seedCategories(dataSource: DataSource) {
  const repo = dataSource.getRepository(Category);

  const createIfNotExists = async (data: Partial<Category>) => {
    let category = await repo.findOne({ where: { slug: data.slug } });
    if (!category) {
      category = repo.create(data);
      await repo.save(category);
    }
    return category;
  };

  const electronics = await createIfNotExists({
    name: 'Electronics',
    slug: 'electronics',
    description: faker.commerce.productDescription(),
    path: 'electronics',
  });

  const mobiles = await createIfNotExists({
    name: 'Mobiles',
    slug: 'mobiles',
    parentId: electronics.id,
    description: faker.commerce.productDescription(),
    path: 'electronics/mobiles',
  });

  const laptops = await createIfNotExists({
    name: 'Laptops',
    slug: 'laptops',
    parentId: electronics.id,
    description: faker.commerce.productDescription(),
    path: 'electronics/laptops',
  });

  console.log('✅ Categories seeded');
}
