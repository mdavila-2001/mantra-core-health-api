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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Qué se rastrea. */
export type SubjectType = 'SPECIMEN' | 'ORDER' | 'DEVICE';
const SUBJECT_TYPES = ['SPECIMEN', 'ORDER', 'DEVICE'] as const;

// ---------------------------------------------------------------------------
// UC-37-01 · Sujeto y envío
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/trackable-subjects` (UC-37-01). */
export class OpenSubjectDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ enum: SUBJECT_TYPES })
  @IsIn(SUBJECT_TYPES)
  subjectType!: SubjectType;

  @ApiProperty({ description: 'Tipo de la entidad rastreada', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  subjectRefType!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad rastreada' })
  @IsUUID()
  subjectRefId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Transportista asignado',
  })
  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originAddressId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationAddressId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Mensajero asignado' })
  @IsOptional()
  @IsUUID()
  assignedCourierUserId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'El envío exige cadena de frío',
  })
  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;
}

export class SubjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número de seguimiento, opaco y único' })
  trackingNumber!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  currentStatusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({ description: 'Número del envío' })
  shipmentNumber!: string;
}

// ---------------------------------------------------------------------------
// UC-37-02 · Catálogo de hitos
// ---------------------------------------------------------------------------

/** Estado que alcanza el sujeto al llegar al hito. */
export type MilestoneStatus =
  | 'CREATED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'HANDOFF'
  | 'DELIVERED'
  | 'CANCELLED';
const MILESTONE_STATUSES = [
  'CREATED',
  'PREPARING',
  'IN_TRANSIT',
  'HANDOFF',
  'DELIVERED',
  'CANCELLED',
] as const;

export class MilestoneDefinitionDto {
  @ApiProperty({
    description: 'Código del hito, único por tipo de sujeto',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: MILESTONE_STATUSES })
  @IsIn(MILESTONE_STATUSES)
  milestoneStatus!: MilestoneStatus;

  @ApiPropertyOptional({
    default: false,
    description: 'Alcanzarlo cierra el seguimiento del sujeto',
  })
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  @ApiPropertyOptional({ description: 'Minutos de compromiso para alcanzarlo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaMinutes?: number;
}

/** Cuerpo de `POST /tracking/milestone-definitions` (UC-37-02). */
export class DefineMilestonesDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ enum: SUBJECT_TYPES })
  @IsIn(SUBJECT_TYPES)
  subjectType!: SubjectType;

  @ApiProperty({
    type: [MilestoneDefinitionDto],
    description: 'Hitos esperados en orden, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MilestoneDefinitionDto)
  milestones!: MilestoneDefinitionDto[];
}

export class MilestonesResponseDto {
  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Hitos creados, en orden',
  })
  milestoneIds!: string[];

  @ApiProperty({ description: 'Hitos omitidos por tener ya ese código' })
  skipped!: number;

  @ApiProperty({ description: 'Hitos terminales declarados' })
  terminalCount!: number;
}

// ---------------------------------------------------------------------------
// UC-37-03 · Despacho
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/shipments/{id}/dispatch` (UC-37-03). */
export class DispatchShipmentDto {
  @ApiPropertyOptional({ description: 'Dónde se despachó', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mensajero que se hace cargo',
  })
  @IsOptional()
  @IsUUID()
  assignedCourierUserId?: string;
}

export class DispatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Evento de despacho registrado' })
  eventId!: string;

  @ApiProperty({ format: 'date-time' })
  dispatchedAt!: string;
}

// ---------------------------------------------------------------------------
// UC-37-04 · Evento de seguimiento
// ---------------------------------------------------------------------------

/** De dónde viene el evento. */
export type EventSource =
  'OPERATOR' | 'CARRIER_WEBHOOK' | 'COURIER_APP' | 'SYSTEM';
const EVENT_SOURCES = [
  'OPERATOR',
  'CARRIER_WEBHOOK',
  'COURIER_APP',
  'SYSTEM',
] as const;

/** Cuerpo de `POST /tracking/trackable-subjects/{id}/events` (UC-37-04). */
export class RecordEventDto {
  @ApiProperty({ enum: MILESTONE_STATUSES })
  @IsIn(MILESTONE_STATUSES)
  status!: MilestoneStatus;

  @ApiPropertyOptional({
    description:
      'Código del hito alcanzado; si se indica, mueve el hito actual',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  milestoneCode?: string;

  @ApiPropertyOptional({ enum: EVENT_SOURCES, default: 'OPERATOR' })
  @IsOptional()
  @IsIn(EVENT_SOURCES)
  source?: EventSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  @ApiPropertyOptional({ description: 'Latitud, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitud, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ping de localización que lo respalda',
  })
  @IsOptional()
  @IsUUID()
  locationPingId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class EventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  trackableSubjectId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  currentStatusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito alcanzado, si lo hubo',
  })
  currentMilestoneId?: string;

  @ApiProperty({
    description: 'true si el hito alcanzado cierra el seguimiento',
  })
  subjectClosed!: boolean;
}

// ---------------------------------------------------------------------------
// UC-37-05 · Webhook del transportista
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/webhooks/carriers/{carrierCode}` (UC-37-05). */
export class CarrierWebhookDto {
  @ApiProperty({
    description: 'Número de seguimiento que el transportista reporta',
  })
  @IsString()
  @MaxLength(200)
  trackingNumber!: string;

  @ApiProperty({
    description: 'Código de estado del transportista',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  externalStatusCode!: string;

  @ApiProperty({
    description:
      'Identificador del evento en el transportista; con él se deduplica',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalEventId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;
}

export class WebhookResponseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento registrado; ausente si era duplicado',
  })
  eventId?: string;

  @ApiProperty({ format: 'uuid' })
  trackableSubjectId!: string;

  @ApiProperty({ format: 'uuid' })
  currentStatusConceptId!: string;

  @ApiProperty({ description: 'true si el evento ya se había recibido' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-37-06 · Handoff
// ---------------------------------------------------------------------------

/** Naturaleza del traspaso. */
export type HandoffType = 'PICKUP' | 'TRANSFER' | 'DROPOFF';
const HANDOFF_TYPES = ['PICKUP', 'TRANSFER', 'DROPOFF'] as const;

/** Cuerpo de `POST /tracking/shipments/{id}/handoffs` (UC-37-06). */
export class RecordHandoffDto {
  @ApiProperty({ enum: HANDOFF_TYPES })
  @IsIn(HANDOFF_TYPES)
  handoffType!: HandoffType;

  @ApiPropertyOptional({ description: 'Tipo de quien entrega', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromPartyType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fromPartyId?: string;

  @ApiPropertyOptional({ description: 'Tipo de quien recibe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  toPartyType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  toPartyId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Transportista que pasa a ser responsable',
  })
  @IsOptional()
  @IsUUID()
  newCarrierId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mensajero que pasa a ser responsable',
  })
  @IsOptional()
  @IsUUID()
  newCourierUserId?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class HandoffResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({ format: 'uuid', description: 'Evento de traspaso registrado' })
  eventId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Transportista responsable tras el traspaso',
  })
  carrierId?: string;
}

// ---------------------------------------------------------------------------
// UC-37-07 · ETA
// ---------------------------------------------------------------------------

/** Cómo se calculó la estimación. */
export type EtaMethod = 'CARRIER' | 'DISTANCE' | 'MANUAL';
const ETA_METHODS = ['CARRIER', 'DISTANCE', 'MANUAL'] as const;

/** Cuerpo de `POST /tracking/shipments/{id}/eta/recompute` (UC-37-07). */
export class RecomputeEtaDto {
  @ApiProperty({ format: 'date-time', description: 'Llegada estimada' })
  @IsISO8601()
  estimatedArrivalAt!: string;

  @ApiProperty({ enum: ETA_METHODS })
  @IsIn(ETA_METHODS)
  method!: EtaMethod;

  @ApiPropertyOptional({
    description: 'Confianza de la estimación',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidencePct?: number;

  @ApiPropertyOptional({ description: 'Distancia restante en metros' })
  @IsOptional()
  @IsNumberString()
  distanceM?: string;
}

export class EtaResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Estimación registrada' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Llegada estimada del envío',
  })
  estimatedArrivalAt!: string;

  @ApiProperty({
    description: 'true si esta estimación pasó a ser la vigente del envío',
  })
  applied!: boolean;
}

// ---------------------------------------------------------------------------
// UC-37-08 · Prueba de entrega
// ---------------------------------------------------------------------------

/** Con qué se acredita la entrega. */
export type ProofType = 'SIGNATURE' | 'PHOTO';
const PROOF_TYPES = ['SIGNATURE', 'PHOTO'] as const;

/** Cuerpo de `POST /tracking/shipments/{id}/delivery-proof` (UC-37-08). */
export class RecordDeliveryProofDto {
  @ApiProperty({ enum: PROOF_TYPES })
  @IsIn(PROOF_TYPES)
  proofType!: ProofType;

  @ApiPropertyOptional({ description: 'Quién recibió', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recipientName?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Firma capturada; obligatoria si el tipo es SIGNATURE',
  })
  @IsOptional()
  @IsUUID()
  signatureFileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Foto de la entrega; obligatoria si el tipo es PHOTO',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;
}

export class DeliveryProofResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el envío',
  })
  shipmentStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  subjectStateConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Evento de entrega registrado' })
  eventId!: string;
}

// ---------------------------------------------------------------------------
// UC-37-09 · Excepción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/shipments/{id}/exception` (UC-37-09). */
export class RecordExceptionDto {
  @ApiProperty({ description: 'Qué pasó' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Se reprograma un nuevo intento de entrega',
  })
  @IsOptional()
  @IsBoolean()
  scheduleRetry?: boolean;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Foto del intento fallido; deja constancia del intento',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;
}

export class ExceptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Prioridad a la que sube el sujeto',
  })
  priorityConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Constancia del intento fallido',
  })
  failedAttemptProofId?: string;
}

// ---------------------------------------------------------------------------
// UC-37-10 · Cancelación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/shipments/{id}/cancel` (UC-37-10). */
export class CancelShipmentDto {
  @ApiProperty({ description: 'Por qué se cancela' })
  @IsString()
  reason!: string;
}

export class CancelShipmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  subjectStateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;
}

// ---------------------------------------------------------------------------
// UC-37-11 · Barrido de SLA
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/sla/scan` (UC-37-11). */
export class ScanSlaDto {
  @ApiPropertyOptional({
    description: 'Sujetos a revisar por barrido',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

export class ScanSlaResponseDto {
  @ApiProperty({ description: 'Sujetos abiertos revisados' })
  scanned!: number;

  @ApiProperty({
    description: 'Sujetos con incumplimiento de compromiso detectado',
  })
  breached!: number;

  @ApiProperty({
    description: 'Sujetos cuya prioridad subió por el incumplimiento',
  })
  escalated!: number;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Eventos de incumplimiento creados',
  })
  eventIds!: string[];
}
