import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  Max,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
} from '../state/booking-transition';

/** Canal por el que se originó la reserva. */
export type BookingChannel = 'PORTAL' | 'DESK' | 'PHONE';
export const BOOKING_CHANNELS: readonly BookingChannel[] = [
  'PORTAL',
  'DESK',
  'PHONE',
];

/**
 * Por qué medio ocurre la ATENCIÓN — la modalidad de la cita.
 *
 * Distinto de {@link BookingChannel}, que dice cómo se **pidió** el turno. Un
 * turno pedido por teléfono puede atenderse en persona, y uno pedido por el
 * portal puede ser una teleconsulta: son dos ejes y viven en dos columnas
 * (`appointment_bookings.booking_channel_concept_id` y
 * `clinical.appointments.channel_concept_id`).
 */
export type AppointmentChannel = 'PRESENCIAL' | 'TELECONSULTA' | 'DOMICILIO';
export const APPOINTMENT_CHANNELS: readonly AppointmentChannel[] = [
  'PRESENCIAL',
  'TELECONSULTA',
  'DOMICILIO',
];

/** Cuerpo de `POST /scheduling/slots/{id}/holds` (UC-41-05). */
export class CreateHoldDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'Paciente para el que se reserva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

/**
 * Define el contrato validado para hold response.
 */
export class HoldResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de hold token mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Token con el que se confirma la reserva. Se entrega una sola vez.',
  })
  holdToken!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  /**
   * Valor de remaining capacity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupos que quedan libres en el slot' })
  remainingCapacity!: number;
}

/** Cuerpo de `POST /scheduling/holds/{holdToken}/confirm` (UC-41-06). */
export class ConfirmBookingDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ description: 'Paciente titular de la cita', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({ description: 'Canal de la reserva', enum: BOOKING_CHANNELS })
  @IsIn(BOOKING_CHANNELS as readonly string[])
  channel!: BookingChannel;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /**
   * Valor de reminder offsets minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Minutos de antelación de los recordatorios a programar',
    isArray: true,
    type: Number,
    example: [1440, 120],
  })
  // Validado elemento a elemento por la misma razón: el servicio calcula
  // `slot.startAt - offset * 60_000`, así que un elemento no numérico se
  // persistiría como fecha inválida en vez de rechazarse en la frontera.
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  reminderOffsetsMinutes?: number[];
}

/**
 * Cuerpo de `POST /scheduling/holds/{holdToken}/request` (corrección #11).
 *
 * Es el mismo cuerpo de la confirmación **menos los recordatorios**: una
 * solicitud todavía no tiene día garantizado, así que programarle avisos sería
 * prometerle a alguien un turno que el profesional aún no aceptó. Se programan
 * al aceptar.
 */
export class RequestBookingDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente que solicita la cita',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({ description: 'Canal de la solicitud', enum: BOOKING_CHANNELS })
  @IsIn(BOOKING_CHANNELS as readonly string[])
  channel!: BookingChannel;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo de consulta: por qué se pide el turno',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_REASON_LENGTH)
  reasonText?: string;
}

/**
 * Define el contrato validado para booking response.
 */
export class BookingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a bookable slot.
   */
  @ApiProperty({ format: 'uuid' })
  bookableSlotId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de reminders scheduled mantenido por la instancia.
   */
  @ApiProperty({ description: 'Recordatorios programados junto con la cita' })
  remindersScheduled!: number;
}

/**
 * Cuerpo de `POST /scheduling/bookings/{id}/accept` (corrección #11).
 *
 * Todo opcional: aceptar es un acto sin datos. Los recordatorios se declaran
 * acá y no al solicitar porque recién al aceptar hay un turno que recordar.
 */
export class AcceptBookingDto {
  /**
   * Valor de reminder offsets minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Minutos de antelación de los recordatorios a programar',
    isArray: true,
    type: Number,
    example: [1440, 120],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  reminderOffsetsMinutes?: number[];
}

/**
 * Cuerpo de `POST /scheduling/bookings/{id}/reject` (correcciones #11 y #14).
 *
 * El motivo es obligatorio: a nadie se le rechaza un turno sin decirle por qué.
 */
export class RejectBookingDto {
  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Motivo del rechazo. Obligatorio: el paciente lo ve en el detalle de su turno.',
    minLength: MIN_REASON_LENGTH,
    maxLength: MAX_REASON_LENGTH,
  })
  @IsString()
  @MinLength(MIN_REASON_LENGTH)
  @MaxLength(MAX_REASON_LENGTH)
  reasonText!: string;
}

/**
 * Resultado de aceptar, iniciar o completar: en qué estado quedó y cuándo.
 *
 * Los tres devuelven lo mismo porque los tres son la misma clase de acto —una
 * transición decidida por el profesional— y quien los consume hace lo mismo con
 * la respuesta: releer y refrescar el estado en pantalla.
 */
export class BookingDecisionResponseDto {
  /**
   * Identificador asociado a booking.
   */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que quedó la cita',
  })
  statusConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt!: string;

  /**
   * Las solicitudes del paciente que este «sí» dejó sin efecto (regla 2 del
   * choque de turnos): aceptar una cancela las pendientes que se superponen.
   *
   * Vacío es lo normal —la mayoría de las aceptaciones no desplazan nada—, y
   * por eso viene siempre, en vez de omitirse: quien consume distingue «no
   * desplazó ninguna» de «esta respuesta no lo cuenta». El servicio ya lo
   * devolvía; faltaba declararlo acá, así que no salía en el contrato OpenAPI
   * y el `accept` respondía con un campo que su propio tipo negaba.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Citas pendientes que quedaron canceladas por chocar con ésta',
  })
  desplazadas!: readonly string[];
}

/** Cuerpo de `POST /scheduling/bookings/{id}/reschedule` (UC-41-08). */
export class RescheduleBookingDto {
  /**
   * Identificador asociado a to slot.
   */
  @ApiProperty({ description: 'Slot destino', format: 'uuid' })
  @IsUUID()
  toSlotId!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   *
   * **Obligatorio** (corrección #14): mover un turno le cambia el día a alguien,
   * y esa persona tiene derecho a saber por qué. Se persiste con la transición y
   * la otra parte lo ve en el detalle de la cita.
   */
  @ApiProperty({
    description:
      'Motivo del cambio. Obligatorio: se le muestra a la otra parte en el detalle de la cita.',
    minLength: MIN_REASON_LENGTH,
    maxLength: MAX_REASON_LENGTH,
  })
  @IsString()
  @MinLength(MIN_REASON_LENGTH)
  @MaxLength(MAX_REASON_LENGTH)
  reasonText!: string;
}

/**
 * Define el contrato validado para reschedule response.
 */
export class RescheduleResponseDto {
  /**
   * Identificador asociado a booking.
   */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /**
   * Identificador asociado a from slot.
   */
  @ApiProperty({ format: 'uuid' })
  fromSlotId!: string;

  /**
   * Identificador asociado a to slot.
   */
  @ApiProperty({ format: 'uuid' })
  toSlotId!: string;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/cancel` (UC-41-09). */
export class CancelBookingDto {
  /**
   * Valor de cancelled by mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Quién origina la cancelación',
    enum: ['PATIENT', 'PROVIDER'],
  })
  @IsIn(['PATIENT', 'PROVIDER'])
  cancelledBy!: 'PATIENT' | 'PROVIDER';

  /**
   * Valor de is no show mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'true si la cita se marca como inasistencia (aplica el cargo de la política)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isNoShow?: boolean;

  /**
   * Valor de reason text mantenido por la instancia.
   *
   * **Obligatorio** (corrección #14). El `reason_concept_id` que ya se
   * persistía dice *quién* canceló, no *por qué*: eso es lo que la otra parte
   * necesita leer, y hasta ahora no había forma de decirlo.
   */
  @ApiProperty({
    description:
      'Motivo de la cancelación. Obligatorio: se le muestra a la otra parte en el detalle de la cita.',
    minLength: MIN_REASON_LENGTH,
    maxLength: MAX_REASON_LENGTH,
  })
  @IsString()
  @MinLength(MIN_REASON_LENGTH)
  @MaxLength(MAX_REASON_LENGTH)
  reasonText!: string;
}

/**
 * Define el contrato validado para cancel booking response.
 */
export class CancelBookingResponseDto {
  /**
   * Identificador asociado a booking.
   */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Cargo aplicado, si la política lo contempla',
    required: false,
  })
  feeAmount?: string;

  /**
   * Valor de capacity released mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupo devuelto al slot' })
  capacityReleased!: boolean;
}

/**
 * Define el contrato validado para check in response.
 */
export class CheckInResponseDto {
  /**
   * Identificador asociado a booking.
   */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /**
   * Valor de checked in at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  checkedInAt!: string;
}

/** Cuerpo de `POST /scheduling/waitlist` (UC-41-11). */
export class CreateWaitlistEntryDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({ description: 'Recurso deseado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  /**
   * Valor de desired from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  desiredFrom?: string;

  /**
   * Valor de desired to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  desiredTo?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Prioridad; a mayor valor, antes se promueve',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

/**
 * Define el contrato validado para waitlist entry response.
 */
export class WaitlistEntryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty()
  priority!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/reminders` (UC-41-13). */
export class ScheduleRemindersDto {
  /**
   * Valor de offsets minutes mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Minutos de antelación de cada recordatorio',
    isArray: true,
    type: Number,
    example: [1440, 120],
  })
  // Sin decorador de class-validator, el `ValidationPipe` global —que corre con
  // `forbidNonWhitelisted: true`— trataba este campo como propiedad ajena al DTO
  // y respondía 400 «property offsetsMinutes should not exist». Como además es
  // obligatorio, no había cuerpo alguno que el endpoint aceptara: UC-41-13
  // (`POST /scheduling/bookings/{id}/reminders`) era inalcanzable.
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  offsetsMinutes!: number[];

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Canal de envío',
    enum: ['SMS', 'EMAIL'],
    default: 'SMS',
  })
  @IsOptional()
  @IsIn(['SMS', 'EMAIL'])
  channel?: 'SMS' | 'EMAIL';
}

/**
 * Define el contrato validado para schedule reminders response.
 */
export class ScheduleRemindersResponseDto {
  /**
   * Identificador asociado a booking.
   */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /**
   * Valor de scheduled mantenido por la instancia.
   */
  @ApiProperty()
  scheduled!: number;
}

/** Resultado de los endpoints internos de worker (UC-41-07/12/14). */
export class WorkerBatchResultDto {
  /**
   * Valor de processed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Elementos procesados en el lote' })
  processed!: number;

  /**
   * Valor de detail mantenido por la instancia.
   */
  @ApiProperty({ description: 'Detalle de lo que hizo el worker' })
  detail!: string;
}

/** Cuerpo de los endpoints internos con tamaño de lote configurable. */
export class WorkerBatchDto {
  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño máximo del lote', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/**
 * Respuesta del descubrimiento de candidatos de promoción (UC-41-12): slots
 * con cupo libre cuyo recurso tiene lista de espera activa.
 */
export class WaitlistCandidateSlotsResponseDto {
  /**
   * Valor de slot ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Slots candidatos a promoción, del más próximo al más lejano',
  })
  slotIds!: string[];
}

/* ============================================================================
    Lo que el centro puede pedir o proponer antes de aceptar — CARRIL 11.

    `accept` y `reject` son del carril 07 y ya viven arriba. Lo que sigue son
    las dos cosas que la especificación de centros de diagnóstico agrega y que
    ningún otro carril cubre: pedir algo antes de confirmar, y contraproponer
    un horario sobre una solicitud que todavía no se aceptó.
    ========================================================================== */

/** Qué le falta a la solicitud cuando el centro pide algo. */
export type BookingInfoRequest =
  'DOCUMENTATION' | 'MEDICAL_ORDER' | 'PREPARATION';

export const BOOKING_INFO_REQUESTS: readonly BookingInfoRequest[] = [
  'DOCUMENTATION',
  'MEDICAL_ORDER',
  'PREPARATION',
];

/** Cuerpo de `POST /scheduling/bookings/{id}/request-info` (UC-41-18). */
export class RequestBookingInfoDto {
  /** Qué se le pide a la persona. */
  @ApiProperty({
    description: 'Qué falta antes de poder aceptar',
    enum: BOOKING_INFO_REQUESTS,
  })
  @IsIn(BOOKING_INFO_REQUESTS as readonly string[])
  infoRequested!: BookingInfoRequest;

  /**
   * El mensaje para la persona: qué documento traer, cómo prepararse.
   *
   * Obligatorio, como el motivo de rechazar o cancelar (corrección #14): pedir
   * algo sin decir qué es no le sirve a nadie.
   */
  @ApiProperty({ description: 'Mensaje para el paciente' })
  @IsString()
  @MaxLength(500)
  reasonText!: string;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/propose-schedule` (UC-41-19). */
export class ProposeScheduleDto {
  /** Cupo que el centro propone en lugar del pedido. */
  @ApiProperty({ format: 'uuid', description: 'Cupo propuesto' })
  @IsUUID()
  proposedSlotId!: string;

  /** Por qué se propone otro horario. Obligatorio (corrección #14). */
  @ApiProperty({ description: 'Motivo de la propuesta' })
  @IsString()
  @MaxLength(500)
  reasonText!: string;
}

/** Resultado de contraproponer un horario. */
export class ProposeScheduleResponseDto {
  /** Solicitud sobre la que se propuso. */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /** Estado en el que quedó (concept id): sigue pendiente. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cupo que se liberó. */
  @ApiProperty({ format: 'uuid' })
  fromSlotId!: string;

  /** Cupo que quedó tomado. */
  @ApiProperty({ format: 'uuid' })
  toSlotId!: string;
}

/* ==========================================================================
   P8 · Avisos de agenda — demora del médico y lectura de la lista de espera
   ========================================================================== */

/**
 * Tope de la demora que se puede informar de una vez.
 *
 * Cuatro horas. Más que eso no es una demora: es un turno que hay que
 * reprogramar, y avisar «me demoro seis horas» dejaría a la persona esperando
 * un turno que en la práctica ya no existe.
 */
export const MAX_DELAY_MINUTES = 240;

/** Mínimo con sentido: por debajo de cinco minutos el aviso molesta más de lo que informa. */
export const MIN_DELAY_MINUTES = 5;

/** Largo máximo del mensaje que acompaña a la demora. */
export const MAX_DELAY_MESSAGE_LENGTH = 300;

/** Cuerpo de `POST /scheduling/bookings/{id}/delay` (P8, registro 3.5 y 4.2). */
export class DelayBookingDto {
  /**
   * Cuántos minutos se estima la demora.
   */
  @ApiProperty({
    description: 'Minutos de demora estimados',
    minimum: MIN_DELAY_MINUTES,
    maximum: MAX_DELAY_MINUTES,
    example: 20,
  })
  @IsInt()
  @Min(MIN_DELAY_MINUTES)
  delayMinutes!: number;

  /**
   * Lo que el profesional quiera agregar. Opcional a propósito: exigir un texto
   * para avisar una demora es la forma más rápida de que nadie la avise.
   */
  @ApiPropertyOptional({
    description: 'Mensaje del profesional para el paciente',
    maxLength: MAX_DELAY_MESSAGE_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DELAY_MESSAGE_LENGTH)
  message?: string;
}

/**
 * Cuerpo de `POST /scheduling/resources/{id}/delay` (P8): «me demoro 20 minutos
 * hoy», que es como el profesional lo dice en la práctica.
 */
export class DelayResourceDto {
  /**
   * Cuántos minutos se estima la demora.
   */
  @ApiProperty({
    description: 'Minutos de demora estimados',
    minimum: MIN_DELAY_MINUTES,
    maximum: MAX_DELAY_MINUTES,
    example: 20,
  })
  @IsInt()
  @Min(MIN_DELAY_MINUTES)
  delayMinutes!: number;

  /**
   * Mensaje opcional para los pacientes afectados.
   */
  @ApiPropertyOptional({
    description: 'Mensaje del profesional para los pacientes',
    maxLength: MAX_DELAY_MESSAGE_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DELAY_MESSAGE_LENGTH)
  message?: string;

  /**
   * Desde cuándo alcanza la demora. Por omisión, ahora: una demora informada a
   * las 10 no puede alcanzar al turno de las 8, que ya pasó.
   */
  @ApiPropertyOptional({
    description:
      'Inicio de la ventana afectada (ISO 8601). Por omisión, ahora.',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /**
   * Hasta cuándo. Por omisión, el fin del día del profesional: una demora se
   * arrastra por la jornada, no por la semana.
   */
  @ApiPropertyOptional({
    description:
      'Fin de la ventana afectada (ISO 8601). Por omisión, el fin del día.',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/** Resultado de informar una demora. */
export class DelayNoticeResponseDto {
  /**
   * A cuántos pacientes se les avisó efectivamente (bandeja escrita).
   */
  @ApiProperty({ description: 'Pacientes que recibieron el aviso' })
  notified!: number;

  /**
   * Cuántas citas quedaban dentro de la ventana afectada.
   */
  @ApiProperty({ description: 'Citas alcanzadas por la demora' })
  affected!: number;

  /**
   * Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  bookingIds!: string[];

  /**
   * Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó.
   */
  @ApiProperty()
  detail!: string;
}

/** Filtros de `GET /scheduling/waitlist` (P8). */
export class ListWaitlistQueryDto {
  /**
   * Paciente cuya lista de espera se consulta.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * `true` para incluir también las entradas ya cubiertas o canceladas.
   */
  @ApiPropertyOptional({
    description: 'Incluye las entradas ya cubiertas (por omisión, no)',
  })
  @IsOptional()
  @IsString()
  includeClosed?: string;

  /**
   * Tope de filas.
   */
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** Una entrada de la lista de espera, como la ve quien se anotó. */
export class WaitlistEntryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string;

  /**
   * Cómo se llama la agenda en la que espera. Sin esto la pantalla mostraría un
   * uuid, que no le dice nada a quien está esperando un turno.
   */
  @ApiProperty({ description: 'Nombre del profesional o del recurso' })
  resourceLabel!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  desiredFrom?: Date;

  @ApiPropertyOptional({ format: 'date-time' })
  desiredTo?: Date;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  /**
   * Quién espera, por su nombre.
   *
   * Sólo viaja en `GET /scheduling/resources/{id}/waitlist` —la lectura de
   * quien atiende esa agenda—. En la lectura por paciente se omite: el titular
   * ya sabe cómo se llama, y mandarlo sería exponer un dato sin motivo.
   */
  @ApiPropertyOptional({ description: 'Nombre del paciente que espera' })
  patientName?: string;
}

/**
 * Query de `GET /scheduling/resources/{id}/waitlist`.
 *
 * No lleva `patientProfileId`: la agenda viaja en la ruta y el sujeto de la
 * lectura son **todos** los que esperan en ella. Filtrar además por paciente
 * sería otra pregunta, y la responde el endpoint del paciente.
 */
export class ListResourceWaitlistQueryDto {
  /**
   * `true` para incluir también las entradas ya cubiertas o canceladas.
   */
  @ApiPropertyOptional({
    description: 'Incluye las entradas ya cubiertas (por omisión, no)',
  })
  @IsOptional()
  @IsString()
  includeClosed?: string;

  /**
   * Tope de filas.
   */
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** Respuesta de `GET /scheduling/waitlist`. */
export class ListWaitlistResponseDto {
  @ApiProperty({ type: [WaitlistEntryItemDto] })
  items!: WaitlistEntryItemDto[];
}

/**
 * Cuerpo de `POST /scheduling/appointments/direct` — la cita puntual (AG-2).
 *
 * El doctor asigna: «volvé el jueves a las 10». La cita ya se acordó en el
 * consultorio, así que nace CONFIRMADA y el paciente SE ENTERA (campana con
 * salida de «pedir cambio»), no confirma.
 */
export class CreateDirectAppointmentDto {
  /** El paciente al que se le asigna la cita. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * La agenda del doctor donde ocurre — su consultorio o su sede de
   * organización. Elegir el recurso ES elegir la sede, y el gating del vínculo
   * ya gobernó quién puede tener agenda dónde.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;

  /** Cuándo empieza. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  /**
   * Cuánto dura, en minutos. Libre a propósito: la cirugía de 3 horas y la
   * consulta de 45 son el punto entero del caso.
   */
  @ApiProperty({ minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

  /** El motivo, que el paciente ve en su turno. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /**
   * Por qué medio ocurre la atención.
   *
   * Se escribe en `clinical.appointments.channel_concept_id`, que es donde el
   * modelo declara la modalidad. **Omitirlo significa presencial**: es lo que
   * fueron todas las citas hasta hoy, así que el valor por defecto no afirma
   * nada que nadie haya registrado.
   *
   * No confundir con el canal de la RESERVA (`booking_channel_concept_id`),
   * que dice cómo se pidió el turno —portal, mostrador, teléfono—, no cómo se
   * atiende. Un turno pedido por teléfono puede ser presencial, y uno pedido
   * por el portal puede ser teleconsulta.
   */
  @ApiPropertyOptional({
    enum: APPOINTMENT_CHANNELS,
    description:
      'Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva.',
  })
  @IsOptional()
  @IsIn(APPOINTMENT_CHANNELS as readonly string[])
  channel?: AppointmentChannel;
}

/** Respuesta de la cita puntual. */
export class DirectAppointmentResponseDto {
  /** La reserva creada, ya confirmada. */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /** El cupo único que la respalda. */
  @ApiProperty({ format: 'uuid' })
  bookableSlotId!: string;

  /** Estado con el que nace: confirmada. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Cupos ofrecidos que esta cita retiró.
   *
   * Si el rato pisaba horarios libres que el doctor mismo ofrecía —en
   * cualquiera de sus sedes—, se retiran en la misma transacción y acá se
   * informa cuántos: el front lo muestra como AVISO («esto quitó N horarios
   * disponibles»), no como pregunta.
   */
  @ApiProperty()
  retractedSlots!: number;
}

/* -- El estado de pago de una cita (TAREA-13 punto 5) ------------------------ */

/**
 * Los tres estados de pago, en el orden en que se muestran.
 *
 * Son los que pidió el propietario, y sólo esos: **«reembolsada» quedó
 * expresamente fuera**. Viajan como claves estables y no como uuid porque el
 * cliente no tiene por qué conocer los conceptos; el servidor los traduce.
 */
export type PaymentState = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export const PAYMENT_STATES: readonly PaymentState[] = [
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
];

/** Cuerpo de `PUT /scheduling/bookings/{id}/payment-state` (TAREA-13 punto 5). */
export class SetPaymentStateDto {
  /**
   * En qué estado de pago queda la cita.
   */
  @ApiProperty({
    description: 'Estado de pago de la cita',
    enum: PAYMENT_STATES,
  })
  @IsIn(PAYMENT_STATES)
  state!: PaymentState;

  /**
   * Si se usó un seguro.
   *
   * Va **separado** del estado por pedido expreso del propietario: una cita
   * puede estar parcialmente pagada con seguro o sin él. Es opcional en el
   * cuerpo y se guarda como `false` si no viene, que es lo mismo que decir
   * «no se registró uso de seguro».
   */
  @ApiPropertyOptional({
    description: 'Marca de que la cita se cubrió con seguro',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  insuranceUsed?: boolean;
}

/**
 * El estado de pago tal como se lee.
 *
 * Lleva **quién y cuándo** porque es lo que pide AC-13-10: marcar una cita como
 * pagada es una afirmación sobre el dinero de alguien y no puede quedar sin
 * firma.
 */
export class PaymentStateDto {
  /** Clave estable del estado. */
  @ApiProperty({ enum: PAYMENT_STATES })
  state!: PaymentState;

  /** Cómo se llama en pantalla, en castellano. */
  @ApiProperty({ example: 'Parcialmente pagada' })
  label!: string;

  /** El concepto real detrás, por si el cliente lo necesita. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty()
  insuranceUsed!: boolean;

  /** Quién la dejó en este estado. */
  @ApiProperty({ format: 'uuid' })
  markedByUserId!: string;

  /** Cuándo. */
  @ApiProperty({ format: 'date-time' })
  markedAt!: string;
}
