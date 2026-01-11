import { AppDataSource } from '../../config/database.config';
import { seedUsers } from './user.seeder';
import { seedCategories } from './category.seeder';
import { seedProducts } from './product.seeder';

async function runSeeders() {
  await AppDataSource.initialize();

  await seedUsers(AppDataSource);
  await seedCategories(AppDataSource);
  await seedProducts(AppDataSource);

  await AppDataSource.destroy();
  process.exit(0);
}

runSeeders().catch((err) => {
  console.error('❌ Seeding failed', err);
  process.exit(1);
});
