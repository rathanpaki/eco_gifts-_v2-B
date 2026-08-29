export const productOccasions = ['wedding', 'birthday', 'corporate'] as const;

export type ProductOccasion = (typeof productOccasions)[number];

export function productOccasionList(value: unknown): ProductOccasion[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter((item): item is ProductOccasion => isProductOccasion(item)),
    ),
  );
}

function isProductOccasion(value: unknown): value is ProductOccasion {
  return (
    typeof value === 'string' &&
    productOccasions.includes(value as ProductOccasion)
  );
}
