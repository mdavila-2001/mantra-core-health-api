import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

/**
 * Horario flexible, sin turnos fijos (P36).
 *
 * La lectura dice qué horas se pueden pedir; la retención crea el cupo de la hora
 * elegida. Se **confirma** con las rutas de siempre
 * (`POST /scheduling/holds/{token}/confirm` y `/request`): el cupo que nace al
 * retener es una reserva más para el resto del sistema.
 */

/** Query de `GET /scheduling/resources/{id}/flexible-availability`. */
export class FlexibleAvailabilityQueryDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;
}

/** Una hora que se puede pedir en un horario flexible. */
export class FlexibleStartDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Plantilla flexible que la ofrece',
  })
  templateId!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo se reserva: inicio más el tiempo por paciente',
  })
  endAt!: string;
}

/** Respuesta de `GET /scheduling/resources/{id}/flexible-availability`. */
export class FlexibleAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) resourceId!: string;

  @ApiProperty({
    description:
      'Cada cuántos minutos se ofrece una hora. Al retener se acepta cualquier minuto dentro de la franja.',
  })
  stepMinutes!: number;

  @ApiProperty({
    type: [FlexibleStartDto],
    description:
      'Horas libres, ordenadas. Vacío si la agenda no tiene horario flexible publicado o no queda lugar.',
  })
  items!: FlexibleStartDto[];
}

/** Cuerpo de `POST /scheduling/resources/{id}/flexible-holds`. */
export class CreateFlexibleHoldDto {
  @ApiProperty({
    format: 'date-time',
    description:
      'La hora que pidió el paciente, en un minuto entero, dentro de una franja flexible',
  })
  @IsISO8601()
  startAt!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente para el que se reserva',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

/** Respuesta de `POST /scheduling/resources/{id}/flexible-holds`. */
export class FlexibleHoldResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;

  @ApiProperty({
    description:
      'Token con el que se confirma o solicita la reserva. Se entrega una sola vez.',
  })
  holdToken!: string;

  @ApiProperty({ format: 'date-time' }) expiresAt!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'El cupo que nació para este turno',
  })
  bookableSlotId!: string;

  @ApiProperty({ format: 'date-time' }) startAt!: string;
  @ApiProperty({ format: 'date-time' }) endAt!: string;
}
