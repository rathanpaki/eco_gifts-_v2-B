import { BadRequestException } from '@nestjs/common';
import type {
  CustomizationDesign,
  CustomizationImageLayer,
  CustomizationTextLayer,
} from './customization.types';

const FONTS = new Set([
  'Inter',
  'DM Serif Display',
  'Playfair Display',
  'cursive',
]);
export function parseCustomizationDesign(value: string): CustomizationDesign {
  let input: unknown;
  try {
    input = JSON.parse(value);
  } catch {
    throw invalid('Customization metadata must be valid JSON.');
  }
  const data = object(input);
  if (data.canvasWidth !== 400 || data.canvasHeight !== 300)
    throw invalid('Customization canvas dimensions are invalid.');
  if (!Array.isArray(data.textLayers))
    throw invalid('Customization text layers are invalid.');
  if (!Array.isArray(data.imageLayers) || data.imageLayers.length > 20)
    throw invalid('Customization image layers are invalid.');
  const textLayers = data.textLayers.map(textLayer);
  const imageLayers = data.imageLayers.map(imageLayer);
  if (!textLayers.length && !imageLayers.length)
    throw invalid('Add text or an image before saving the customization.');
  return { canvasWidth: 400, canvasHeight: 300, textLayers, imageLayers };
}
function textLayer(value: unknown): CustomizationTextLayer {
  const data = object(value);
  const text = string(data.text).trim();
  const fontFamily = string(data.fontFamily);
  const color = string(data.color).toUpperCase();
  if (!text || text.length > 120)
    throw invalid('Customization text must contain 1 to 120 characters.');
  if (!FONTS.has(fontFamily) || !/^#[0-9A-F]{6}$/.test(color))
    throw invalid('Customization typography is invalid.');
  return {
    text,
    x: coordinate(data.x, 400),
    y: coordinate(data.y, 300),
    fontSize: rangedInteger(data.fontSize, 12, 48),
    fontFamily,
    color,
    rotation: rangedNumber(data.rotation, -180, 180),
  };
}
function imageLayer(value: unknown): CustomizationImageLayer {
  const data = object(value);
  return {
    x: coordinate(data.x, 400),
    y: coordinate(data.y, 300),
    width: rangedNumber(data.width, 1, 400),
    height: rangedNumber(data.height, 1, 300),
    scale: rangedNumber(data.scale, 0.25, 2),
    rotation: rangedNumber(data.rotation, -180, 180),
  };
}
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalid('Customization metadata is invalid.');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string')
    throw invalid('Customization text is invalid.');
  return value;
}
function coordinate(value: unknown, maximum: number): number {
  return rangedNumber(value, 0, maximum);
}
function rangedInteger(value: unknown, minimum: number, maximum: number) {
  const parsed = rangedNumber(value, minimum, maximum);
  if (!Number.isInteger(parsed))
    throw invalid('Customization value is invalid.');
  return parsed;
}
function rangedNumber(value: unknown, minimum: number, maximum: number) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  )
    throw invalid('Customization value is outside the printable area.');
  return Number(value.toFixed(2));
}
function invalid(message: string): BadRequestException {
  return new BadRequestException(message);
}
