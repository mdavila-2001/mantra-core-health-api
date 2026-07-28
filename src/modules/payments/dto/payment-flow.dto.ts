import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /payments/checkout-sessions` (UC-42-02). */
export class OpenCheckoutSessionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a gateway connection.
   */
  @ApiProperty({
    description: 'Conexión del gateway habilitada para el canal',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  /**
   * Identificador asociado a payment debt.
   */
  @ApiProperty({ description: 'Deuda que se va a cobrar', format: 'uuid' })
  @IsUUID()
  paymentDebtId!: string;

  /**
   * Valor de redirect url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL a la que se redirige al pagador' })
  @IsUrl({ require_tld: false })
  redirectUrl!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Vencimiento de la sesión', format: 'date-time' })
  @IsISO8601()
  expiresAt!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiPropertyOptional({
    description: 'Intent asociado, si ya existe',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  /**
   * Identificador asociado a cashier user.
   */
  @ApiPropertyOptional({
    description: 'Cajero que abre la sesión (contexto POS)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  cashierUserId?: string;

  /**
   * Identificador asociado a cash register.
   */
  @ApiPropertyOptional({ description: 'Caja registradora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  /**
   * Identificador asociado a site.
   */
  @ApiPropertyOptional({ description: 'Sede', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  /**
   * Valor de shift reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del turno de caja' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shiftReference?: string;

  /**
   * Valor de success return url mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'url' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  successReturnUrl?: string;

  /**
   * Valor de failure return url mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'url' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  failureReturnUrl?: string;
}

/**
 * Define el contrato validado para checkout session response.
 */
export class CheckoutSessionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment debt.
   */
  @ApiProperty({ format: 'uuid' })
  paymentDebtId!: string;

  /**
   * Valor de redirect url mantenido por la instancia.
   */
  @ApiProperty()
  redirectUrl!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /payments/intents/{id}/fx-lock` (UC-42-03). */
export class CreateFxLockDto {
  /**
   * Valor de from currency mantenido por la instancia.
   */
  @ApiProperty({ description: 'Moneda de origen', enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  fromCurrency!: 'BOB' | 'USD';

  /**
   * Valor de to currency mantenido por la instancia.
   */
  @ApiProperty({ description: 'Moneda destino', enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  toCurrency!: 'BOB' | 'USD';

  /**
   * Valor de locked rate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cotización bloqueada', example: '6.96' })
  @IsNumberString()
  lockedRate!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Vigencia del bloqueo', format: 'date-time' })
  @IsISO8601()
  expiresAt!: string;

  /**
   * Valor de provider ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del proveedor de FX' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerRef?: string;
}

/**
 * Define el contrato validado para fx lock response.
 */
export class FxLockResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  /**
   * Valor de locked rate mantenido por la instancia.
   */
  @ApiProperty({ example: '6.96' })
  lockedRate!: string;

  /**
   * Valor de converted amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe del intent recalculado a la moneda destino',
  })
  convertedAmount!: string;
}

/** Decisión del motor de riesgo. */
export type RiskDecision = 'APPROVE' | 'REVIEW' | 'DECLINE';
export const RISK_DECISIONS: readonly RiskDecision[] = [
  'APPROVE',
  'REVIEW',
  'DECLINE',
];

/** Cuerpo de `POST /payments/intents/{id}/risk-assessment` (UC-42-04). */
export class CreateRiskAssessmentDto {
  /**
   * Valor de risk score mantenido por la instancia.
   */
  @ApiProperty({ description: 'Score de riesgo (0-100)', example: '12.5' })
  @IsNumberString()
  riskScore!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ description: 'Decisión del motor', enum: RISK_DECISIONS })
  @IsIn(RISK_DECISIONS as readonly string[])
  decision!: RiskDecision;

  /**
   * Valor de three ds authenticated mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si el pagador completó 3-D Secure',
  })
  @IsOptional()
  @IsBoolean()
  threeDsAuthenticated?: boolean;

  /**
   * Valor de provider ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del proveedor antifraude' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerRef?: string;

  /**
   * Valor de signals mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Señales crudas del motor (se persisten como jsonb)',
  })
  @IsOptional()
  signals?: Record<string, unknown>;
}

/**
 * Define el contrato validado para risk assessment response.
 */
export class RiskAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: RISK_DECISIONS })
  decision!: RiskDecision;

  /**
   * Valor de risk level mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nivel derivado del score',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  riskLevel!: 'LOW' | 'MEDIUM' | 'HIGH';
}

/** Tipo de reparto de un split. */
export type SplitType = 'AMOUNT' | 'PERCENTAGE';

/** Cuerpo de `POST /payments/intents/{id}/splits` (UC-42-11). */
export class CreateSplitDto {
  /**
   * Identificador asociado a payee connected account.
   */
  @ApiProperty({
    description: 'Cuenta conectada que recibe el reparto',
    format: 'uuid',
  })
  @IsUUID()
  payeeConnectedAccountId!: string;

  /**
   * Valor de split type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Modo de reparto',
    enum: ['AMOUNT', 'PERCENTAGE'],
  })
  @IsIn(['AMOUNT', 'PERCENTAGE'])
  splitType!: SplitType;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Importe fijo cuando splitType=AMOUNT' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje cuando splitType=PERCENTAGE',
    example: '15.00',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  /**
   * Valor de is platform fee mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si el reparto es la comisión de la plataforma',
  })
  @IsOptional()
  @IsBoolean()
  isPlatformFee?: boolean;

  /**
   * Identificador asociado a destination wallet.
   */
  @ApiPropertyOptional({ description: 'Wallet destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationWalletId?: string;
}

/**
 * Define el contrato validado para split response.
 */
export class SplitResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe resuelto del reparto' })
  amount!: string;

  /**
   * Valor de is platform fee mantenido por la instancia.
   */
  @ApiProperty()
  isPlatformFee!: boolean;
}
