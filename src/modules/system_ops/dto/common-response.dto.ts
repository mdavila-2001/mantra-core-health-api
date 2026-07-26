import { ApiProperty } from '@nestjs/swagger';

/** Resultado genérico que expone el id del recurso creado/afectado. */
export class IdResultDto {
  @ApiProperty({ description: 'Identificador del recurso', format: 'uuid' })
  id!: string;
}

/** Resultado genérico de una operación de estado. */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
