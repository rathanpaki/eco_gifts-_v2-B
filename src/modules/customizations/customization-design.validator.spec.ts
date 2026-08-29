import { BadRequestException } from '@nestjs/common';
import { parseCustomizationDesign } from './customization-design.validator';

describe('parseCustomizationDesign', () => {
  it('returns sanitized printable metadata', () => {
    const design = parseCustomizationDesign(
      JSON.stringify({
        canvasWidth: 400,
        canvasHeight: 300,
        textLayers: [
          {
            id: 'client-only-id',
            text: '  Happy birthday  ',
            x: 200,
            y: 140,
            fontSize: 24,
            fontFamily: 'Inter',
            color: '#1e4d2b',
            rotation: 0,
          },
        ],
        imageLayers: [],
      }),
    );

    expect(design.textLayers).toEqual([
      {
        text: 'Happy birthday',
        x: 200,
        y: 140,
        fontSize: 24,
        fontFamily: 'Inter',
        color: '#1E4D2B',
        rotation: 0,
      },
    ]);
    expect(design.textLayers[0]).not.toHaveProperty('id');
  });

  it.each([
    '{not-json',
    JSON.stringify({
      canvasWidth: 800,
      canvasHeight: 600,
      textLayers: [],
      imageLayers: [],
    }),
    JSON.stringify({
      canvasWidth: 400,
      canvasHeight: 300,
      textLayers: [],
      imageLayers: [],
    }),
  ])('rejects invalid or empty designs', (input) => {
    expect(() => parseCustomizationDesign(input)).toThrow(BadRequestException);
  });
});
