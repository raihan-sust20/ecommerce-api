import { injectable, inject } from 'tsyringe';
import { PaymentStrategy } from './payment-strategy.interface';
import { StripePaymentStrategy } from './stripe-payment.strategy';
import { BkashPaymentStrategy } from './bkash-payment.strategy';
import { PaymentProvider } from '../entities/payment.entity';
import { ValidationError } from '../../../shared/errors/app-error';

@injectable()
export class PaymentStrategyFactory {
  constructor(
    @inject(StripePaymentStrategy) private stripeStrategy: StripePaymentStrategy,
    @inject(BkashPaymentStrategy) private bkashStrategy: BkashPaymentStrategy
  ) {}

  getStrategy(provider: PaymentProvider): PaymentStrategy {
    switch (provider) {
      case 'stripe':
        return this.stripeStrategy;
      case 'bkash':
        return this.bkashStrategy;
      default:
        throw new ValidationError(`Unsupported payment provider: ${provider}`);
    }
  }
}
