import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common';

const DOCUMENT_TYPE_RE = /^[a-z][a-z0-9_.-]{1,60}$/;

/**
 * Query de `GET /document-store/collections/:collection/documents`. Hereda la
 * paginación común; el listado siempre se acota al tenant del contexto, no hay
 * listado global entre tenants.
 */
export class ListDocumentsQueryDto extends PaginationQueryDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Filtrar por clasificación de documento',
  })
  @IsOptional()
  @Matches(DOCUMENT_TYPE_RE)
  documentType?: string;
}
