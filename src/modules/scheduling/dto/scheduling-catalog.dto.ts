import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  ArrayNotEmpty,
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

  /**
   * Si el horario fue retirado y ya no se publica.
   *
   * Viaja como booleano y no como `statusConceptId` a secas porque quien lo
   * consume es una pantalla, y comparar contra un UUID de concepto la obligaría
   * a conocerlo — que es exactamente lo que el proyecto evita. Mismo criterio
   * que `requiresText` en el catálogo de motivos.
   *
   * Importa para la lectura, no sólo para la etiqueta: el listado devuelve
   * **todas** las plantillas del recurso, retiradas incluidas, y sin esto la
   * pantalla mostraría un horario retirado como si fuera el vigente —basta con
   * que sea el más reciente—.
   */
  @ApiProperty({ description: 'true cuando el horario está retirado' })
  retired!: boolean;

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

  /**
   * El motivo catalogado, en palabras.
   *
   * **Viaja para todos**, incluido el paciente: es una etiqueta de una lista
   * cerrada —«Vacaciones», «Congreso o capacitación»— y no puede contener nada
   * que el profesional no haya elegido a propósito.
   *
   * Es la mitad segura del motivo. La otra —`reason`, el texto libre— sólo la
   * ve quien administra la agenda.
   */
  @ApiProperty({ example: 'Vacaciones' })
  reasonLabel!: string;

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

/**
 * Motivo de una excepción de disponibilidad.
 *
 * Los tres primeros nacieron con el módulo y describen la **mecánica**; los
 * cuatro siguientes son los motivos que el profesional elige, catalogados a
 * pedido del propietario.
 *
 * `OTHER` **exige** el texto libre de `reason`: es lo que permite que la lista
 * se quede corta sin bloquear a nadie, y lo que la gente escriba ahí es la
 * mejor fuente para ampliarla después.
 */
export type ExceptionType =
  | 'ABSENCE'
  | 'HOLIDAY'
  | 'EXTRA'
  | 'VACATION'
  | 'CONFERENCE'
  | 'ERRAND'
  | 'OTHER';

/** Los motivos que la pantalla ofrece, en el orden en que se muestran. */
export const EXCEPTION_TYPES: readonly ExceptionType[] = [
  'ABSENCE',
  'HOLIDAY',
  'VACATION',
  'CONFERENCE',
  'ERRAND',
  'EXTRA',
  'OTHER',
];

/** Cuerpo de `POST /scheduling/resources/{id}/exceptions` (UC-41-04). */
export class CreateExceptionDto {
  /**
   * Valor de exception type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Motivo de la excepción',
    enum: EXCEPTION_TYPES,
  })
  @IsIn(EXCEPTION_TYPES)
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
  @ApiPropertyOptional({
    description:
      'Texto libre del motivo. OBLIGATORIO cuando el tipo es OTHER; lo lee el profesional',
  })
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
 * Lo que deja retirar un horario (TAREA-10, punto 6).
 *
 * Dice qué se soltó y qué se conservó, y no sólo «listo»: retirar suelta los
 * cupos que nadie tocó y **conserva** los que tienen historia. Quien lo hace
 * tiene derecho a ver esa diferencia sin ir a mirar la base.
 */
/**
 * Lo que responde reactivar un horario pausado.
 *
 * Lleva `slotsPendientes` porque **reactivar no regenera los cupos**: retirar
 * los borró, y volver a crearlos es `generate-slots` con la ventana que el
 * profesional elija. Sin este campo, quien reactiva vería su horario «vigente»
 * y sin un solo turno ofrecido, y no tendría cómo saber por qué.
 */
export class ReactivateTemplateResponseDto {
  /** La plantilla reactivada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El estado con el que queda: `TPL_PUBLISHED`. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Hay que generar cupos: el horario está vigente pero todavía no ofrece nada. */
  @ApiProperty({
    description:
      'true cuando el horario quedó vigente sin cupos materializados y hay que generarlos',
  })
  slotsPendientes!: boolean;
}

export class RetireTemplateResponseDto {
  /** La plantilla retirada. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El estado con el que queda: `TPL_RETIRED`. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cupos que nadie reservó y dejaron de publicarse. */
  @ApiProperty({
    description: 'Cupos libres que se soltaron al retirar el horario',
  })
  releasedSlots!: number;

  /**
   * Cupos que se conservaron por tener una cita detrás, viva o histórica.
   *
   * Un número distinto de cero no es un error: es el historial que el retiro
   * respeta a propósito.
   */
  @ApiProperty({
    description: 'Cupos conservados porque tienen una cita detrás',
  })
  keptSlots!: number;
}

/** Un motivo de bloqueo tal como lo ofrece la pantalla. */
export class ExceptionTypeDto {
  /** Clave estable con la que se envía al crear la excepción. */
  @ApiProperty({ enum: EXCEPTION_TYPES })
  type!: ExceptionType;

  /** El concepto real detrás, por si el cliente lo necesita. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Cómo se llama en pantalla, en castellano. */
  @ApiProperty({ example: 'Congreso o capacitación' })
  label!: string;

  /**
   * Si elegirlo obliga a escribir el motivo.
   *
   * Viaja con el catálogo para que el formulario pueda pedir la explicación sin
   * saber de antemano cuál de los motivos la exige.
   */
  @ApiProperty({ description: 'true en «Otro»: exige texto libre' })
  requiresText!: boolean;

  /**
   * Si cierra horario o lo abre.
   *
   * `EXTRA` **añade** disponibilidad fuera del patrón: viaja en la misma lista
   * porque es una excepción más, pero la pantalla necesita distinguirlo para no
   * ofrecerlo donde se espera un bloqueo.
   */
  @ApiProperty({ description: 'false en la atención extraordinaria' })
  blocks!: boolean;
}

/** Respuesta de `GET /scheduling/exception-types`. */
export class ExceptionTypeListDto {
  /** Los motivos, en el orden en que se muestran. */
  @ApiProperty({ type: [ExceptionTypeDto] })
  items!: ExceptionTypeDto[];
}

/* -- Tipología raíz de la actividad (carril 12) ----------------------------- */

/** Las tipologías que la agenda sabe pintar, en el orden en que se muestran. */
export type ActivityType =
  'APPOINTMENT' | 'PROCEDURE' | 'FOLLOW_UP' | 'TELEHEALTH' | 'OTHER';

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'APPOINTMENT',
  'PROCEDURE',
  'FOLLOW_UP',
  'TELEHEALTH',
  'OTHER',
];

/**
 * Una tipología de actividad, tal como la publica la API.
 *
 * Lleva `tone` y no un color: el pedido dice «con otros colores», pero **el
 * color concreto es del sistema de diseño**, no de la API. Mandar un `#RRGGBB`
 * desde el servidor obligaría a redesplegarlo para cambiar una paleta, y
 * rompería el tema oscuro. El tono es semántico y cada pantalla lo resuelve con
 * sus propios tokens.
 */
export class ActivityTypeDto {
  /** Clave estable con la que se identifica la tipología. */
  @ApiProperty({ enum: ACTIVITY_TYPES })
  type!: ActivityType;

  /** El concepto real detrás, que es lo que guarda `appointments`. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Cómo se llama en pantalla, en castellano. */
  @ApiProperty({ example: 'Operación o procedimiento' })
  label!: string;

  /**
   * El tono con el que se pinta, del sistema de diseño.
   *
   * `error` queda reservado para los BLOQUEOS —el propietario los pidió «con
   * rojo»— así que ninguna tipología lo usa: si una actividad se pintara igual
   * que un bloqueo, la agenda diría que ese rato está cerrado cuando no lo está.
   */
  @ApiProperty({ enum: ['primary', 'secondary', 'info', 'warning', 'success'] })
  tone!: string;
}

export class ActivityTypeListDto {
  @ApiProperty({ type: [ActivityTypeDto] })
  items!: ActivityTypeDto[];
}

/* -- Mover el horario N minutos (carril 12) --------------------------------- */

/** Cuánto se puede correr una agenda de una vez, en minutos. */
export const MIN_SHIFT_MINUTES = -240;
export const MAX_SHIFT_MINUTES = 240;

/**
 * Cuerpo de `POST /scheduling/resources/{id}/shift-slots`.
 *
 * El pedido original: *«un botón que se llame mover horario, que desplace los
 * slots N minutos después y envíe mensajes automáticos por la app de mover
 * horarios y sea seleccionable a todos o ciertos slots en específico»*.
 */
export class ShiftSlotsDto {
  /**
   * Cuántos minutos se corre. Negativo adelanta.
   *
   * Se admite adelantar además de atrasar porque la situación real es
   * simétrica: el profesional que termina antes quiere adelantar a los que
   * esperan, y negarlo lo obligaría a cancelar y volver a crear.
   */
  @ApiProperty({
    description: 'Minutos a correr. Negativo adelanta.',
    minimum: MIN_SHIFT_MINUTES,
    maximum: MAX_SHIFT_MINUTES,
    example: 20,
  })
  @IsInt()
  @Min(MIN_SHIFT_MINUTES)
  @Max(MAX_SHIFT_MINUTES)
  shiftMinutes!: number;

  /** Desde cuándo se mira la agenda. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  /** Hasta cuándo. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;

  /**
   * Qué cupos mover. **Ausente = todos los de la ventana.**
   *
   * Es el «seleccionable a todos o ciertos slots en específico» del pedido. Se
   * distingue ausente de lista vacía: una lista vacía no mueve nada, y es una
   * petición que alguien armó mal — mejor que no haga nada a que mueva la
   * agenda entera.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  slotIds?: string[];
}

/** Lo que responde mover el horario. */
export class ShiftSlotsResponseDto {
  /** Cuántos cupos se corrieron. */
  @ApiProperty()
  movedSlots!: number;

  /**
   * A cuántas personas se les avisó.
   *
   * Menor que `movedSlots` es lo corriente: los cupos libres se mueven y no
   * hay a quién avisarle.
   */
  @ApiProperty()
  notified!: number;

  /** Los minutos que se aplicaron, para que el cliente confirme lo que pidió. */
  @ApiProperty()
  shiftMinutes!: number;
}

/* -- Cerrar cupos sueltos del día (carril 12) ------------------------------- */

/**
 * Cuerpo de `POST /scheduling/resources/{id}/close-slots`.
 *
 * El pedido original: *«otro botón para cancelar cita específica o slots
 * específicos, esto implícitamente detona un bloqueo de horario para el día de
 * hoy únicamente (para que no genere conflictos a la hora de generar los slots
 * disponibles en los horarios del doctor)»*.
 *
 * Esa aclaración entre paréntesis es la razón de ser del endpoint: cerrar un
 * cupo **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el
 * cupo vuelve como si nada.
 */
export class CloseSlotsDto {
  /** Por qué se cierra. Del mismo catálogo que los bloqueos. */
  @ApiProperty({ enum: EXCEPTION_TYPES })
  @IsIn(EXCEPTION_TYPES)
  exceptionType!: ExceptionType;

  /** La explicación, obligatoria si el motivo la exige. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  /**
   * Los cupos a cerrar.
   *
   * **Al menos uno.** A diferencia de mover, acá no hay «todos los de la
   * ventana»: cerrar la agenda entera de un día ya tiene su pantalla —bloquear—
   * y ofrecerlo también acá haría que un clic distraído cierre el día.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  slotIds!: string[];
}

/** Lo que responde cerrar cupos sueltos. */
export class CloseSlotsResponseDto {
  /** Cuántos cupos quedaron cerrados. */
  @ApiProperty()
  closedSlots!: number;

  /**
   * La excepción que se creó para que regenerar no los devuelva.
   *
   * Es la parte que el pedido pone entre paréntesis y que es su razón de ser:
   * sin ella, cerrar un cupo dura hasta la próxima generación.
   */
  @ApiProperty({ format: 'uuid' })
  exceptionId!: string;

  /** Desde cuándo cubre la excepción. */
  @ApiProperty({ format: 'date-time' })
  from!: string;

  /** Hasta cuándo. */
  @ApiProperty({ format: 'date-time' })
  to!: string;
}

/* -- Editar un bloqueo (carril 11, P-11-3) ---------------------------------- */

/**
 * Cuerpo de `PATCH /scheduling/exceptions/{id}`.
 *
 * Todo opcional: editar un bloqueo suele ser corregir **una** cosa —la hora de
 * fin, el motivo— y obligar a reenviar el resto haría que un cliente
 * desactualizado pise campos que nadie quiso tocar.
 */
export class UpdateExceptionDto {
  @ApiPropertyOptional({ enum: EXCEPTION_TYPES })
  @IsOptional()
  @IsIn(EXCEPTION_TYPES)
  exceptionType?: ExceptionType;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;
}

/** Lo que responde editar un bloqueo. */
export class UpdateExceptionResponseDto {
  /** El MISMO id que antes: editar no borra y recrea. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  /**
   * Cupos que se cerraron porque el rango creció.
   *
   * Achicar el rango **no reabre ninguno**, y por eso no hay campo para eso:
   * en este módulo los cupos sólo los crea publicar el horario.
   */
  @ApiProperty()
  blockedSlots!: number;
}
