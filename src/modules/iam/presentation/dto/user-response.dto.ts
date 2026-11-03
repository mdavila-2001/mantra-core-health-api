import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública tras crear un usuario (UC-01-01). Sin campos sensibles. */
export class UserResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty()
  displayName!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del usuario',
    format: 'uuid',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
