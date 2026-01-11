import { DataSource } from 'typeorm';
import { User } from '../../components/user/entities/user.entity';
import { faker } from './faker.config';

export async function seedUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);

  // Always ensure admin exists
  const adminEmail = 'admin@example.com';

  const adminExists = await repo.findOne({ where: { email: adminEmail } });
  if (!adminExists) {
    const admin = repo.create({
      email: adminEmail,
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    await repo.save(admin);
  }

  // Fake customers
  const CUSTOMER_COUNT = 5;

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const email = faker.internet.email().toLowerCase();

    const exists = await repo.findOne({ where: { email } });
    if (exists) continue;

    const user = repo.create({
      email,
      password: 'customer123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'customer',
      isActive: faker.datatype.boolean({ probability: 0.9 }),
    });

    await repo.save(user);
  }

  console.log('✅ Users seeded with Faker');
}
