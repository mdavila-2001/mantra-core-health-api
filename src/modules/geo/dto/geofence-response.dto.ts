import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública de un geofence definido (UC-13-04). */
export class GeofenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Concept id de la forma', format: 'uuid' })
  shapeType!: string;

  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
