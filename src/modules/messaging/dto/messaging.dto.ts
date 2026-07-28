import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Desenlace que reporta el consumidor de un evento. */
export type EventAckOutcome = 'HANDLED' | 'FAILED';
const EVENT_ACK_OUTCOMES = ['HANDLED', 'FAILED'] as const;

/** Desenlace que reporta el proveedor en su acuse. */
export type ReceiptType = 'DELIVERED' | 'BOUNCED' | 'READ';
const RECEIPT_TYPES = ['DELIVERED', 'BOUNCED', 'READ'] as const;

/** Desenlace del intento de entrega ante el proveedor. */
export type DeliveryAttemptOutcome = 'SENT' | 'FAILED';
const DELIVERY_ATTEMPT_OUTCOMES = ['SENT', 'FAILED'] as const;

// ---------------------------------------------------------------------------
// UC-35-02 · Relay del outbox
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/outbox/relay/run` (UC-35-02). */
export class RunOutboxRelayDto {
  @ApiProperty({
    description: 'Identificador del worker que reclama el lote',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  @ApiPropertyOptional({
    description: 'Tamaño del lote',
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;

  @ApiPropertyOptional({
    description: 'Segundos que el lote queda reservado para este worker',
    default: 60,
    minimum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  visibilityTimeoutSeconds?: number;
}

export class RelayedMessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  domainEventId!: string;

  @ApiProperty()
  idempotencyKey!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  attempts!: number;
}

export class OutboxRelayResponseDto {
  @ApiProperty({ description: 'Mensajes reclamados en este lote' })
  claimed!: number;

  @ApiProperty({ description: 'Mensajes que pasaron a publicados' })
  published!: number;

  @ApiProperty({ description: 'Mensajes que agotaron sus intentos' })
  exhausted!: number;

  @ApiProperty({ type: [RelayedMessageDto] })
  messages!: RelayedMessageDto[];
}

// ---------------------------------------------------------------------------
// UC-35-03 · Despacho a suscriptores
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/events/{domainEventId}/dispatch` (UC-35-03). */
export class DispatchEventDto {
  @ApiPropertyOptional({
    description: 'Encolar además un job por suscripción en modo cola',
    default: true,
  })
  @IsOptional()
  enqueueJobs?: boolean;
}

export class DispatchedSubscriberDto {
  @ApiProperty({ format: 'uuid' })
  subscriptionId!: string;

  @ApiProperty()
  subscriberCode!: string;

  @ApiProperty({ format: 'uuid' })
  deliveryId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job encolado si el modo es cola',
  })
  jobId?: string;

  @ApiProperty({ description: 'true si la entrega ya existía y no se duplicó' })
  duplicate!: boolean;
}

export class DispatchEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  domainEventId!: string;

  @ApiProperty({ description: 'Suscripciones que casaron con el evento' })
  matched!: number;

  @ApiProperty({ description: 'Suscripciones descartadas por su filtro' })
  filteredOut!: number;

  @ApiProperty({ type: [DispatchedSubscriberDto] })
  deliveries!: DispatchedSubscriberDto[];
}

// ---------------------------------------------------------------------------
// UC-35-04 · Acuse de entrega
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/event-deliveries/{id}/ack` (UC-35-04). */
export class AckEventDeliveryDto {
  @ApiProperty({ enum: EVENT_ACK_OUTCOMES })
  @IsIn(EVENT_ACK_OUTCOMES)
  outcome!: EventAckOutcome;

  @ApiPropertyOptional({
    description: 'Qué falló; obligatorio si el desenlace es fallo',
  })
  @IsOptional()
  @IsString()
  errorText?: string;
}

export class EventDeliveryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  handledAt?: string;
}

// ---------------------------------------------------------------------------
// UC-35-05 · Encolar job
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /queues/{code}/jobs` (UC-35-05). */
export class EnqueueJobDto {
  @ApiProperty({
    description: 'Tipo de trabajo que el handler reconoce',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  jobType!: string;

  @ApiProperty({
    description: 'Clave de deduplicación; colapsa los encolados repetidos',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  dedupeKey!: string;

  @ApiProperty({ description: 'Carga del trabajo' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Menor gana; por defecto, el de la cola',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Intentos máximos; por defecto, el de la cola',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo queda disponible',
  })
  @IsOptional()
  @IsISO8601()
  availableAt?: string;
}

export class JobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'true si ya había un job con esa clave y se devuelve el mismo',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-06 · Reclamar jobs
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/queues/{code}/claim` (UC-35-06). */
export class ClaimJobsDto {
  @ApiProperty({ description: 'Identificador del worker', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  @ApiPropertyOptional({
    description: 'Cuántos jobs reclamar',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;
}

export class ClaimedJobDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  jobType!: string;

  @ApiProperty({ description: 'Carga del trabajo' })
  payloadJson!: unknown;

  @ApiProperty()
  attempts!: number;

  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo el job es de este worker',
  })
  lockExpiresAt!: string;
}

export class ClaimJobsResponseDto {
  @ApiProperty({ format: 'uuid' })
  queueId!: string;

  @ApiProperty({ type: [ClaimedJobDto] })
  jobs!: ClaimedJobDto[];

  @ApiProperty()
  claimed!: number;
}

// ---------------------------------------------------------------------------
// UC-35-07 / UC-35-08 · Completar y fallar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/jobs/{id}/complete` (UC-35-07). */
export class CompleteJobDto {
  @ApiProperty({ description: 'Worker que lo tiene reservado', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  @ApiPropertyOptional({ description: 'Resultado del handler' })
  @IsOptional()
  @IsObject()
  resultJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /internal/jobs/{id}/fail` (UC-35-08). */
export class FailJobDto {
  @ApiProperty({ description: 'Worker que lo tiene reservado', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  @ApiProperty({ description: 'Qué falló' })
  @IsString()
  errorText!: string;
}

export class FailJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  attempts!: number;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se reintenta; ausente si agotó los intentos',
  })
  availableAt?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada de cola muerta si agotó',
  })
  deadLetterJobId?: string;
}

// ---------------------------------------------------------------------------
// UC-35-09 · Redrive
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /queues/dead-letter/{deadLetterJobId}/redrive` (UC-35-09). */
export class RedriveDeadLetterDto {
  @ApiProperty({ description: 'Por qué se reencola: qué se corrigió' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    description:
      'Clave de deduplicación del job nuevo; por defecto se deriva del original',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  dedupeKey?: string;
}

export class RedriveResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Job nuevo encolado' })
  jobId!: string;

  @ApiProperty({ format: 'uuid' })
  deadLetterJobId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'true si ese DLQ ya se había reencolado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-10 · Solicitud de notificación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /notifications/requests` (UC-35-10). */
export class CreateNotificationRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Canal por el que se notifica' })
  @IsUUID()
  channelId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Destinatario interno' })
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @ApiPropertyOptional({
    description: 'Dirección de destino si el canal es externo',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  recipientAddress?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla publicada a usar',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento de dominio que la origina',
  })
  @IsOptional()
  @IsUUID()
  domainEventId?: string;

  @ApiPropertyOptional({
    description: 'Variables de la plantilla. PHI mínima.',
  })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Clave de rebote; colapsa notificaciones repetidas',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  debounceKey?: string;

  @ApiPropertyOptional({ description: 'Menor gana', default: 5, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Categoría (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento vigente que la autoriza',
  })
  @IsOptional()
  @IsUUID()
  consentId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo debe salir',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;
}

export class NotificationRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'true si quedó suprimida por consentimiento o preferencia',
  })
  suppressed!: boolean;

  @ApiPropertyOptional({ description: 'Por qué se suprimió' })
  suppressionReason?: string;

  @ApiProperty({
    description: 'true si otra solicitud viva tenía la misma clave de rebote',
  })
  debounced!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-11 · Entrega multicanal
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/notifications/{requestId}/deliver` (UC-35-11). */
export class DeliverNotificationDto {
  @ApiProperty({
    enum: DELIVERY_ATTEMPT_OUTCOMES,
    description: 'Qué respondió el proveedor',
  })
  @IsIn(DELIVERY_ATTEMPT_OUTCOMES)
  outcome!: DeliveryAttemptOutcome;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Configuración de proveedor usada',
  })
  @IsOptional()
  @IsUUID()
  providerChannelConfigId?: string;

  @ApiPropertyOptional({
    description: 'Referencia del mensaje en el proveedor',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  providerMessageRef?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorText?: string;

  @ApiPropertyOptional({ description: 'Coste del envío, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  costAmount?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Asunto del mensaje in-app',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional({ description: 'Cuerpo del mensaje in-app' })
  @IsOptional()
  @IsString()
  bodyText?: string;
}

export class DeliverNotificationResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Intento registrado' })
  deliveryId!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty({ format: 'uuid', description: 'Estado del intento' })
  deliveryStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la solicitud',
  })
  requestStatusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Notificación in-app creada',
  })
  inAppNotificationId?: string;

  @ApiProperty({ description: 'true si ese intento ya estaba registrado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-12 · Acuse del proveedor
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /webhooks/providers/{providerCode}/receipts` (UC-35-12). */
export class ProviderReceiptDto {
  @ApiProperty({
    description: 'Referencia del mensaje en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerMessageRef!: string;

  @ApiProperty({ enum: RECEIPT_TYPES })
  @IsIn(RECEIPT_TYPES)
  receiptType!: ReceiptType;

  @ApiPropertyOptional({
    description: 'Estado tal como lo nombra el proveedor',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerStatus?: string;

  @ApiPropertyOptional({ description: 'Cuerpo original del webhook' })
  @IsOptional()
  @IsObject()
  rawPayloadJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Firma HMAC-SHA256 (hex) del cuerpo original bajo el secreto del proveedor',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  signature?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió según el proveedor',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class ProviderReceiptResponseDto {
  @ApiProperty({ format: 'uuid' })
  receiptId!: string;

  @ApiProperty({ format: 'uuid' })
  deliveryId!: string;

  @ApiProperty({ format: 'uuid' })
  deliveryStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la solicitud',
  })
  requestStatusConceptId!: string;

  @ApiProperty({ description: 'true si el mismo acuse ya se había procesado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-13 · Marcar in-app como leída
// ---------------------------------------------------------------------------

export class InAppReadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Se conserva la primera lectura',
  })
  readAt!: string;

  @ApiProperty({ description: 'true si ya estaba leída' })
  alreadyRead!: boolean;
}
