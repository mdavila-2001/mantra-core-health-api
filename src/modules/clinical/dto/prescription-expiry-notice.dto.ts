import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Tope de recetas que un barrido procesa. */
export const PRESCRIPTION_EXPIRY_MAX_BATCH = 500;
export const PRESCRIPTION_EXPIRY_DEFAULT_BATCH = 200;

/** Cuerpo de `POST /clinical/internal/prescription-expiry-notices`. */
export class PrescriptionExpirySweepDto {
  @ApiPropertyOptional({
    description: 'Tamaño máximo del lote',
    minimum: 1,
    maximum: PRESCRIPTION_EXPIRY_MAX_BATCH,
    default: PRESCRIPTION_EXPIRY_DEFAULT_BATCH,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(PRESCRIPTION_EXPIRY_MAX_BATCH)
  limit?: number;
}

/** Qué hizo un barrido de avisos de vencimiento. */
export class PrescriptionExpirySweepResultDto {
  @ApiProperty({
    description: 'Recetas por vencer sin aviso previo que se consideraron',
  })
  scanned!: number;

  @ApiProperty({ description: 'Avisos entregados a la bandeja del paciente' })
  notified!: number;

  @ApiProperty({
    description:
      'Avisos que la preferencia del paciente detuvo; quedan registrados y no se reintentan',
  })
  suppressed!: number;

  @ApiProperty({
    description:
      'Avisos que no se pudieron emitir; el siguiente barrido los reintenta',
  })
  failed!: number;

  @ApiProperty({
    description: '`true` si otro barrido estaba en curso y éste no hizo nada',
  })
  skipped!: boolean;
}
