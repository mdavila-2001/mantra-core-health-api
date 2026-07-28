import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common';

const DOCUMENT_TYPE_RE = /^[a-z][a-z0-9_.-]{1,60}$/;

/**
 * Query de `GET /document-store/collections/:collection/documents`. Hereda la
 * paginación común y exige `tenantId`: no hay listado global entre tenants.
 */
export class ListDocumentsQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Tenant cuyos documentos se listan', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ description: 'Filtrar por clasificación de documento' })
  @IsOptional()
  @Matches(DOCUMENT_TYPE_RE)
  documentType?: string;
}
