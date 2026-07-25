import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una membresía de tenant (UC-04-05/08). */
export class MembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ description: 'Concept id del rol de tenant', format: 'uuid' })
  tenantRole!: string;

  @ApiProperty({ description: 'Concept id del scope de acceso', format: 'uuid' })
  accessScope!: string;

  @ApiProperty({ description: 'Concept id del estado de la membresía', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ description: 'Branch primaria', format: 'uuid' })
  primaryBranchId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: Date;
}
