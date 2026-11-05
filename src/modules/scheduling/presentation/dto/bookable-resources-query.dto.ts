import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const BOOKABLE_RESOURCES_MAX_LIMIT = 50;
export const BOOKABLE_RESOURCE_TYPES = ['PRACTITIONER', 'ROOM'] as const;
export type BookableResourceType = (typeof BOOKABLE_RESOURCE_TYPES)[number];

/** Query of `GET /scheduling/bookable-resources`. */
export class BookableResourcesQueryDto {
  /** Practitioners or laboratories; practitioners when omitted. */
  @ApiPropertyOptional({
    enum: BOOKABLE_RESOURCE_TYPES,
    default: 'PRACTITIONER',
  })
  @IsOptional()
  @IsIn(BOOKABLE_RESOURCE_TYPES)
  resourceType?: BookableResourceType;

  /** Free text matched against the person's or resource's name and the organization. */
  @ApiPropertyOptional({ maxLength: 100, example: 'quispe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Page size. */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: BOOKABLE_RESOURCES_MAX_LIMIT,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BOOKABLE_RESOURCES_MAX_LIMIT)
  limit?: number;

  /** Rows to skip. */
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
