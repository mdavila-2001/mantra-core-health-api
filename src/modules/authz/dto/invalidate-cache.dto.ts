import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /authz/pdp/cache/invalidate` (UC-06-11).
 *
 * La clave de cache del PDP es `(tenantId, userId|roleId)`. Todos los campos son
 * opcionales: sin ninguno se invalida el ámbito global del tenant.
 */
@ApiSchema({ name: 'AuthzInvalidateCacheDto' })
export class InvalidateCacheDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant afectado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario cuya decisión se invalida',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a role.
   */
  @ApiPropertyOptional({
    description: 'Rol cuya decisión se invalida',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
