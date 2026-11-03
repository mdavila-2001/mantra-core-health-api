import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query de scoping por tenant para operaciones de lectura/borrado por id
 * (`GET`/`DELETE .../documents/:id`). El tenant real es el del contexto; si el
 * cliente declara otro, la operación responde 404.
 */
export class TenantScopeQueryDto {
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
}
