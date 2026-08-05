import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments`
 * (UC-04-06: asignar usuario a branch).
 */
export class BranchAssignmentDto {
  /**
   * Identificador asociado a branch.
   */
  @ApiProperty({
    description: 'Branch a la que se asigna la membresía',
    format: 'uuid',
  })
  @IsUUID()
  branchId!: string;

  /**
   * Identificador asociado a local role concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del rol local en la branch',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  localRoleConceptId?: string;
}
