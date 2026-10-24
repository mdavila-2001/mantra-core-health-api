import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de autoridades de verificación (V27-09). */
export class IdentityAuthorityItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  authorityCode!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  authorityTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  jurisdictionConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assuranceFrameworkConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de autoridades de verificación. */
export class ListAuthoritiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorityTypeConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de autoridades de verificación. */
export class IdentityAuthorityPageDto extends pageResponseOf(
  IdentityAuthorityItemDto,
  'IdentityAuthorityPageDto',
) {}
