import { injectable } from 'tsyringe';
import { Repository, type DeepPartial } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { User } from '../entities/user.entity';

@injectable()
export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findAll(skip: number, take: number): Promise<[User[], number]> {
    return this.repository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(data: DeepPartial<User>): Promise<User> {
    const user = this.repository.create(data);
    const savedUserData = await this.repository.save(user);

    return savedUserData as User;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
