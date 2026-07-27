import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { AccessScopeCode, TenantRoleCode } from './create-membership.dto';

/**
 * Cuerpo de `PATCH /tenants/{tenantId}/memberships/{membershipId}/role`
 * (UC-04-08: cambiar rol / scope de membresía). Debe traer al menos uno de los dos.
 */
export class ChangeMembershipRoleDto {
  @ApiPropertyOptional({
    description: 'Nuevo rol de tenant',
    enum: ['OWNER', 'ADMIN', 'STAFF'],
  })
  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'STAFF'])
  role?: TenantRoleCode;

  @ApiPropertyOptional({
    description: 'Nuevo scope de acceso',
    enum: ['ALL_TENANT', 'BRANCH'],
  })
  @IsOptional()
  @IsIn(['ALL_TENANT', 'BRANCH'])
  accessScope?: AccessScopeCode;
}
