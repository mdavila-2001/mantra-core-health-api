import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsObject, IsOptional, IsUUID } from 'class-validator';
import { CLINICAL_SEVERITIES, type ClinicalSeverity } from '../common';

// ---------------------------------------------------------------------------
// UC-53-07 · Eventos de anestesia
// ---------------------------------------------------------------------------

/** Naturaleza del evento intraoperatorio de anestesia. */
export type AnesthesiaEventType =
  | 'INDUCTION'
  | 'INTUBATION'
  | 'MEDICATION'
  | 'VITALS'
  | 'EMERGENCE'
  | 'COMPLICATION';
export const ANESTHESIA_EVENT_TYPES = [
  'INDUCTION',
  'INTUBATION',
  'MEDICATION',
  'VITALS',
  'EMERGENCE',
  'COMPLICATION',
] as const;

/** Cuerpo de `POST /procedure-cases/{id}/anesthesia-events` (UC-53-07). */
export class RecordAnesthesiaEventDto {
  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANESTHESIA_EVENT_TYPES })
  @IsIn(ANESTHESIA_EVENT_TYPES)
  eventType!: AnesthesiaEventType;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Momento del evento' })
  @IsISO8601()
  occurredAt!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES, default: 'ROUTINE' })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  /**
   * Identificador asociado a medication administration.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationAdministrationId?: string;

  /**
   * Identificador asociado a observation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  /**
   * Identificador asociado a device.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  /**
   * Identificador asociado a performed by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle del evento' })
  @IsOptional()
  @IsObject()
  detailsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para anesthesia event response.
 */
export class AnesthesiaEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @ApiProperty({ format: 'uuid' })
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito creado si el evento fue inducción o despertar',
  })
  milestoneId?: string;
}
