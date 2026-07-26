import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /authz/pdp/cache/invalidate` (UC-06-11).
 *
 * La clave de cache del PDP es `(tenantId, userId|roleId)`. Todos los campos son
 * opcionales: sin ninguno se invalida el ámbito global del tenant.
 */
export class InvalidateCacheDto {
  @ApiPropertyOptional({ description: 'Tenant afectado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Usuario cuya decisión se invalida', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Rol cuya decisión se invalida', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
