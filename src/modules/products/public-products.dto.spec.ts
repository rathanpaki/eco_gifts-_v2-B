import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PublicProductsQueryDto } from './public-products.dto';

describe('public products query DTO', () => {
  it('transforms validated URL scalar values', async () => {
    const query = plainToInstance(PublicProductsQueryDto, {
      minPriceCents: '1000',
      maxPriceCents: '5000',
      personalizable: 'true',
      occasion: 'wedding',
      page: '3',
      limit: '12',
    });
    expect(await validate(query)).toHaveLength(0);
    expect(query).toMatchObject({
      minPriceCents: 1000,
      maxPriceCents: 5000,
      personalizable: true,
      occasion: 'wedding',
      page: 3,
      limit: 12,
    });
  });

  it('rejects malformed values rather than coercing them', async () => {
    const query = plainToInstance(PublicProductsQueryDto, {
      minPriceCents: '-2',
      personalizable: 'yes',
      sort: 'popular',
      page: '0',
      limit: '2.5',
    });
    expect(await validate(query)).toHaveLength(5);
  });
});
