import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Roles de tenant asignables a una membresía. */
export type TenantRoleCode = 'OWNER' | 'ADMIN' | 'STAFF';
/** Scopes de acceso de una membresía. */
export type AccessScopeCode = 'ALL_TENANT' | 'BRANCH';

/** Cuerpo de `POST /tenants/{tenantId}/memberships` (UC-04-05: incorporar usuario). */
export class CreateMembershipDto {
  @ApiProperty({ description: 'Usuario a incorporar al tenant', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Rol dentro del tenant', enum: ['OWNER', 'ADMIN', 'STAFF'] })
  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'STAFF'])
  role?: TenantRoleCode;

  @ApiPropertyOptional({ description: 'Scope de acceso', enum: ['ALL_TENANT', 'BRANCH'] })
  @IsOptional()
  @IsIn(['ALL_TENANT', 'BRANCH'])
  accessScope?: AccessScopeCode;

  @ApiPropertyOptional({ description: 'Branch primaria opcional', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryBranchId?: string;
}
