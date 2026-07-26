import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una asignación a branch (UC-04-06). */
export class BranchMembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantMembershipId!: string;

  @ApiProperty({ format: 'uuid' })
  branchId!: string;

  @ApiPropertyOptional({ description: 'Concept id del rol local', format: 'uuid' })
  localRole?: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;
}
