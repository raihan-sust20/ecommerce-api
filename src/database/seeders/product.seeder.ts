import { DataSource } from 'typeorm';
import { Product } from '../../components/product/entities/product.entity';
import { Category } from '../../components/category/entities/category.entity';
import { faker } from './faker.config';

export async function seedProducts(dataSource: DataSource) {
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(Category);

  const categories = await categoryRepo.find();
  if (categories.length === 0) {
    throw new Error('No categories found for product seeding');
  }

  const PRODUCT_COUNT = 10;

  for (let i = 0; i < PRODUCT_COUNT; i++) {
    const sku = faker.string.alphanumeric({ length: 8 }).toUpperCase();

    const exists = await productRepo.findOne({ where: { sku } });
    if (exists) continue;

    const product = productRepo.create({
      sku,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: Number(faker.commerce.price({ min: 50, max: 3000 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      status: 'active',
      categories: faker.helpers.arrayElements(
        categories,
        faker.number.int({ min: 1, max: 2 })
      ),
    });

    await productRepo.save(product);
  }

  console.log('✅ Products seeded with Faker');
}
