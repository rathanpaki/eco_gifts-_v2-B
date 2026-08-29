import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { GiftProfileValues } from '../account-saved.types';

export class WriteGiftProfileDto implements GiftProfileValues {
  @IsString() @MinLength(2) @MaxLength(100) recipientName!: string;
  @IsString() @MinLength(2) @MaxLength(60) relationship!: string;
  @IsString() @MinLength(2) @MaxLength(80) occasion!: string;
  @IsOptional() @IsDateString() importantDate?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
