import { Timestamp } from 'firebase-admin/firestore';
import { AdminImpactRepository } from './admin-impact.repository';
import { AdminImpactService } from './admin-impact.service';

jest.mock('./admin-impact.repository', () => ({
  AdminImpactRepository: class {},
}));

function stored(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contribution_one',
    userId: 'customer_one',
    orderId: 'order_one',
    customerName: 'Asha Silva',
    customerEmail: 'asha@example.com',
    cause: 'Tree Planting',
    amountCents: 500,
    rewardPointsEarned: 50,
    treeId: 'TREE-ONE',
    createdAt: Timestamp.now(),
    status: 'pending_verification',
    ...overrides,
  };
}

describe('AdminImpactService', () => {
  const repository = {
    documents: jest.fn(),
    document: jest.fn(),
    verify: jest.fn(),
  };
  const service = new AdminImpactService(
    repository as unknown as AdminImpactRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns global metrics while filtering the visible work queue', async () => {
    repository.documents.mockResolvedValue([
      stored(),
      stored({
        id: 'contribution_two',
        userId: 'customer_two',
        orderId: 'order_two',
        customerName: 'Nimal Perera',
        customerEmail: 'nimal@example.com',
        cause: 'Carbon Offset',
        amountCents: 700,
        rewardPointsEarned: 70,
        treeId: null,
        status: 'verified',
        verifiedAt: Timestamp.now(),
        verifiedBy: 'admin_one',
      }),
    ]);

    const result = await service.list({
      status: 'pending_verification',
      cause: 'all',
      search: 'asha',
      limit: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].customerEmail).toBe('asha@example.com');
    expect(result.metrics).toEqual({
      total: 2,
      pending: 1,
      verified: 1,
      totalAmountCents: 1200,
      treeCount: 1,
    });
    expect(result.trend).toHaveLength(7);
    expect(
      result.trend.reduce((sum, point) => sum + point.amountCents, 0),
    ).toBe(1200);
  });

  it('verifies through the repository and returns the updated record', async () => {
    repository.verify.mockResolvedValue(undefined);
    repository.document.mockResolvedValue(
      stored({
        status: 'verified',
        verifiedAt: Timestamp.now(),
        verifiedBy: 'admin_one',
      }),
    );
    const actor = { uid: 'admin_one', email: 'admin@example.com' };
    const input = {
      partnerName: 'Green Canopy',
      partnerLocation: 'Kandy',
      plantedDate: '2026-08-20',
      co2SequestrationKg: 20,
    };

    const result = await service.verify(
      'contribution_one',
      input,
      actor as never,
    );

    expect(repository.verify).toHaveBeenCalledWith(
      'contribution_one',
      input,
      actor,
    );
    expect(result.status).toBe('verified');
  });
});
