import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública de una branch (UC-04-04). */
export class BranchResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la branch',
    format: 'uuid',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
