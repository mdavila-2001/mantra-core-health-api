import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública tras crear un usuario (UC-01-01). Sin campos sensibles. */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ description: 'Concept id del estado del usuario', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
