import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Query mínima de scoping por tenant para operaciones de lectura/borrado por id
 * (`GET`/`DELETE .../documents/:id`). Fuerza que toda operación puntual quede
 * acotada a un tenant, igual que el listado.
 */
export class TenantScopeQueryDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant propietario del documento',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;
}
