import { IsString, Matches } from 'class-validator';

export class SavedItemParamsDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,150}$/)
  itemId!: string;
}
