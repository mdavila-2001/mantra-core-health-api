import { ApiProperty } from '@nestjs/swagger';

/** Respuesta tras crear/enlazar una credencial (UC-01-02). */
export class CredentialResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    description: 'Concept id del método de credencial',
    format: 'uuid',
  })
  method!: string;
}
