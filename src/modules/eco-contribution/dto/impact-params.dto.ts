import { IsString, Matches, MaxLength } from 'class-validator';

export class ImpactParamsDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  contributionId!: string;
}
