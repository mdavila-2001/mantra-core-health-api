import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Franja semanal en la que el doctor recibe visitadores. */
export class VisitWindowDto {
  /**
   * Día de la semana, 0 = domingo … 6 = sábado.
   */
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  /**
   * Hora de inicio, `HH:MM`.
   */
  @ApiProperty({ example: '15:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime debe ser HH:MM' })
  startTime!: string;

  /**
   * Hora de fin, `HH:MM`.
   */
  @ApiProperty({ example: '17:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime debe ser HH:MM' })
  endTime!: string;

  /**
   * Duración estándar de cada visita, en minutos.
   */
  @ApiProperty({ minimum: 5, maximum: 240 })
  @IsInt()
  @Min(5)
  @Max(240)
  slotDurationMinutes!: number;

  /**
   * Modalidad de la ventana.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modalityConceptId!: string;

  /**
   * Ubicación o enlace.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  /**
   * Máximo de visitas dentro de la ventana.
   */
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxVisits?: number;
}

/**
 * Configuración completa de la agenda de visitas del doctor (UC-17-11).
 *
 * Es un `PUT` de reemplazo, no un `PATCH`: la agenda es un conjunto coherente de
 * ventanas y una edición parcial dejaría estados intermedios en los que una
 * ventana vieja convive con la regla nueva.
 */
export class PutVisitPolicyDto {
  /**
   * Organización del doctor bajo la que se atienden las visitas.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Zona horaria IANA que rige los horarios declarados.
   */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;

  /**
   * Si la confirmación es automática cuando la solicitud cumple todas las reglas.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  /**
   * Máximo de visitas por día.
   */
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxVisitsPerDay?: number;

  /**
   * Antelación mínima, en horas.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  minNoticeHours?: number;

  /**
   * Plazo de reprogramación y cancelación, en horas antes del inicio.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  rescheduleCutoffHours?: number;

  /**
   * Especialidades admitidas.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  allowedSpecialtyConceptIds?: string[];

  /**
   * Duración máxima admitida, en minutos.
   */
  @ApiPropertyOptional({ minimum: 5, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  maxDurationMinutes?: number;

  /**
   * Ventanas de atención. Al menos una: una política sin ventanas equivale a no
   * recibir visitadores, y para eso existe desactivar la política.
   */
  @ApiProperty({ type: [VisitWindowDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VisitWindowDto)
  windows!: VisitWindowDto[];
}

/** Bloqueo de un laboratorio o de un visitador por parte del doctor (UC-17-12). */
export class CreateVisitBlockDto {
  /**
   * Laboratorio bloqueado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaLabId?: string;

  /**
   * Visitador bloqueado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicalVisitorId?: string;

  /**
   * Razón justificada. La spec la exige, así que es obligatoria.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}
