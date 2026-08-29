import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
} from 'class-validator';
import {
  cardStyleValues,
  occasionPreferenceValues,
  packagingPreferenceValues,
} from '../account-profile.types';

export class UpdatePreferencesDto {
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsIn(occasionPreferenceValues, { each: true })
  occasions!: string[];

  @IsString()
  @IsIn(packagingPreferenceValues)
  packaging!: string;

  @IsString()
  @IsIn(cardStyleValues)
  cardStyle!: string;

  @IsBoolean()
  avoidPlasticExtras!: boolean;

  @IsBoolean()
  occasionReminders!: boolean;

  @IsBoolean()
  newCollectionUpdates!: boolean;

  @IsBoolean()
  impactMilestones!: boolean;
}
