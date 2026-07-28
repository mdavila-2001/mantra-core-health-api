import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Tipo de recurso agendable. */
export type ResourceType = 'PRACTITIONER' | 'ROOM' | 'EQUIPMENT';
export const RESOURCE_TYPES: readonly ResourceType[] = [
  'PRACTITIONER',
  'ROOM',
  'EQUIPMENT',
];

/** Cuerpo de `POST /scheduling/resources` (UC-41-01). */
export class CreateResourceDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de resource type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsIn(RESOURCE_TYPES as readonly string[])
  resourceType!: ResourceType;

  /**
   * Valor de resource ref type mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Tipo de la entidad referenciada (referencia polimórfica), p. ej. practitioner_profiles',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  resourceRefType!: string;

  /**
   * Identificador asociado a resource ref.
   */
  @ApiProperty({ description: 'Id de la entidad referenciada', format: 'uuid' })
  @IsUUID()
  resourceRefId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA del recurso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Valor de capacity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Atenciones simultáneas que admite',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

/**
 * Define el contrato validado para resource response.
 */
export class ResourceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Cuerpo de `POST /scheduling/booking-policies` (UC-41-01). */
export class CreateBookingPolicyDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de la política dentro del tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    description: 'Práctica a la que aplica la política',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Valor de min notice minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Antelación mínima para reservar, en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minNoticeMinutes?: number;

  /**
   * Valor de max advance days mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máximo de días de antelación' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAdvanceDays?: number;

  /**
   * Valor de cancellation window minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ventana sin penalización para cancelar, en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationWindowMinutes?: number;

  /**
   * Valor de no show fee amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cargo por inasistencia',
    example: '50.00',
  })
  @IsOptional()
  @IsNumberString()
  noShowFeeAmount?: string;

  /**
   * Valor de max active per patient mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Citas activas simultáneas por paciente',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxActivePerPatient?: number;

  /**
   * Valor de hold ttl seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigencia de la reserva temporal del slot, en segundos',
    default: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  holdTtlSeconds?: number;
}

/**
 * Define el contrato validado para booking policy response.
 */
export class BookingPolicyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Franja semanal de la plantilla. */
export class ScheduleRuleDto {
  /**
   * Valor de day of week mantenido por la instancia.
   */
  @ApiProperty({
    description: '0 = domingo … 6 = sábado',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  /**
   * Valor de start time mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hora de inicio HH:MM:SS', example: '08:00:00' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'startTime debe tener formato HH:MM o HH:MM:SS',
  })
  startTime!: string;

  /**
   * Valor de end time mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hora de fin HH:MM:SS', example: '12:00:00' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'endTime debe tener formato HH:MM o HH:MM:SS',
  })
  endTime!: string;

  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración del slot en minutos' })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotMinutes?: number;

  /**
   * Valor de capacity per slot mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cupos por slot' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacityPerSlot?: number;
}

/** Cuerpo de `POST /scheduling/resources/{id}/templates` (UC-41-02). */
export class CreateTemplateDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de rules mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Franjas semanales de la plantilla',
    type: [ScheduleRuleDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleRuleDto)
  rules!: ScheduleRuleDto[];

  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Duración por defecto del slot, en minutos',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotMinutes?: number;

  /**
   * Identificador asociado a booking policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bookingPolicyId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/**
 * Define el contrato validado para template response.
 */
export class TemplateResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de rule count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Franjas creadas' })
  ruleCount!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /scheduling/templates/{id}/generate-slots` (UC-41-03). */
export class GenerateSlotsDto {
  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Inicio de la ventana a materializar',
    format: 'date-time',
  })
  @IsISO8601()
  from!: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fin de la ventana (exclusivo)',
    format: 'date-time',
  })
  @IsISO8601()
  to!: string;
}

/**
 * Define el contrato validado para generate slots response.
 */
export class GenerateSlotsResponseDto {
  /**
   * Identificador asociado a template.
   */
  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Slots creados en esta ejecución' })
  created!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Slots que ya existían y se conservaron' })
  skipped!: number;
}

/** Tipo de excepción de disponibilidad. */
export type ExceptionType = 'ABSENCE' | 'HOLIDAY' | 'EXTRA';

/** Cuerpo de `POST /scheduling/resources/{id}/exceptions` (UC-41-04). */
export class CreateExceptionDto {
  /**
   * Valor de exception type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de excepción',
    enum: ['ABSENCE', 'HOLIDAY', 'EXTRA'],
  })
  @IsIn(['ABSENCE', 'HOLIDAY', 'EXTRA'])
  exceptionType!: ExceptionType;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endAt!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo visible en agenda' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  /**
   * Valor de is available mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'true cuando la excepción **añade** disponibilidad extraordinaria',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

/**
 * Define el contrato validado para exception response.
 */
export class ExceptionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de blocked slots mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Slots libres que quedaron bloqueados por la excepción',
  })
  blockedSlots!: number;
}
