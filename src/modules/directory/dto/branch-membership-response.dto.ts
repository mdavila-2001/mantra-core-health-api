import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una asignación a branch (UC-04-06). */
export class BranchMembershipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant membership.
   */
  @ApiProperty({ format: 'uuid' })
  tenantMembershipId!: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiProperty({ format: 'uuid' })
  branchId!: string;

  /**
   * Valor de local role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Concept id del rol local',
    format: 'uuid',
  })
  localRole?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;
}
