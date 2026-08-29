import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { AdminInventoryRepository } from './admin-inventory.repository';
import type {
  InventoryAdjustmentInput,
  InventoryEvent,
} from './admin-inventory.types';

@Injectable()
export class AdminInventoryService {
  constructor(private readonly repository: AdminInventoryRepository) {}

  history(productId: string, limit: number): Promise<InventoryEvent[]> {
    return this.repository.history(productId, limit);
  }

  adjust(
    productId: string,
    input: InventoryAdjustmentInput,
    actor: AuthenticatedUser,
  ): Promise<InventoryEvent> {
    return this.repository.adjust(productId, input, actor);
  }
}
