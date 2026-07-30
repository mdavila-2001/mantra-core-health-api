import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un tenant (UC-04-01/02/03). */
export class TenantResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty()
  legalName!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del tenant',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Identificador asociado a parent tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant padre si es sub-tenant',
    format: 'uuid',
  })
  parentTenantId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
