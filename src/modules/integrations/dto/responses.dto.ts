import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta tras registrar un proveedor (UC-12-01). */
export class ProviderResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) state!: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Respuesta tras aprovisionar una conexión y su credencial (UC-12-02). */
export class ConnectionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) state!: string;
  @ApiProperty({ format: 'uuid' }) credentialId!: string;
}

/** Respuesta tras rotar una credencial (UC-12-03). */
export class CredentialRotationResponseDto {
  @ApiProperty({ format: 'uuid' }) connectionId!: string;
  @ApiProperty({ format: 'uuid' }) credentialId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) rotatedAt!: Date;
}

/** Respuesta tras publicar un endpoint versionado (UC-12-04). */
export class EndpointResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) state!: string;
  @ApiProperty({ description: 'Nº de mapeos de campos creados' }) mappingsCount!: number;
}

/** Respuesta tras encolar un mensaje saliente (UC-12-05). */
export class OutboundMessageResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) status!: string;
  @ApiProperty() correlationId!: string;
  @ApiProperty({ description: 'true si se devolvió una fila preexistente por idempotencia' })
  idempotent!: boolean;
}

/** Respuesta tras despachar un mensaje (UC-12-06). */
export class DispatchResultDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Concept id del estado resultante', format: 'uuid' }) status!: string;
  @ApiProperty() isSuccess!: boolean;
  @ApiProperty({ format: 'uuid' }) responseId!: string;
}

/** Respuesta tras programar un reintento (UC-12-07). */
export class RetryResultDto {
  @ApiProperty({ format: 'uuid' }) messageId!: string;
  @ApiProperty() attemptNumber!: number;
  @ApiProperty({ description: 'Concept id del estado resultante del mensaje', format: 'uuid' }) status!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) nextRetryAt?: Date;
}

/** Respuesta tras enviar a dead-letter (UC-12-08). */
export class DeadLetterResultDto {
  @ApiProperty({ format: 'uuid' }) messageId!: string;
  @ApiProperty({ description: 'Concept id del estado resultante', format: 'uuid' }) status!: string;
  @ApiProperty({ description: 'true si ya estaba en dead-letter (no-op idempotente)' }) alreadyDeadLettered!: boolean;
}

/** Respuesta tras recibir un webhook entrante (UC-12-09). */
export class InboundMessageResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) status!: string;
  @ApiProperty({ description: 'true si se de-duplicó una reentrega' }) duplicate!: boolean;
}

/** Respuesta tras correlacionar un callback (UC-12-10). */
export class CorrelateResultDto {
  @ApiProperty({ format: 'uuid' }) inboundMessageId!: string;
  @ApiProperty({ format: 'uuid' }) outboundMessageId!: string;
  @ApiProperty({ description: 'Concept id del estado del mensaje entrante', format: 'uuid' }) status!: string;
}

/** Respuesta tras crear/actualizar una suscripción de webhook (UC-12-11). */
export class WebhookSubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  @ApiProperty() eventType!: string;
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' }) state!: string;
  @ApiProperty({ description: 'true si se actualizó una suscripción existente' }) updated!: boolean;
}

/** Respuesta tras pausar una conexión (UC-12-12). */
export class PauseConnectionResultDto {
  @ApiProperty({ format: 'uuid' }) connectionId!: string;
  @ApiProperty({ description: 'Concept id del estado resultante', format: 'uuid' }) state!: string;
  @ApiProperty({ description: 'Nº de mensajes QUEUED retenidos (HELD)' }) heldMessages!: number;
}
