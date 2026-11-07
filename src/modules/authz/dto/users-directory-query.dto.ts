import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DIRECTORY_USER_TYPES } from '../ports/users-directory-read.port';

export const USERS_DIRECTORY_MAX_PAGE_SIZE = 100;
export const USERS_DIRECTORY_DEFAULT_PAGE_SIZE = 50;

/**
 * Filters of `GET /authz/users/directory`. There is deliberately no free-text
 * filter: a name or email in the query string would land in access logs.
 */
export class UsersDirectoryQueryDto {
  @ApiPropertyOptional({ enum: DIRECTORY_USER_TYPES })
  @IsOptional()
  @IsIn(DIRECTORY_USER_TYPES)
  type?: (typeof DIRECTORY_USER_TYPES)[number];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id of iam.users.status_concept_id',
  })
  @IsOptional()
  @IsUUID()
  status?: string;

  @ApiPropertyOptional({ example: 'SECURITY_ADMIN' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Z0-9_]+$/)
  roleCode?: string;

  @ApiPropertyOptional({ description: 'Opaque cursor of the previous page' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: USERS_DIRECTORY_MAX_PAGE_SIZE,
    default: USERS_DIRECTORY_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(USERS_DIRECTORY_MAX_PAGE_SIZE)
  limit?: number;
}
