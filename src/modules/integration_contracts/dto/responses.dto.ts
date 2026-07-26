import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representación segura de un contrato de integración. */
export class ContractResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  contractCode!: string;

  @ApiProperty({ format: 'uuid' })
  externalProviderId!: string;

  @ApiProperty({ description: 'Concepto de estado del contrato', format: 'uuid' })
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

/** Representación de una versión de contrato. */
export class ContractVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Concepto de estado de la versión', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional()
  effectiveFrom?: Date;
}

/** Representación de un perfil de autenticación (sin secretos). */
export class AuthProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  @ApiProperty({ description: 'Concepto de estado del perfil', format: 'uuid' })
  status!: string;
}

/** Representación de una suscripción de webhook. */
export class WebhookSubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  @ApiProperty({ description: 'Concepto de estado de la suscripción', format: 'uuid' })
  status!: string;
}

/** Representación de un registro de intercambio. */
export class ExchangeRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationContractVersionId!: string;

  @ApiProperty({ description: 'Concepto de resultado', format: 'uuid' })
  outcome!: string;

  @ApiProperty({ description: 'true si la respuesta se devuelve por replay idempotente' })
  replayed!: boolean;

  @ApiPropertyOptional({ description: 'Referencia de respuesta previa (replay)' })
  responseReference?: string;
}

/** Representación de un intento de intercambio. */
export class ExchangeAttemptResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationExchangeRecordId!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty({ description: 'Concepto de resultado del intento', format: 'uuid' })
  outcome!: string;

  @ApiProperty({ description: 'Concepto de resultado del registro tras el intento', format: 'uuid' })
  recordOutcome!: string;
}

/** Representación de un cursor de sincronización. */
export class SyncCursorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  cursorScope!: string;

  @ApiProperty()
  cursorValue!: string;

  @ApiProperty({ description: 'true si se creó el cursor en esta operación' })
  created!: boolean;
}

/** Representación de evidencia de entrega de webhook. */
export class DeliveryEvidenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  integrationExchangeRecordId!: string;

  @ApiProperty({ description: 'Concepto de resultado de la entrega', format: 'uuid' })
  outcome!: string;
}

/** Resultado genérico de una operación de estado (activate/retire/rotate). */
export class StatusResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
