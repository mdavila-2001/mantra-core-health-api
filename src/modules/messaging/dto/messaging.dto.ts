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
  /**
   * Identificador asociado a worker.
   */
  @ApiProperty({
    description: 'Identificador del worker que reclama el lote',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  /**
   * Valor de batch size mantenido por la instancia.
   */
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

  /**
   * Valor de visibility timeout seconds mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para relayed message.
 */
export class RelayedMessageDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a domain event.
   */
  @ApiProperty({ format: 'uuid' })
  domainEventId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty()
  idempotencyKey!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de attempts mantenido por la instancia.
   */
  @ApiProperty()
  attempts!: number;
}

/**
 * Define el contrato validado para outbox relay response.
 */
export class OutboxRelayResponseDto {
  /**
   * Valor de claimed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Mensajes reclamados en este lote' })
  claimed!: number;

  /**
   * Valor de published mantenido por la instancia.
   */
  @ApiProperty({ description: 'Mensajes que pasaron a publicados' })
  published!: number;

  /**
   * Valor de exhausted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Mensajes que agotaron sus intentos' })
  exhausted!: number;

  /**
   * Valor de messages mantenido por la instancia.
   */
  @ApiProperty({ type: [RelayedMessageDto] })
  messages!: RelayedMessageDto[];
}

// ---------------------------------------------------------------------------
// UC-35-03 · Despacho a suscriptores
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/events/{domainEventId}/dispatch` (UC-35-03). */
export class DispatchEventDto {
  /**
   * Valor de enqueue jobs mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Encolar además un job por suscripción en modo cola',
    default: true,
  })
  @IsOptional()
  enqueueJobs?: boolean;
}

/**
 * Define el contrato validado para dispatched subscriber.
 */
export class DispatchedSubscriberDto {
  /**
   * Identificador asociado a subscription.
   */
  @ApiProperty({ format: 'uuid' })
  subscriptionId!: string;

  /**
   * Valor de subscriber code mantenido por la instancia.
   */
  @ApiProperty()
  subscriberCode!: string;

  /**
   * Identificador asociado a delivery.
   */
  @ApiProperty({ format: 'uuid' })
  deliveryId!: string;

  /**
   * Identificador asociado a job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job encolado si el modo es cola',
  })
  jobId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la entrega ya existía y no se duplicó' })
  duplicate!: boolean;
}

/**
 * Define el contrato validado para dispatch event response.
 */
export class DispatchEventResponseDto {
  /**
   * Identificador asociado a domain event.
   */
  @ApiProperty({ format: 'uuid' })
  domainEventId!: string;

  /**
   * Valor de matched mantenido por la instancia.
   */
  @ApiProperty({ description: 'Suscripciones que casaron con el evento' })
  matched!: number;

  /**
   * Valor de filtered out mantenido por la instancia.
   */
  @ApiProperty({ description: 'Suscripciones descartadas por su filtro' })
  filteredOut!: number;

  /**
   * Valor de deliveries mantenido por la instancia.
   */
  @ApiProperty({ type: [DispatchedSubscriberDto] })
  deliveries!: DispatchedSubscriberDto[];
}

// ---------------------------------------------------------------------------
// UC-35-04 · Acuse de entrega
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/event-deliveries/{id}/ack` (UC-35-04). */
export class AckEventDeliveryDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ enum: EVENT_ACK_OUTCOMES })
  @IsIn(EVENT_ACK_OUTCOMES)
  outcome!: EventAckOutcome;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué falló; obligatorio si el desenlace es fallo',
  })
  @IsOptional()
  @IsString()
  errorText?: string;
}

/**
 * Define el contrato validado para event delivery response.
 */
export class EventDeliveryResponseDto {
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
   * Valor de handled at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  handledAt?: string;
}

// ---------------------------------------------------------------------------
// UC-35-05 · Encolar job
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /queues/{code}/jobs` (UC-35-05). */
export class EnqueueJobDto {
  /**
   * Valor de job type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de trabajo que el handler reconoce',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  jobType!: string;

  /**
   * Valor de dedupe key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de deduplicación; colapsa los encolados repetidos',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  dedupeKey!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Carga del trabajo' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Menor gana; por defecto, el de la cola',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  /**
   * Valor de max attempts mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Intentos máximos; por defecto, el de la cola',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  /**
   * Valor de available at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo queda disponible',
  })
  @IsOptional()
  @IsISO8601()
  availableAt?: string;
}

/**
 * Define el contrato validado para job response.
 */
export class JobResponseDto {
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
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a worker.
   */
  @ApiProperty({ description: 'Identificador del worker', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  /**
   * Valor de batch size mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para claimed job.
 */
export class ClaimedJobDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de job type mantenido por la instancia.
   */
  @ApiProperty()
  jobType!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Carga del trabajo' })
  payloadJson!: unknown;

  /**
   * Valor de attempts mantenido por la instancia.
   */
  @ApiProperty()
  attempts!: number;

  /**
   * Valor de lock expires at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo el job es de este worker',
  })
  lockExpiresAt!: string;
}

/**
 * Define el contrato validado para claim jobs response.
 */
export class ClaimJobsResponseDto {
  /**
   * Identificador asociado a queue.
   */
  @ApiProperty({ format: 'uuid' })
  queueId!: string;

  /**
   * Valor de jobs mantenido por la instancia.
   */
  @ApiProperty({ type: [ClaimedJobDto] })
  jobs!: ClaimedJobDto[];

  /**
   * Valor de claimed mantenido por la instancia.
   */
  @ApiProperty()
  claimed!: number;
}

// ---------------------------------------------------------------------------
// UC-35-07 / UC-35-08 · Completar y fallar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/jobs/{id}/complete` (UC-35-07). */
export class CompleteJobDto {
  /**
   * Identificador asociado a worker.
   */
  @ApiProperty({ description: 'Worker que lo tiene reservado', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  /**
   * Valor de result json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Resultado del handler' })
  @IsOptional()
  @IsObject()
  resultJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /internal/jobs/{id}/fail` (UC-35-08). */
export class FailJobDto {
  /**
   * Identificador asociado a worker.
   */
  @ApiProperty({ description: 'Worker que lo tiene reservado', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  workerId!: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué falló' })
  @IsString()
  errorText!: string;
}

/**
 * Define el contrato validado para fail job response.
 */
export class FailJobResponseDto {
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
   * Valor de attempts mantenido por la instancia.
   */
  @ApiProperty()
  attempts!: number;

  /**
   * Valor de available at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se reintenta; ausente si agotó los intentos',
  })
  availableAt?: string;

  /**
   * Identificador asociado a dead letter job.
   */
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
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se reencola: qué se corrigió' })
  @IsString()
  reason!: string;

  /**
   * Valor de dedupe key mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para redrive response.
 */
export class RedriveResponseDto {
  /**
   * Identificador asociado a job.
   */
  @ApiProperty({ format: 'uuid', description: 'Job nuevo encolado' })
  jobId!: string;

  /**
   * Identificador asociado a dead letter job.
   */
  @ApiProperty({ format: 'uuid' })
  deadLetterJobId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ese DLQ ya se había reencolado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-10 · Solicitud de notificación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /notifications/requests` (UC-35-10). */
export class CreateNotificationRequestDto {
  /**
   * Identificador asociado a channel.
   */
  @ApiProperty({ format: 'uuid', description: 'Canal por el que se notifica' })
  @IsUUID()
  channelId!: string;

  /**
   * Identificador asociado a recipient user.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Destinatario interno' })
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  /**
   * Valor de recipient address mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Dirección de destino si el canal es externo',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  recipientAddress?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a template.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla publicada a usar',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  /**
   * Identificador asociado a domain event.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento de dominio que la origina',
  })
  @IsOptional()
  @IsUUID()
  domainEventId?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Variables de la plantilla. PHI mínima.',
  })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;

  /**
   * Valor de debounce key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clave de rebote; colapsa notificaciones repetidas',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  debounceKey?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Menor gana', default: 5, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Categoría (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a consent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento vigente que la autoriza',
  })
  @IsOptional()
  @IsUUID()
  consentId?: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo debe salir',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  /**
   * Valor de related resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  /**
   * Identificador asociado a related resource.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;
}

/**
 * Define el contrato validado para notification request response.
 */
export class NotificationRequestResponseDto {
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
   * Valor de suppressed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si quedó suprimida por consentimiento o preferencia',
  })
  suppressed!: boolean;

  /**
   * Valor de suppression reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué se suprimió' })
  suppressionReason?: string;

  /**
   * Valor de debounced mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si otra solicitud viva tenía la misma clave de rebote',
  })
  debounced!: boolean;
}

/**
 * Fila de `GET /internal/notifications/pending`: lo mínimo que el worker
 * necesita para decidir a qué proveedor llamar y con qué intentar el envío.
 */
export class PendingNotificationRequestDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a channel.
   */
  @ApiProperty({ format: 'uuid' })
  channelId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Carga de la solicitud' })
  payloadJson?: unknown;

  /**
   * Valor de recipient address mantenido por la instancia.
   */
  @ApiPropertyOptional()
  recipientAddress?: string;

  /**
   * Identificador asociado a recipient user.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  recipientUserId?: string;
  /**
   * Tipo del canal (correo, in-app…).
   *
   * Viaja con el lote porque el worker necesita saber si hay un tercero al que
   * llamar **antes** de llamarlo: una notificación in-app no sale a ningún
   * proveedor, y sin este dato el adaptador por defecto la marcaba `FAILED`
   * con `PROVIDER_NOT_CONFIGURED` — un fallo inventado por preguntarle a un
   * proveedor que para ese canal no tiene que existir.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  channelTypeConceptId?: string;
}

/** Respuesta de `GET /internal/notifications/pending`. */
export class PendingNotificationsResponseDto {
  /**
   * Valor de requests mantenido por la instancia.
   */
  @ApiProperty({ type: [PendingNotificationRequestDto] })
  requests!: PendingNotificationRequestDto[];
}

// ---------------------------------------------------------------------------
// UC-35-11 · Entrega multicanal
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /internal/notifications/{requestId}/deliver` (UC-35-11). */
export class DeliverNotificationDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    enum: DELIVERY_ATTEMPT_OUTCOMES,
    description: 'Qué respondió el proveedor',
  })
  @IsIn(DELIVERY_ATTEMPT_OUTCOMES)
  outcome!: DeliveryAttemptOutcome;

  /**
   * Identificador asociado a provider channel config.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Configuración de proveedor usada',
  })
  @IsOptional()
  @IsUUID()
  providerChannelConfigId?: string;

  /**
   * Valor de provider message ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia del mensaje en el proveedor',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  providerMessageRef?: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorText?: string;

  /**
   * Valor de cost amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Coste del envío, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  costAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de subject mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Asunto del mensaje in-app',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cuerpo del mensaje in-app' })
  @IsOptional()
  @IsString()
  bodyText?: string;
}

/**
 * Define el contrato validado para deliver notification response.
 */
export class DeliverNotificationResponseDto {
  /**
   * Identificador asociado a delivery.
   */
  @ApiProperty({ format: 'uuid', description: 'Intento registrado' })
  deliveryId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty()
  attemptNumber!: number;

  /**
   * Identificador asociado a delivery status concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado del intento' })
  deliveryStatusConceptId!: string;

  /**
   * Identificador asociado a request status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la solicitud',
  })
  requestStatusConceptId!: string;

  /**
   * Identificador asociado a in app notification.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Notificación in-app creada',
  })
  inAppNotificationId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ese intento ya estaba registrado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-12 · Acuse del proveedor
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /webhooks/providers/{providerCode}/receipts` (UC-35-12). */
export class ProviderReceiptDto {
  /**
   * Valor de provider message ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia del mensaje en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerMessageRef!: string;

  /**
   * Valor de receipt type mantenido por la instancia.
   */
  @ApiProperty({ enum: RECEIPT_TYPES })
  @IsIn(RECEIPT_TYPES)
  receiptType!: ReceiptType;

  /**
   * Valor de provider status mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Estado tal como lo nombra el proveedor',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerStatus?: string;

  /**
   * Valor de raw payload json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cuerpo original del webhook' })
  @IsOptional()
  @IsObject()
  rawPayloadJson?: Record<string, unknown>;

  /**
   * Valor de signature mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Firma HMAC-SHA256 (hex) del cuerpo original bajo el secreto del proveedor',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  signature?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió según el proveedor',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Define el contrato validado para provider receipt response.
 */
export class ProviderReceiptResponseDto {
  /**
   * Identificador asociado a receipt.
   */
  @ApiProperty({ format: 'uuid' })
  receiptId!: string;

  /**
   * Identificador asociado a delivery.
   */
  @ApiProperty({ format: 'uuid' })
  deliveryId!: string;

  /**
   * Identificador asociado a delivery status concept.
   */
  @ApiProperty({ format: 'uuid' })
  deliveryStatusConceptId!: string;

  /**
   * Identificador asociado a request status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la solicitud',
  })
  requestStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el mismo acuse ya se había procesado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-35-13 · Marcar in-app como leída
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para in app read response.
 */
export class InAppReadResponseDto {
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
   * Valor de read at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Se conserva la primera lectura',
  })
  readAt!: string;

  /**
   * Valor de already read mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ya estaba leída' })
  alreadyRead!: boolean;
}
