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
} from 'class-validator';

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
   */
  @ApiPropertyOptional({ description: 'Motivo del cambio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
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
