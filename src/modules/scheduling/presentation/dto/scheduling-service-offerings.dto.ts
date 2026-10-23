import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  APPOINTMENT_CHANNELS,
  type AppointmentChannel,
} from './scheduling-bookings.dto';

/** Techo de duración de un servicio: el mismo de la regla `ck_…_duration_range` de la base. */
export const MAX_SERVICE_DURATION_MINUTES = 720;

/** Techo de preparación y de limpieza. */
export const MAX_SERVICE_BUFFER_MINUTES = 240;

/** Cuerpo de `POST /scheduling/service-offerings`. */
export class CreateServiceOfferingDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Servicio del catálogo de la práctica que se ofrece',
  })
  @IsUUID()
  serviceCatalogId!: string;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_SERVICE_DURATION_MINUTES,
    description: 'Lo mínimo que puede tardar, en minutos',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERVICE_DURATION_MINUTES)
  minDurationMinutes!: number;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_SERVICE_DURATION_MINUTES,
    description:
      'Lo máximo que puede tardar. Es el tiempo que se reserva en la agenda',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERVICE_DURATION_MINUTES)
  maxDurationMinutes!: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: MAX_SERVICE_BUFFER_MINUTES,
    description: 'Preparación antes de atender; el paciente no la ve',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_SERVICE_BUFFER_MINUTES)
  prepMinutes?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: MAX_SERVICE_BUFFER_MINUTES,
    description: 'Limpieza o cierre después de atender; el paciente no la ve',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_SERVICE_BUFFER_MINUTES)
  cleanupMinutes?: number;

  @ApiPropertyOptional({
    default: true,
    description: 'Si el paciente puede pedirlo por su cuenta desde el portal',
  })
  @IsOptional()
  @IsBoolean()
  isPatientBookable?: boolean;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si cada pedido espera la aceptación del profesional en vez de confirmarse solo',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ enum: APPOINTMENT_CHANNELS })
  @IsOptional()
  @IsIn(APPOINTMENT_CHANNELS as readonly string[])
  channel?: AppointmentChannel;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Sólo para quien administra agendas: el profesional dueño de la oferta. ' +
      'Un profesional siempre la crea para sí mismo.',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;
}

/** Cuerpo de `PATCH /scheduling/service-offerings/{id}`. */
export class UpdateServiceOfferingDto {
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_SERVICE_DURATION_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERVICE_DURATION_MINUTES)
  minDurationMinutes?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_SERVICE_DURATION_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SERVICE_DURATION_MINUTES)
  maxDurationMinutes?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_SERVICE_BUFFER_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_SERVICE_BUFFER_MINUTES)
  prepMinutes?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_SERVICE_BUFFER_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_SERVICE_BUFFER_MINUTES)
  cleanupMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPatientBookable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ enum: APPOINTMENT_CHANNELS })
  @IsOptional()
  @IsIn(APPOINTMENT_CHANNELS as readonly string[])
  channel?: AppointmentChannel;

  @ApiPropertyOptional({
    description: 'Falso para dejar de ofrecerlo sin borrarlo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Query de `GET /scheduling/service-offerings`. */
export class ListServiceOfferingsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Profesional cuyas ofertas se listan. Un profesional que no la manda ve las suyas.',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;
}

/** Una oferta de servicio, con lo que el catálogo dice del servicio. */
export class ServiceOfferingDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  serviceCatalogId!: string;

  @ApiProperty({ description: 'Código del servicio en el catálogo' })
  serviceCode!: string;

  @ApiProperty({ description: 'Nombre del servicio en el catálogo' })
  serviceName!: string;

  @ApiProperty({ description: 'Precio de catálogo, con dos decimales' })
  price!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  currencyConceptId?: string;

  @ApiProperty() minDurationMinutes!: number;
  @ApiProperty() maxDurationMinutes!: number;
  @ApiProperty() prepMinutes!: number;
  @ApiProperty() cleanupMinutes!: number;
  @ApiProperty() isPatientBookable!: boolean;
  @ApiProperty() requiresApproval!: boolean;

  @ApiPropertyOptional({ enum: APPOINTMENT_CHANNELS })
  channel?: AppointmentChannel;

  @ApiProperty() isActive!: boolean;
}

/** Respuesta de `GET /scheduling/service-offerings`. */
export class ServiceOfferingListDto {
  @ApiProperty({ type: [ServiceOfferingDto] })
  items!: ServiceOfferingDto[];
}

/** Query de `GET /scheduling/service-availability`. */
export class ServiceAvailabilityQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  offeringId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Una sede en particular; sin ella se buscan en todas las del profesional',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;
}

/** Un inicio posible para el servicio, en una sede. */
export class ServiceStartDto {
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo se reserva: inicio más la duración máxima',
  })
  endAtMax!: string;

  @ApiProperty({
    format: 'date-time',
    description:
      'Cuándo podría terminar como pronto: inicio más la duración mínima',
  })
  endAtMin!: string;
}

/** Respuesta de `GET /scheduling/service-availability`. */
export class ServiceAvailabilityResponseDto {
  @ApiProperty({ format: 'uuid' }) offeringId!: string;
  @ApiProperty() minDurationMinutes!: number;
  @ApiProperty() maxDurationMinutes!: number;

  @ApiProperty({ type: [ServiceStartDto] })
  items!: ServiceStartDto[];
}

/** Cuerpo de `POST /scheduling/service-offerings/{id}/holds`. */
export class CreateServiceHoldDto {
  @ApiProperty({ format: 'uuid', description: 'Sede donde se atiende' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Cuándo empieza la atención',
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

/** Respuesta de `POST /scheduling/service-offerings/{id}/holds`. */
export class ServiceHoldResponseDto {
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

  @ApiProperty({
    description:
      'Cupos de consulta que este turno retiró de la agenda del profesional',
  })
  retractedSlots!: number;
}
