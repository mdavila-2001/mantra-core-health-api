import { ApiProperty } from '@nestjs/swagger';

/** Resultado genérico de una operación de estado (transfer, offboard, suspend). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
