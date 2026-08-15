export interface CustomizationTextLayer {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
}

export interface CustomizationImageLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export interface CustomizationDesign {
  canvasWidth: 400;
  canvasHeight: 300;
  textLayers: CustomizationTextLayer[];
  imageLayer: CustomizationImageLayer | null;
}

export interface Customization {
  id: string;
  productId: string;
  previewPath: string;
  design: CustomizationDesign;
  createdAt: string;
}

export interface UploadedCustomizationPreview {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}
