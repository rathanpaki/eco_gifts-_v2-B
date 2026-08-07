import { BadRequestException } from '@nestjs/common';
import type { ProductWriteInput } from './admin-product.types';
import { ProductStatus } from './product-status.enum';

export function productSlug(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (!slug) throw new BadRequestException('Product name cannot form a slug.');
  return slug;
}

export function searchTerms(input: ProductWriteInput): string[] {
  return Array.from(
    new Set(
      `${input.name} ${input.sku} ${input.category}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((value) => value.length > 1),
    ),
  ).slice(0, 40);
}

export function evidenceComplete(input: ProductWriteInput): boolean {
  return (
    input.materialsVerified &&
    input.packagingVerified &&
    input.contributionVerified
  );
}

export function assertPublishable(
  input: ProductWriteInput,
  imageCount: number,
): void {
  if (input.status !== ProductStatus.ACTIVE) return;
  if (!evidenceComplete(input)) {
    throw new BadRequestException(
      'All eco evidence must be verified before publication.',
    );
  }
  if (imageCount < 1) {
    throw new BadRequestException(
      'At least one product image is required before publication.',
    );
  }
}

export function imageSignatureAllowed(buffer: Buffer): boolean {
  const jpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const png =
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}
