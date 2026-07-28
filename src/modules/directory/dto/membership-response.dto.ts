import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una membresía de tenant (UC-04-05/08). */
export class MembershipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de tenant role mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del rol de tenant', format: 'uuid' })
  tenantRole!: string;

  /**
   * Valor de access scope mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del scope de acceso',
    format: 'uuid',
  })
  accessScope!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la membresía',
    format: 'uuid',
  })
  status!: string;

  /**
   * Identificador asociado a primary branch.
   */
  @ApiPropertyOptional({ description: 'Branch primaria', format: 'uuid' })
  primaryBranchId?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: Date;
}
