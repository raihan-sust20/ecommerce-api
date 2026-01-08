import { UserRole } from '../../components/user/entities/user.entity';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
    }
  }
}
