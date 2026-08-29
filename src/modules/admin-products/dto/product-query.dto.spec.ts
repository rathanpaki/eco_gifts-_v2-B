import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQueryDto } from './product-query.dto';

describe('admin product query DTO', () => {
  it('keeps page one as the default and transforms explicit pages', async () => {
    const defaults = plainToInstance(ProductQueryDto, { limit: '12' });
    const explicit = plainToInstance(ProductQueryDto, {
      filter: 'active',
      page: '3',
      limit: '12',
    });

    expect(await validate(defaults)).toHaveLength(0);
    expect(defaults).toMatchObject({ page: 1, limit: 12 });
    expect(await validate(explicit)).toHaveLength(0);
    expect(explicit).toMatchObject({ filter: 'active', page: 3, limit: 12 });
  });

  it('rejects zero and malformed page numbers', async () => {
    const zero = plainToInstance(ProductQueryDto, { page: '0' });
    const decimal = plainToInstance(ProductQueryDto, { page: '1.5' });

    expect(await validate(zero)).toHaveLength(1);
    expect(await validate(decimal)).toHaveLength(1);
  });
});
