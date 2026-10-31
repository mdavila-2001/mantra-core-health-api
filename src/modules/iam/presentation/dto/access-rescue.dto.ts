import { ApiProperty } from '@nestjs/swagger';

/** Resultado de una ruta de rescate. */
export class AccessRescueResultDto {
  /** Cuántas filas activas se retiraron (quedan como histórico). */
  @ApiProperty({ minimum: 0 })
  retired!: number;
}
