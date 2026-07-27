import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
  @ApiPropertyOptional({
    description: 'Paciente para el que se reserva',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

export class HoldResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description:
      'Token con el que se confirma la reserva. Se entrega una sola vez.',
  })
  holdToken!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ description: 'Cupos que quedan libres en el slot' })
  remainingCapacity!: number;
}

/** Cuerpo de `POST /scheduling/holds/{holdToken}/confirm` (UC-41-06). */
export class ConfirmBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Paciente titular de la cita', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Canal de la reserva', enum: BOOKING_CHANNELS })
  @IsIn(BOOKING_CHANNELS as readonly string[])
  channel!: BookingChannel;

  @ApiPropertyOptional({ description: 'Motivo de consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  @ApiPropertyOptional({
    description: 'Minutos de antelación de los recordatorios a programar',
    isArray: true,
    type: Number,
    example: [1440, 120],
  })
  @IsOptional()
  reminderOffsetsMinutes?: number[];
}

export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  bookableSlotId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Recordatorios programados junto con la cita' })
  remindersScheduled!: number;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/reschedule` (UC-41-08). */
export class RescheduleBookingDto {
  @ApiProperty({ description: 'Slot destino', format: 'uuid' })
  @IsUUID()
  toSlotId!: string;

  @ApiPropertyOptional({ description: 'Motivo del cambio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

export class RescheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  @ApiProperty({ format: 'uuid' })
  fromSlotId!: string;

  @ApiProperty({ format: 'uuid' })
  toSlotId!: string;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/cancel` (UC-41-09). */
export class CancelBookingDto {
  @ApiProperty({
    description: 'Quién origina la cancelación',
    enum: ['PATIENT', 'PROVIDER'],
  })
  @IsIn(['PATIENT', 'PROVIDER'])
  cancelledBy!: 'PATIENT' | 'PROVIDER';

  @ApiPropertyOptional({
    description:
      'true si la cita se marca como inasistencia (aplica el cargo de la política)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isNoShow?: boolean;
}

export class CancelBookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  @ApiProperty({
    description: 'Cargo aplicado, si la política lo contempla',
    required: false,
  })
  feeAmount?: string;

  @ApiProperty({ description: 'Cupo devuelto al slot' })
  capacityReleased!: boolean;
}

export class CheckInResponseDto {
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  @ApiProperty({ format: 'date-time' })
  checkedInAt!: string;
}

/** Cuerpo de `POST /scheduling/waitlist` (UC-41-11). */
export class CreateWaitlistEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Recurso deseado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  desiredFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  desiredTo?: string;

  @ApiPropertyOptional({
    description: 'Prioridad; a mayor valor, antes se promueve',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class WaitlistEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /scheduling/bookings/{id}/reminders` (UC-41-13). */
export class ScheduleRemindersDto {
  @ApiProperty({
    description: 'Minutos de antelación de cada recordatorio',
    isArray: true,
    type: Number,
    example: [1440, 120],
  })
  offsetsMinutes!: number[];

  @ApiPropertyOptional({
    description: 'Canal de envío',
    enum: ['SMS', 'EMAIL'],
    default: 'SMS',
  })
  @IsOptional()
  @IsIn(['SMS', 'EMAIL'])
  channel?: 'SMS' | 'EMAIL';
}

export class ScheduleRemindersResponseDto {
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  @ApiProperty()
  scheduled!: number;
}

/** Resultado de los endpoints internos de worker (UC-41-07/12/14). */
export class WorkerBatchResultDto {
  @ApiProperty({ description: 'Elementos procesados en el lote' })
  processed!: number;

  @ApiProperty({ description: 'Detalle de lo que hizo el worker' })
  detail!: string;
}

/** Cuerpo de los endpoints internos con tamaño de lote configurable. */
export class WorkerBatchDto {
  @ApiPropertyOptional({ description: 'Tamaño máximo del lote', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
