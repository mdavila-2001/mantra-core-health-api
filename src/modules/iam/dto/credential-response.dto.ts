import { ApiProperty } from '@nestjs/swagger';

/** Respuesta tras crear/enlazar una credencial (UC-01-02). */
export class CredentialResponseDto {
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
   * Valor de method mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del método de credencial',
    format: 'uuid',
  })
  method!: string;
}
