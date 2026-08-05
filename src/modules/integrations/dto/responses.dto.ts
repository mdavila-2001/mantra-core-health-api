import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta tras registrar un proveedor (UC-12-01). */
export class ProviderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty() name!: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Respuesta tras aprovisionar una conexión y su credencial (UC-12-02). */
export class ConnectionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' }) tenantId!: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;
  /**
   * Identificador asociado a credential.
   */
  @ApiProperty({ format: 'uuid' }) credentialId!: string;
}

/** Respuesta tras rotar una credencial (UC-12-03). */
export class CredentialRotationResponseDto {
  /**
   * Identificador asociado a connection.
   */
  @ApiProperty({ format: 'uuid' }) connectionId!: string;
  /**
   * Identificador asociado a credential.
   */
  @ApiProperty({ format: 'uuid' }) credentialId!: string;
  /**
   * Valor de rotated at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' }) rotatedAt!: Date;
}

/** Respuesta tras publicar un endpoint versionado (UC-12-04). */
export class EndpointResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty() version!: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;
  /**
   * Valor de mappings count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de mapeos de campos creados' })
  mappingsCount!: number;
}

/** Respuesta tras encolar un mensaje saliente (UC-12-05). */
export class OutboundMessageResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;
  /**
   * Identificador asociado a correlation.
   */
  @ApiProperty() correlationId!: string;
  /**
   * Valor de idempotent mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si se devolvió una fila preexistente por idempotencia',
  })
  idempotent!: boolean;
}

/** Respuesta tras despachar un mensaje (UC-12-06). */
export class DispatchResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado resultante',
    format: 'uuid',
  })
  status!: string;
  /**
   * Valor de is success mantenido por la instancia.
   */
  @ApiProperty() isSuccess!: boolean;
  /**
   * Identificador asociado a response.
   */
  @ApiProperty({ format: 'uuid' }) responseId!: string;
}

/** Respuesta tras programar un reintento (UC-12-07). */
export class RetryResultDto {
  /**
   * Identificador asociado a message.
   */
  @ApiProperty({ format: 'uuid' }) messageId!: string;
  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty() attemptNumber!: number;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado resultante del mensaje',
    format: 'uuid',
  })
  status!: string;
  /**
   * Valor de next retry at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  nextRetryAt?: Date;
}

/** Respuesta tras enviar a dead-letter (UC-12-08). */
export class DeadLetterResultDto {
  /**
   * Identificador asociado a message.
   */
  @ApiProperty({ format: 'uuid' }) messageId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado resultante',
    format: 'uuid',
  })
  status!: string;
  /**
   * Valor de already dead lettered mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si ya estaba en dead-letter (no-op idempotente)',
  })
  alreadyDeadLettered!: boolean;
}

/** Respuesta tras recibir un webhook entrante (UC-12-09). */
export class InboundMessageResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  status!: string;
  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se de-duplicó una reentrega' })
  duplicate!: boolean;
}

/** Respuesta tras correlacionar un callback (UC-12-10). */
export class CorrelateResultDto {
  /**
   * Identificador asociado a inbound message.
   */
  @ApiProperty({ format: 'uuid' }) inboundMessageId!: string;
  /**
   * Identificador asociado a outbound message.
   */
  @ApiProperty({ format: 'uuid' }) outboundMessageId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del mensaje entrante',
    format: 'uuid',
  })
  status!: string;
}

/** Respuesta tras crear/actualizar una suscripción de webhook (UC-12-11). */
export class WebhookSubscriptionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a provider.
   */
  @ApiProperty({ format: 'uuid' }) providerId!: string;
  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty() eventType!: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado', format: 'uuid' })
  state!: string;
  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si se actualizó una suscripción existente',
  })
  updated!: boolean;
}

/** Un mensaje saliente `QUEUED` listo para despachar. */
export class PendingDispatchItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
}

/**
 * Descubrimiento para el worker de despacho (Fase 5 del plan de corrección
 * de workers, UC-12-06): sin esto, el worker no tenía forma de saber qué
 * `messageId` despachar.
 */
export class PendingDispatchResponseDto {
  /**
   * Valor de messages mantenido por la instancia.
   */
  @ApiProperty({ type: [PendingDispatchItemDto] })
  messages!: PendingDispatchItemDto[];
}

/** Un mensaje saliente `FAILED`, anotado con si ya agotó sus reintentos. */
export class PendingRetryItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de next attempt number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número que tendría el próximo intento' })
  nextAttemptNumber!: number;
  /**
   * Valor de exhausted mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si el próximo intento excede MAX_ATTEMPTS: el worker debe ' +
      'enviarlo a dead-letter en vez de reintentar',
  })
  exhausted!: boolean;
}

/**
 * Descubrimiento para el worker de reintentos (Fase 5, UC-12-07/08): calcula
 * server-side si el mensaje ya agotó sus reintentos para que el worker no
 * tenga que adivinar `MAX_ATTEMPTS` a partir del cuerpo de un error 422.
 */
export class PendingRetryResponseDto {
  /**
   * Valor de messages mantenido por la instancia.
   */
  @ApiProperty({ type: [PendingRetryItemDto] })
  messages!: PendingRetryItemDto[];
}

/** Un mensaje entrante `RECEIVED` listo para correlacionarse. */
export class PendingCorrelationItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
}

/**
 * Descubrimiento para el worker de correlación (Fase 5, UC-12-10): sin esto,
 * el worker no tenía forma de saber qué `inboundMessageId` correlacionar.
 */
export class PendingCorrelationResponseDto {
  /**
   * Valor de messages mantenido por la instancia.
   */
  @ApiProperty({ type: [PendingCorrelationItemDto] })
  messages!: PendingCorrelationItemDto[];
}

/** Respuesta tras pausar una conexión (UC-12-12). */
export class PauseConnectionResultDto {
  /**
   * Identificador asociado a connection.
   */
  @ApiProperty({ format: 'uuid' }) connectionId!: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado resultante',
    format: 'uuid',
  })
  state!: string;
  /**
   * Valor de held messages mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de mensajes QUEUED retenidos (HELD)' })
  heldMessages!: number;
}
