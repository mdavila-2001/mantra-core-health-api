import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de perfiles públicos (V19-15). */
export class PublicProfileItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  targetTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  targetId!: string;

  @ApiProperty({ type: String })
  slug!: string;

  @ApiProperty({ type: String })
  displayName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  headline!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  biography!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  avatarFileId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  coverFileId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  verificationStatusConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  visibilityConceptId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  acceptsReviews!: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  commentsDefaultEnabled!: boolean | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de perfiles públicos. */
export class ListPublicProfilesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de perfiles públicos. */
export class PublicProfilePageDto extends pageResponseOf(
  PublicProfileItemDto,
  'PublicProfilePageDto',
) {}
