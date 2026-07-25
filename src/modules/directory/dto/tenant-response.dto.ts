import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un tenant (UC-04-01/02/03). */
export class TenantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  legalName!: string;

  @ApiProperty({ description: 'Concept id del estado del tenant', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Concept id del estado de verificación', format: 'uuid' })
  verificationStatus!: string;

  @ApiPropertyOptional({ description: 'Tenant padre si es sub-tenant', format: 'uuid' })
  parentTenantId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
