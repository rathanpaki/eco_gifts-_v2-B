import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CheckoutSelectionDto } from './checkout-selection.dto';

describe('CheckoutSelectionDto', () => {
  it('accepts the complete Carbon Offset quote selection', async () => {
    const selection = plainToInstance(CheckoutSelectionDto, {
      packagingId: 'zero-waste-cloth',
      deliveryId: 'standard',
      contributionCause: 'Carbon Offset',
      contributionAmountCents: '500',
    });

    await expect(
      validate(selection, {
        forbidNonWhitelisted: true,
        whitelist: true,
      }),
    ).resolves.toEqual([]);
    expect(selection.contributionAmountCents).toBe(500);
  });

  it('rejects an incomplete contribution selection', async () => {
    const selection = plainToInstance(CheckoutSelectionDto, {
      contributionCause: 'Carbon Offset',
    });

    await expect(validate(selection)).resolves.not.toEqual([]);
  });
});
