import { container } from 'tsyringe';
import { UserRepository } from '../../components/user/repositories/user.repository';
// import { UserService } from '../../components/user/user.service';
// import { UserController } from '../../components/user/user.controller';
import { AuthService } from '../../components/auth/auth.service';
import { AuthController } from '../../components/auth/auth.controller';
import { CategoryRepository } from '../../components/category/repositories/category.repository';
import { CategoryService } from '../../components/category/category.service';
import { CategoryController } from '../../components/category/category.controller';
import { ProductRepository } from '../../components/product/repositories/product.repository';
import { ProductService } from '../../components/product/product.service';
import { ProductController } from '../../components/product/product.controller';
import { OrderRepository } from '../../components/order/repositories/order.repository';
import { OrderService } from '../../components/order/order.service';
import { OrderController } from '../../components/order/order.controller';


// Register all dependencies
container.registerSingleton(UserRepository);
// container.registerSingleton(UserService);
// container.registerSingleton(UserController);

container.registerSingleton(AuthService);
container.registerSingleton(AuthController);

container.registerSingleton(ProductRepository);
container.registerSingleton(ProductService);
container.registerSingleton(ProductController);

container.registerSingleton(CategoryRepository);
container.registerSingleton(CategoryService);
container.registerSingleton(CategoryController);

container.registerSingleton(OrderRepository);
container.registerSingleton(OrderService);
container.registerSingleton(OrderController);

export { container };
