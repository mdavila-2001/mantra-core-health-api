import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
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
    La decisión del prestador sobre una solicitud de reserva.

    La especificación de centros de diagnóstico enumera exactamente lo que un
    centro puede hacer con un pedido: confirmarlo, rechazarlo, proponer otro
    horario, pedir documentación adicional, pedir una orden médica e informar
    instrucciones de preparación. Las tres últimas no son estados distintos —son
    la misma situación, «falta algo antes de confirmar»— así que se modelan como
    un único paso a `PENDING_CONFIRMATION` con un motivo tipado, y no como tres
    estados que después nadie sabe distinguir.
    ========================================================================== */

/** Qué decidió el prestador sobre la solicitud. */
export type BookingDecision =
  'CONFIRM' | 'REJECT' | 'REQUEST_INFO' | 'PROPOSE_SCHEDULE';

export const BOOKING_DECISIONS: readonly BookingDecision[] = [
  'CONFIRM',
  'REJECT',
  'REQUEST_INFO',
  'PROPOSE_SCHEDULE',
];

/** Qué le falta a la solicitud cuando el prestador pide información. */
export type BookingInfoRequest =
  'DOCUMENTATION' | 'MEDICAL_ORDER' | 'PREPARATION';

export const BOOKING_INFO_REQUESTS: readonly BookingInfoRequest[] = [
  'DOCUMENTATION',
  'MEDICAL_ORDER',
  'PREPARATION',
];

/** Una decisión registrada sobre la reserva. */
export class BookingDecisionItemDto {
  /** Estado del que salió (concept id). */
  @ApiPropertyOptional({ format: 'uuid' })
  fromStateConceptId?: string;

  /** Estado al que pasó (concept id). */
  @ApiPropertyOptional({ format: 'uuid' })
  toStateConceptId?: string;

  /** La decisión, si la transición vino de una. */
  @ApiPropertyOptional({ enum: BOOKING_DECISIONS })
  decision?: BookingDecision;

  /** Qué se pidió, si se pidió algo. */
  @ApiPropertyOptional({ enum: BOOKING_INFO_REQUESTS })
  infoRequested?: BookingInfoRequest;

  /** Lo que el prestador escribió. */
  @ApiPropertyOptional()
  message?: string;

  /** Cuándo se registró. */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}

/** El historial de decisiones de una reserva. */
export class BookingDecisionsResponseDto {
  /** Reserva consultada. */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /** Las decisiones, de la más vieja a la más nueva. */
  @ApiProperty({ type: [BookingDecisionItemDto] })
  items!: BookingDecisionItemDto[];
}
