import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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

  /**
   * El respiro entre consultas, en minutos.
   *
   * El paso del generador pasa a ser `slotMinutes + gapMinutes`, pero **cada
   * turno sigue durando `slotMinutes`**: el respiro separa un turno del
   * siguiente, no alarga la consulta. Sin él, una agenda de 08:00 a 12:00 con
   * turnos de 30 minutos ofrece ocho seguidos y el profesional no tiene un
   * minuto entre paciente y paciente.
   *
   * **Anulable y sin valor por defecto**, igual que `slotMinutes`, que está en
   * la misma tabla y describe lo mismo. Ausente se lee como cero: «nadie lo
   * declaró» y «declararon cero» significan lo mismo para el generador, y un
   * `NOT NULL DEFAULT 0` obligaría a escribir un dato que nadie dio.
   */
  @ApiPropertyOptional({
    description:
      'Minutos de respiro entre un turno y el siguiente. Ausente ≡ 0',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  gapMinutes?: number;
}

/**
 * Cuerpo de `POST /scheduling/resources/{id}/templates` (UC-41-02).
 *
 * El nombre de esquema va explícito porque `surveys` declara otra clase
 * `CreateTemplateDto`: sin desambiguar, ambas colapsan en un único
 * `#/components/schemas/CreateTemplateDto` y el contrato publicaba la forma de
 * los cuestionarios (`title`, `ownerPractitionerId`…) para la publicación de
 * agenda de un profesional. Cualquier cliente generado desde el contrato —la
 * colección de Postman incluida— mandaba un cuerpo que este endpoint rechaza.
 * Mismo remedio que `PharmacyCreateSiteDto` y compañía.
 */
@ApiSchema({ name: 'SchedulingCreateTemplateDto' })
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
 * Una franja de una plantilla, como la lee la pantalla del médico.
 *
 * Va la hora de pared tal como se declaró —`09:00:00`—, no un instante: la
 * regla dice «los lunes de nueve a una», y convertirla a UTC acá obligaría a
 * elegir un lunes concreto para poder hacerlo.
 */
export class TemplateRuleDto {
  /** Día de la semana, 0 = domingo. */
  @ApiProperty({ minimum: 0, maximum: 6 })
  dayOfWeek!: number;

  /** Hora de inicio, de pared. */
  @ApiProperty({ example: '09:00:00' })
  startTime!: string;

  /** Hora de fin, de pared. */
  @ApiProperty({ example: '13:00:00' })
  endTime!: string;

  /** Duración de cada turno, si la franja la declara. */
  @ApiProperty({ required: false })
  slotMinutes?: number;

  /** Pacientes por turno, si la franja lo declara. */
  @ApiProperty({ required: false })
  capacityPerSlot?: number;

  /**
   * Minutos de respiro entre turnos, si la franja lo declara.
   *
   * Ausente ≡ 0: el front ya lo fija así (PR #234). No se emite cuando la
   * columna está nula, para que «no declarado» y «cero» sigan siendo
   * distinguibles por quien lee el contrato.
   */
  @ApiProperty({ required: false })
  gapMinutes?: number;
}

/**
 * Una plantilla publicada, con sus franjas.
 *
 * Es la lectura que faltaba: hasta ahora `scheduling` sólo tenía los dos POST
 * de plantilla, así que quien publicaba un horario no podía volver a verlo
 * nunca más —y el «nombre de la plantilla» que el alta pedía era una etiqueta
 * a ciegas—.
 */
export class TemplateDetailDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Nombre con el que se publicó. */
  @ApiProperty()
  name!: string;

  /** Las franjas, ordenadas por día y hora. */
  @ApiProperty({ type: [TemplateRuleDto] })
  rules!: TemplateRuleDto[];

  /** Duración por defecto de la plantilla, si la declara. */
  @ApiProperty({ required: false })
  slotMinutes?: number;

  /** Desde cuándo rige. */
  @ApiProperty({ required: false, format: 'date-time' })
  validFrom?: string;

  /** Hasta cuándo rige; ausente es «hasta nuevo aviso». */
  @ApiProperty({ required: false, format: 'date-time' })
  validTo?: string;

  /** La política de reserva que referencia, si tiene. */
  @ApiProperty({ required: false, format: 'uuid' })
  bookingPolicyId?: string;

  /** Estado de la plantilla. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Las plantillas de un recurso. */
export class TemplateListDto {
  /** Las plantillas publicadas, de la más reciente a la más vieja. */
  @ApiProperty({ type: [TemplateDetailDto] })
  items!: TemplateDetailDto[];

  /** Cuántas son. */
  @ApiProperty()
  count!: number;
}

/**
 * Una excepción de disponibilidad, como la lee el calendario del médico.
 *
 * Existe para que un día bloqueado **no se vea igual que un día sin agenda**:
 * los dos aparecen sin cupos, pero uno es «no atiendo los miércoles» y el otro
 * «ese miércoles no atiendo, y por esto». El motivo es la diferencia.
 */
export class AvailabilityExceptionDto {
  /** Identificador único de la instancia. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Tipo de excepción, como concepto. */
  @ApiProperty({ format: 'uuid' })
  exceptionTypeConceptId!: string;

  /** Comienzo del bloqueo. */
  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  /** Fin del bloqueo. */
  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  /** Por qué, si se declaró. Lo lee el profesional, no el paciente. */
  @ApiProperty({ required: false })
  reason?: string;

  /** `true` cuando la excepción ABRE disponibilidad en vez de cerrarla. */
  @ApiProperty({ required: false })
  isAvailable?: boolean;
}

/** Las excepciones de un recurso en una ventana. */
export class AvailabilityExceptionListDto {
  /** Las excepciones, de la más próxima a la más lejana. */
  @ApiProperty({ type: [AvailabilityExceptionDto] })
  items!: AvailabilityExceptionDto[];

  /** Cuántas son. */
  @ApiProperty()
  count!: number;
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

  /**
   * Cupos que NO se generaron porque pisaban un compromiso del profesional.
   *
   * La regla madre (AG-1): la cirugía del jueves hace que ese rato no se
   * ofrezca, en ninguna de sus sedes. Se informa para que quien publica sepa
   * que el hueco no es un error del generador.
   */
  @ApiProperty({
    description:
      'Cupos omitidos por chocar con compromisos del profesional (citas confirmadas en cualquiera de sus sedes)',
  })
  omittedByCommitments!: number;
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

/**
 * Lo que deja un borrado de plantilla (TAREA-10, punto 6).
 *
 * Dice qué se llevó consigo y no sólo «listo»: borrar un horario arrastra sus
 * franjas y sus cupos libres, y quien lo hace tiene derecho a ver el tamaño de
 * lo que acaba de deshacer.
 */
export class DeleteTemplateResponseDto {
  /** La plantilla borrada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Cupos libres que se fueron con ella. */
  @ApiProperty({ description: 'Cupos que se borraron junto con la plantilla' })
  deletedSlots!: number;

  /** Franjas semanales que se fueron con ella. */
  @ApiProperty({ description: 'Franjas de la plantilla que se borraron' })
  deletedRules!: number;
}
