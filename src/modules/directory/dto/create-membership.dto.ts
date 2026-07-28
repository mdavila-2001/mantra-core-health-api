import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Roles de tenant asignables a una membresía. */
export type TenantRoleCode = 'OWNER' | 'ADMIN' | 'STAFF';
/** Scopes de acceso de una membresía. */
export type AccessScopeCode = 'ALL_TENANT' | 'BRANCH';

/** Cuerpo de `POST /tenants/{tenantId}/memberships` (UC-04-05: incorporar usuario). */
export class CreateMembershipDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({
    description: 'Usuario a incorporar al tenant',
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rol dentro del tenant',
    enum: ['OWNER', 'ADMIN', 'STAFF'],
  })
  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'STAFF'])
  role?: TenantRoleCode;

  /**
   * Valor de access scope mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Scope de acceso',
    enum: ['ALL_TENANT', 'BRANCH'],
  })
  @IsOptional()
  @IsIn(['ALL_TENANT', 'BRANCH'])
  accessScope?: AccessScopeCode;

  /**
   * Identificador asociado a primary branch.
   */
  @ApiPropertyOptional({
    description: 'Branch primaria opcional',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  primaryBranchId?: string;
}
