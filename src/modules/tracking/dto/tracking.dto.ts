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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({ enum: SUBJECT_TYPES })
  @IsIn(SUBJECT_TYPES)
  subjectType!: SubjectType;

  /**
   * Valor de subject ref type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de la entidad rastreada', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  subjectRefType!: string;

  /**
   * Identificador asociado a subject ref.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad rastreada' })
  @IsUUID()
  subjectRefId!: string;

  /**
   * Identificador asociado a carrier.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Transportista asignado',
  })
  @IsOptional()
  @IsUUID()
  carrierId?: string;

  /**
   * Identificador asociado a origin address.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originAddressId?: string;

  /**
   * Identificador asociado a destination address.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationAddressId?: string;

  /**
   * Identificador asociado a assigned courier user.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Mensajero asignado' })
  @IsOptional()
  @IsUUID()
  assignedCourierUserId?: string;

  /**
   * Valor de temperature controlled mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'El envío exige cadena de frío',
  })
  @IsOptional()
  @IsBoolean()
  temperatureControlled?: boolean;
}

/**
 * Define el contrato validado para subject response.
 */
export class SubjectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de tracking number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de seguimiento, opaco y único' })
  trackingNumber!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Identificador asociado a current status concept.
   */
  @ApiProperty({ format: 'uuid' })
  currentStatusConceptId!: string;

  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Valor de shipment number mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para milestone definition.
 */
export class MilestoneDefinitionDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del hito, único por tipo de sujeto',
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
   * Valor de milestone status mantenido por la instancia.
   */
  @ApiProperty({ enum: MILESTONE_STATUSES })
  @IsIn(MILESTONE_STATUSES)
  milestoneStatus!: MilestoneStatus;

  /**
   * Valor de is terminal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Alcanzarlo cierra el seguimiento del sujeto',
  })
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  /**
   * Valor de sla minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Minutos de compromiso para alcanzarlo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaMinutes?: number;
}

/** Cuerpo de `POST /tracking/milestone-definitions` (UC-37-02). */
export class DefineMilestonesDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({ enum: SUBJECT_TYPES })
  @IsIn(SUBJECT_TYPES)
  subjectType!: SubjectType;

  /**
   * Valor de milestones mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para milestones response.
 */
export class MilestonesResponseDto {
  /**
   * Identificador asociado a subject type concept.
   */
  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  /**
   * Valor de milestone ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Hitos creados, en orden',
  })
  milestoneIds!: string[];

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hitos omitidos por tener ya ese código' })
  skipped!: number;

  /**
   * Valor de terminal count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hitos terminales declarados' })
  terminalCount!: number;
}

// ---------------------------------------------------------------------------
// UC-37-03 · Despacho
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/shipments/{id}/dispatch` (UC-37-03). */
export class DispatchShipmentDto {
  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dónde se despachó', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  /**
   * Identificador asociado a assigned courier user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mensajero que se hace cargo',
  })
  @IsOptional()
  @IsUUID()
  assignedCourierUserId?: string;
}

/**
 * Define el contrato validado para dispatch response.
 */
export class DispatchResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({ format: 'uuid', description: 'Evento de despacho registrado' })
  eventId!: string;

  /**
   * Valor de dispatched at mantenido por la instancia.
   */
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
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: MILESTONE_STATUSES })
  @IsIn(MILESTONE_STATUSES)
  status!: MilestoneStatus;

  /**
   * Valor de milestone code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Código del hito alcanzado; si se indica, mueve el hito actual',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  milestoneCode?: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: EVENT_SOURCES, default: 'OPERATOR' })
  @IsOptional()
  @IsIn(EVENT_SOURCES)
  source?: EventSource;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Latitud, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Longitud, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  /**
   * Identificador asociado a location ping.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ping de localización que lo respalda',
  })
  @IsOptional()
  @IsUUID()
  locationPingId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Define el contrato validado para event response.
 */
export class EventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a trackable subject.
   */
  @ApiProperty({ format: 'uuid' })
  trackableSubjectId!: string;

  /**
   * Identificador asociado a current status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  currentStatusConceptId!: string;

  /**
   * Identificador asociado a current milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito alcanzado, si lo hubo',
  })
  currentMilestoneId?: string;

  /**
   * Valor de subject closed mantenido por la instancia.
   */
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
  /**
   * Valor de tracking number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de seguimiento que el transportista reporta',
  })
  @IsString()
  @MaxLength(200)
  trackingNumber!: string;

  /**
   * Valor de external status code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de estado del transportista',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  externalStatusCode!: string;

  /**
   * Identificador asociado a external event.
   */
  @ApiProperty({
    description:
      'Identificador del evento en el transportista; con él se deduplica',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalEventId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;
}

/**
 * Define el contrato validado para webhook response.
 */
export class WebhookResponseDto {
  /**
   * Identificador asociado a event.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento registrado; ausente si era duplicado',
  })
  eventId?: string;

  /**
   * Identificador asociado a trackable subject.
   */
  @ApiProperty({ format: 'uuid' })
  trackableSubjectId!: string;

  /**
   * Identificador asociado a current status concept.
   */
  @ApiProperty({ format: 'uuid' })
  currentStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Valor de handoff type mantenido por la instancia.
   */
  @ApiProperty({ enum: HANDOFF_TYPES })
  @IsIn(HANDOFF_TYPES)
  handoffType!: HandoffType;

  /**
   * Valor de from party type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de quien entrega', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromPartyType?: string;

  /**
   * Identificador asociado a from party.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fromPartyId?: string;

  /**
   * Valor de to party type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de quien recibe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  toPartyType?: string;

  /**
   * Identificador asociado a to party.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  toPartyId?: string;

  /**
   * Identificador asociado a new carrier.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Transportista que pasa a ser responsable',
  })
  @IsOptional()
  @IsUUID()
  newCarrierId?: string;

  /**
   * Identificador asociado a new courier user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mensajero que pasa a ser responsable',
  })
  @IsOptional()
  @IsUUID()
  newCourierUserId?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Define el contrato validado para handoff response.
 */
export class HandoffResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({ format: 'uuid', description: 'Evento de traspaso registrado' })
  eventId!: string;

  /**
   * Identificador asociado a carrier.
   */
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
  /**
   * Valor de estimated arrival at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Llegada estimada' })
  @IsISO8601()
  estimatedArrivalAt!: string;

  /**
   * Valor de method mantenido por la instancia.
   */
  @ApiProperty({ enum: ETA_METHODS })
  @IsIn(ETA_METHODS)
  method!: EtaMethod;

  /**
   * Valor de confidence pct mantenido por la instancia.
   */
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

  /**
   * Valor de distance m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Distancia restante en metros' })
  @IsOptional()
  @IsNumberString()
  distanceM?: string;
}

/**
 * Define el contrato validado para eta response.
 */
export class EtaResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Estimación registrada' })
  id!: string;

  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Valor de estimated arrival at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Llegada estimada del envío',
  })
  estimatedArrivalAt!: string;

  /**
   * Valor de applied mantenido por la instancia.
   */
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
  /**
   * Valor de proof type mantenido por la instancia.
   */
  @ApiProperty({ enum: PROOF_TYPES })
  @IsIn(PROOF_TYPES)
  proofType!: ProofType;

  /**
   * Valor de recipient name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Quién recibió', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recipientName?: string;

  /**
   * Identificador asociado a signature file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Firma capturada; obligatoria si el tipo es SIGNATURE',
  })
  @IsOptional()
  @IsUUID()
  signatureFileId?: string;

  /**
   * Identificador asociado a photo file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Foto de la entrega; obligatoria si el tipo es PHOTO',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;
}

/**
 * Define el contrato validado para delivery proof response.
 */
export class DeliveryProofResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Identificador asociado a shipment status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el envío',
  })
  shipmentStatusConceptId!: string;

  /**
   * Identificador asociado a subject state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  subjectStateConceptId!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({ format: 'uuid', description: 'Evento de entrega registrado' })
  eventId!: string;
}

// ---------------------------------------------------------------------------
// UC-37-09 · Excepción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/shipments/{id}/exception` (UC-37-09). */
export class RecordExceptionDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué pasó' })
  @IsString()
  reason!: string;

  /**
   * Valor de schedule retry mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Se reprograma un nuevo intento de entrega',
  })
  @IsOptional()
  @IsBoolean()
  scheduleRetry?: boolean;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationText?: string;

  /**
   * Identificador asociado a photo file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Foto del intento fallido; deja constancia del intento',
  })
  @IsOptional()
  @IsUUID()
  photoFileId?: string;
}

/**
 * Define el contrato validado para exception response.
 */
export class ExceptionResponseDto {
  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a priority concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Prioridad a la que sube el sujeto',
  })
  priorityConceptId!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  /**
   * Identificador asociado a failed attempt proof.
   */
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
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se cancela' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para cancel shipment response.
 */
export class CancelShipmentResponseDto {
  /**
   * Identificador asociado a shipment.
   */
  @ApiProperty({ format: 'uuid' })
  shipmentId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a subject state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el sujeto',
  })
  subjectStateConceptId!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({ format: 'uuid' })
  eventId!: string;
}

// ---------------------------------------------------------------------------
// UC-37-11 · Barrido de SLA
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /tracking/sla/scan` (UC-37-11). */
export class ScanSlaDto {
  /**
   * Valor de batch size mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para scan sla response.
 */
export class ScanSlaResponseDto {
  /**
   * Valor de scanned mantenido por la instancia.
   */
  @ApiProperty({ description: 'Sujetos abiertos revisados' })
  scanned!: number;

  /**
   * Valor de breached mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sujetos con incumplimiento de compromiso detectado',
  })
  breached!: number;

  /**
   * Valor de escalated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sujetos cuya prioridad subió por el incumplimiento',
  })
  escalated!: number;

  /**
   * Valor de event ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Eventos de incumplimiento creados',
  })
  eventIds!: string[];
}
