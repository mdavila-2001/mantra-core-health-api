import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Ventana por defecto del despacho: las tomas de los próximos 15 minutos. */
export const MEDICATION_REMINDER_WINDOW_MINUTES = 15;

/** Tope por defecto de recetas examinadas por pasada. */
export const MEDICATION_REMINDER_BATCH_LIMIT = 200;

/** Cuerpo de `POST /clinical/internal/medication-reminders/dispatch`. */
export class DispatchMedicationRemindersDto {
  /** Minutos hacia adelante que cubre la pasada. */
  @ApiPropertyOptional({
    description: 'Minutos hacia adelante que cubre la pasada',
    minimum: 1,
    maximum: 60,
    default: MEDICATION_REMINDER_WINDOW_MINUTES,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  windowMinutes?: number;

  /** Tope de recetas examinadas. */
  @ApiPropertyOptional({
    description: 'Tope de recetas examinadas en la pasada',
    minimum: 1,
    maximum: 1000,
    default: MEDICATION_REMINDER_BATCH_LIMIT,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

/** Resultado de una pasada del despacho. Misma forma que `WorkerBatchResultDto`. */
export class DispatchMedicationRemindersResultDto {
  /** Avisos in-app creados en esta pasada. */
  @ApiProperty()
  processed!: number;

  /** Resumen legible, sin datos clínicos. */
  @ApiProperty()
  detail!: string;
}
