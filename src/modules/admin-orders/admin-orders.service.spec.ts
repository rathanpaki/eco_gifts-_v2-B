import { NotFoundException } from '@nestjs/common';
import type { CustomizationsService } from '../customizations/customizations.service';
import type { AdminOrder } from './admin-order.types';
import type { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersService } from './admin-orders.service';

jest.mock('../customizations/customizations.service', () => ({
  CustomizationsService: class CustomizationsService {},
}));
jest.mock('./admin-orders.repository', () => ({
  AdminOrdersRepository: class AdminOrdersRepository {},
}));

describe('AdminOrdersService personalization preview', () => {
  const preview = Buffer.from('preview');
  const customizations = {
    previewForAdmin: jest.fn().mockResolvedValue(preview),
  } as unknown as CustomizationsService;
  const service = new AdminOrdersService(
    {} as AdminOrdersRepository,
    customizations,
  );

  beforeEach(() => jest.clearAllMocks());

  it('opens a customization that belongs to the selected order', async () => {
    jest.spyOn(service, 'get').mockResolvedValue(orderWith('custom-1'));

    await expect(
      service.personalizationPreview('order-1', 'custom-1'),
    ).resolves.toBe(preview);
    expect(customizations.previewForAdmin).toHaveBeenCalledWith('custom-1');
  });

  it('does not expose a customization from another order', async () => {
    jest.spyOn(service, 'get').mockResolvedValue(orderWith('custom-1'));

    await expect(
      service.personalizationPreview('order-1', 'custom-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(customizations.previewForAdmin).not.toHaveBeenCalled();
  });
});

function orderWith(customizationId: string): AdminOrder {
  return {
    id: 'order-1',
    items: [{ customization: { id: customizationId } }],
  } as unknown as AdminOrder;
}
