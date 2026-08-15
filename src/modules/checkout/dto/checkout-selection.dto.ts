import { IsIn, IsOptional } from 'class-validator';
import type {
  CheckoutSelection,
  DeliveryOptionId,
  PackagingOptionId,
} from '../checkout.types';

const PACKAGING = ['recycled-box', 'seed-paper-wrap', 'zero-waste-cloth'];
const DELIVERY = ['standard', 'green-logistics'];

export class CheckoutSelectionDto implements CheckoutSelection {
  @IsOptional()
  @IsIn(PACKAGING)
  packagingId?: PackagingOptionId;

  @IsOptional()
  @IsIn(DELIVERY)
  deliveryId?: DeliveryOptionId;
}
