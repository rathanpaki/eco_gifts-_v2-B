import { validate } from 'class-validator';
import { ReorderImagesDto } from './reorder-images.dto';

describe('ReorderImagesDto', () => {
  it('accepts an image order containing more than eight unique images', async () => {
    const input = new ReorderImagesDto();
    input.imageIds = Array.from({ length: 20 }, (_, index) => `image-${index}`);

    await expect(validate(input)).resolves.toEqual([]);
  });

  it('still rejects duplicate image ids', async () => {
    const input = new ReorderImagesDto();
    input.imageIds = ['image-1', 'image-1'];

    const errors = await validate(input);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('arrayUnique');
  });
});
