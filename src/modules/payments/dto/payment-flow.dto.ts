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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Conexión del gateway habilitada para el canal',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  @ApiProperty({ description: 'Deuda que se va a cobrar', format: 'uuid' })
  @IsUUID()
  paymentDebtId!: string;

  @ApiProperty({ description: 'URL a la que se redirige al pagador' })
  @IsUrl({ require_tld: false })
  redirectUrl!: string;

  @ApiProperty({ description: 'Vencimiento de la sesión', format: 'date-time' })
  @IsISO8601()
  expiresAt!: string;

  @ApiPropertyOptional({
    description: 'Intent asociado, si ya existe',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'Cajero que abre la sesión (contexto POS)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  cashierUserId?: string;

  @ApiPropertyOptional({ description: 'Caja registradora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @ApiPropertyOptional({ description: 'Sede', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Referencia del turno de caja' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shiftReference?: string;

  @ApiPropertyOptional({ format: 'url' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  successReturnUrl?: string;

  @ApiPropertyOptional({ format: 'url' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  failureReturnUrl?: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentDebtId!: string;

  @ApiProperty()
  redirectUrl!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /payments/intents/{id}/fx-lock` (UC-42-03). */
export class CreateFxLockDto {
  @ApiProperty({ description: 'Moneda de origen', enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  fromCurrency!: 'BOB' | 'USD';

  @ApiProperty({ description: 'Moneda destino', enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  toCurrency!: 'BOB' | 'USD';

  @ApiProperty({ description: 'Cotización bloqueada', example: '6.96' })
  @IsNumberString()
  lockedRate!: string;

  @ApiProperty({ description: 'Vigencia del bloqueo', format: 'date-time' })
  @IsISO8601()
  expiresAt!: string;

  @ApiPropertyOptional({ description: 'Referencia del proveedor de FX' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerRef?: string;
}

export class FxLockResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ example: '6.96' })
  lockedRate!: string;

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
  @ApiProperty({ description: 'Score de riesgo (0-100)', example: '12.5' })
  @IsNumberString()
  riskScore!: string;

  @ApiProperty({ description: 'Decisión del motor', enum: RISK_DECISIONS })
  @IsIn(RISK_DECISIONS as readonly string[])
  decision!: RiskDecision;

  @ApiPropertyOptional({
    description: 'true si el pagador completó 3-D Secure',
  })
  @IsOptional()
  @IsBoolean()
  threeDsAuthenticated?: boolean;

  @ApiPropertyOptional({ description: 'Referencia del proveedor antifraude' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerRef?: string;

  @ApiPropertyOptional({
    description: 'Señales crudas del motor (se persisten como jsonb)',
  })
  @IsOptional()
  signals?: Record<string, unknown>;
}

export class RiskAssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ enum: RISK_DECISIONS })
  decision!: RiskDecision;

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
  @ApiProperty({
    description: 'Cuenta conectada que recibe el reparto',
    format: 'uuid',
  })
  @IsUUID()
  payeeConnectedAccountId!: string;

  @ApiProperty({
    description: 'Modo de reparto',
    enum: ['AMOUNT', 'PERCENTAGE'],
  })
  @IsIn(['AMOUNT', 'PERCENTAGE'])
  splitType!: SplitType;

  @ApiPropertyOptional({ description: 'Importe fijo cuando splitType=AMOUNT' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje cuando splitType=PERCENTAGE',
    example: '15.00',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  @ApiPropertyOptional({
    description: 'true si el reparto es la comisión de la plataforma',
  })
  @IsOptional()
  @IsBoolean()
  isPlatformFee?: boolean;

  @ApiPropertyOptional({ description: 'Wallet destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationWalletId?: string;
}

export class SplitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ description: 'Importe resuelto del reparto' })
  amount!: string;

  @ApiProperty()
  isPlatformFee!: boolean;
}
