import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments`
 * (UC-04-06: asignar usuario a branch).
 */
export class BranchAssignmentDto {
  @ApiProperty({
    description: 'Branch a la que se asigna la membresía',
    format: 'uuid',
  })
  @IsUUID()
  branchId!: string;

  @ApiPropertyOptional({
    description: 'Concept id del rol local en la branch',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  localRoleConceptId?: string;
}
