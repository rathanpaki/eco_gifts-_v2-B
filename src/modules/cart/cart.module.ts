import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CartController } from './cart.controller';
import { CartIdentityService } from './cart-identity.service';
import { CartMergeRepository } from './cart-merge.repository';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [
    CartIdentityService,
    CartMergeRepository,
    CartRepository,
    CartService,
  ],
  exports: [CartService],
})
export class CartModule {}
