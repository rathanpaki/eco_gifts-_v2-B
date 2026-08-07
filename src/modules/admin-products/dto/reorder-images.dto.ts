import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class ReorderImagesDto {
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  imageIds!: string[];
}
