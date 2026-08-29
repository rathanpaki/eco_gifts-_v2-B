import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  AdminImpactQuery,
  AdminImpactStatus,
} from '../admin-impact.types';
import {
  CONTRIBUTION_CAUSES,
  type ContributionCause,
} from '../contribution.types';

const integer = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

export class AdminImpactQueryDto implements AdminImpactQuery {
  @IsOptional()
  @IsIn(['all', 'pending_verification', 'verified'])
  status: AdminImpactStatus = 'all';

  @IsOptional()
  @IsIn(['all', ...CONTRIBUTION_CAUSES])
  cause: 'all' | ContributionCause = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}
