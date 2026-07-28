import { ApiProperty } from '@nestjs/swagger';

/** Resultado genérico de una operación de estado (revoke-consent, etc.). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
