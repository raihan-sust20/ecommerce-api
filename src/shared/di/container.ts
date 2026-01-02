import { container } from 'tsyringe';
import { UserRepository } from '../../components/user/user.repository';
import { UserService } from '../../components/user/user.service';
import { UserController } from '../../components/user/user.controller';
import { AuthService } from '../../components/auth/auth.service';
import { AuthController } from '../../components/auth/auth.controller';
import { ProductRepository } from '../../components/product/product.repository';
import { ProductService } from '../../components/product/product.service';
import { ProductController } from '../../components/product/product.controller';

// Register all dependencies
container.registerSingleton(UserRepository);
container.registerSingleton(UserService);
container.registerSingleton(UserController);

container.registerSingleton(AuthService);
container.registerSingleton(AuthController);

container.registerSingleton(ProductRepository);
container.registerSingleton(ProductService);
container.registerSingleton(ProductController);

export { container };
