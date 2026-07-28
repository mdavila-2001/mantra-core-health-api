import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Representación segura de un contrato de integración. */
export class ContractResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de contract code mantenido por la instancia.
   */
  @ApiProperty()
  contractCode!: string;

  /**
   * Identificador asociado a external provider.
   */
  @ApiProperty({ format: 'uuid' })
  externalProviderId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de estado del contrato',
    format: 'uuid',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Representación de una versión de contrato. */
export class ContractVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration contract.
   */
  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de estado de la versión',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional()
  effectiveFrom?: Date;
}

/** Representación de un perfil de autenticación (sin secretos). */
export class AuthProfileResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration contract.
   */
  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concepto de estado del perfil', format: 'uuid' })
  status!: string;
}

/** Representación de una suscripción de webhook. */
export class WebhookSubscriptionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration contract.
   */
  @ApiProperty({ format: 'uuid' })
  integrationContractId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de estado de la suscripción',
    format: 'uuid',
  })
  status!: string;
}

/** Representación de un registro de intercambio. */
export class ExchangeRecordResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration contract version.
   */
  @ApiProperty({ format: 'uuid' })
  integrationContractVersionId!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concepto de resultado', format: 'uuid' })
  outcome!: string;

  /**
   * Valor de replayed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la respuesta se devuelve por replay idempotente',
  })
  replayed!: boolean;

  /**
   * Valor de response reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de respuesta previa (replay)',
  })
  responseReference?: string;
}

/** Representación de un intento de intercambio. */
export class ExchangeAttemptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration exchange record.
   */
  @ApiProperty({ format: 'uuid' })
  integrationExchangeRecordId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty()
  attemptNumber!: number;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de resultado del intento',
    format: 'uuid',
  })
  outcome!: string;

  /**
   * Valor de record outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de resultado del registro tras el intento',
    format: 'uuid',
  })
  recordOutcome!: string;
}

/** Representación de un cursor de sincronización. */
export class SyncCursorResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de cursor scope mantenido por la instancia.
   */
  @ApiProperty()
  cursorScope!: string;

  /**
   * Valor de cursor value mantenido por la instancia.
   */
  @ApiProperty()
  cursorValue!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se creó el cursor en esta operación' })
  created!: boolean;
}

/** Representación de evidencia de entrega de webhook. */
export class DeliveryEvidenceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a integration exchange record.
   */
  @ApiProperty({ format: 'uuid' })
  integrationExchangeRecordId!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concepto de resultado de la entrega',
    format: 'uuid',
  })
  outcome!: string;
}

/** Resultado genérico de una operación de estado (activate/retire/rotate). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
