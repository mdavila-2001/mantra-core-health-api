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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsIn(RESOURCE_TYPES as readonly string[])
  resourceType!: ResourceType;

  @ApiProperty({
    description:
      'Tipo de la entidad referenciada (referencia polimórfica), p. ej. practitioner_profiles',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  resourceRefType!: string;

  @ApiProperty({ description: 'Id de la entidad referenciada', format: 'uuid' })
  @IsUUID()
  resourceRefId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA del recurso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    description: 'Atenciones simultáneas que admite',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class ResourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Cuerpo de `POST /scheduling/booking-policies` (UC-41-01). */
export class CreateBookingPolicyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código único de la política dentro del tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Práctica a la que aplica la política',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({
    description: 'Antelación mínima para reservar, en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minNoticeMinutes?: number;

  @ApiPropertyOptional({ description: 'Máximo de días de antelación' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAdvanceDays?: number;

  @ApiPropertyOptional({
    description: 'Ventana sin penalización para cancelar, en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationWindowMinutes?: number;

  @ApiPropertyOptional({
    description: 'Cargo por inasistencia',
    example: '50.00',
  })
  @IsOptional()
  @IsNumberString()
  noShowFeeAmount?: string;

  @ApiPropertyOptional({
    description: 'Citas activas simultáneas por paciente',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxActivePerPatient?: number;

  @ApiPropertyOptional({
    description: 'Vigencia de la reserva temporal del slot, en segundos',
    default: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  holdTtlSeconds?: number;
}

export class BookingPolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Franja semanal de la plantilla. */
export class ScheduleRuleDto {
  @ApiProperty({
    description: '0 = domingo … 6 = sábado',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Hora de inicio HH:MM:SS', example: '08:00:00' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'startTime debe tener formato HH:MM o HH:MM:SS',
  })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin HH:MM:SS', example: '12:00:00' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'endTime debe tener formato HH:MM o HH:MM:SS',
  })
  endTime!: string;

  @ApiPropertyOptional({ description: 'Duración del slot en minutos' })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotMinutes?: number;

  @ApiPropertyOptional({ description: 'Cupos por slot' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacityPerSlot?: number;
}

/** Cuerpo de `POST /scheduling/resources/{id}/templates` (UC-41-02). */
export class CreateTemplateDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Franjas semanales de la plantilla',
    type: [ScheduleRuleDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleRuleDto)
  rules!: ScheduleRuleDto[];

  @ApiPropertyOptional({
    description: 'Duración por defecto del slot, en minutos',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotMinutes?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bookingPolicyId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

export class TemplateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Franjas creadas' })
  ruleCount!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /scheduling/templates/{id}/generate-slots` (UC-41-03). */
export class GenerateSlotsDto {
  @ApiProperty({
    description: 'Inicio de la ventana a materializar',
    format: 'date-time',
  })
  @IsISO8601()
  from!: string;

  @ApiProperty({
    description: 'Fin de la ventana (exclusivo)',
    format: 'date-time',
  })
  @IsISO8601()
  to!: string;
}

export class GenerateSlotsResponseDto {
  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  @ApiProperty({ description: 'Slots creados en esta ejecución' })
  created!: number;

  @ApiProperty({ description: 'Slots que ya existían y se conservaron' })
  skipped!: number;
}

/** Tipo de excepción de disponibilidad. */
export type ExceptionType = 'ABSENCE' | 'HOLIDAY' | 'EXTRA';

/** Cuerpo de `POST /scheduling/resources/{id}/exceptions` (UC-41-04). */
export class CreateExceptionDto {
  @ApiProperty({
    description: 'Tipo de excepción',
    enum: ['ABSENCE', 'HOLIDAY', 'EXTRA'],
  })
  @IsIn(['ABSENCE', 'HOLIDAY', 'EXTRA'])
  exceptionType!: ExceptionType;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endAt!: string;

  @ApiPropertyOptional({ description: 'Motivo visible en agenda' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description:
      'true cuando la excepción **añade** disponibilidad extraordinaria',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class ExceptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Slots libres que quedaron bloqueados por la excepción',
  })
  blockedSlots!: number;
}
