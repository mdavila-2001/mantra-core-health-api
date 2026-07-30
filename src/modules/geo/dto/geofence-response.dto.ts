import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública de un geofence definido (UC-13-04). */
export class GeofenceResponseDto {
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
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de shape type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id de la forma', format: 'uuid' })
  shapeType!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
