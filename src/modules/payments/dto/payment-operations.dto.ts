import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Método de cálculo de una tarifa. */
export type FeeMethod = 'PERCENTAGE' | 'FIXED';

/** Cuerpo de `POST /payments/fee-schedules` (UC-42-10). */
export class CreateFeeScheduleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código único de la tarifa dentro del tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Quién cobra la tarifa',
    enum: ['GATEWAY', 'PLATFORM'],
  })
  @IsIn(['GATEWAY', 'PLATFORM'])
  feeType!: 'GATEWAY' | 'PLATFORM';

  @ApiProperty({
    description: 'Modo de cálculo',
    enum: ['PERCENTAGE', 'FIXED'],
  })
  @IsIn(['PERCENTAGE', 'FIXED'])
  method!: FeeMethod;

  @ApiPropertyOptional({
    description: 'Porcentaje cuando method=PERCENTAGE',
    example: '2.9',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  @ApiPropertyOptional({
    description: 'Importe fijo cuando method=FIXED',
    example: '0.30',
  })
  @IsOptional()
  @IsNumberString()
  fixedAmount?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

export class FeeScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({
    description: 'Id de la versión anterior que quedó superseded, si existía',
    required: false,
  })
  supersededId?: string;
}

/** Línea de una liquidación importada. */
export class SettlementLineDto {
  @ApiPropertyOptional({ description: 'Transacción liquidada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentTransactionId?: string;

  @ApiPropertyOptional({ description: 'Reembolso liquidado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  refundId?: string;

  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ example: '4.65' })
  @IsOptional()
  @IsNumberString()
  feeAmount?: string;
}

/** Cuerpo de `POST /payments/settlements/import` (UC-42-12). */
export class ImportSettlementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  @ApiProperty({
    description: 'Referencia del lote en el gateway (única)',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  settlementRef!: string;

  @ApiProperty({ example: '1500.00' })
  @IsNumberString()
  grossAmount!: string;

  @ApiProperty({ example: '46.50' })
  @IsNumberString()
  feeAmount!: string;

  @ApiProperty({ example: '1453.50' })
  @IsNumberString()
  netAmount!: string;

  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  settledAt?: string;

  @ApiProperty({
    description: 'Detalle de la liquidación',
    type: [SettlementLineDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettlementLineDto)
  lines!: SettlementLineDto[];
}

export class SettlementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  settlementRef!: string;

  @ApiProperty({ description: 'Líneas importadas' })
  lineCount!: number;

  @ApiProperty({ description: 'Transacciones marcadas como liquidadas' })
  settledTransactions!: number;

  @ApiProperty({
    description: 'true si el lote ya estaba importado (reintento idempotente)',
  })
  duplicate!: boolean;
}

/** Ítem que compone un payout. */
export class PayoutItemDto {
  @ApiProperty({
    description: 'Transacción que origina el ítem',
    format: 'uuid',
  })
  @IsUUID()
  sourceRefId!: string;

  @ApiProperty({ example: '100.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ example: '5.00' })
  @IsOptional()
  @IsNumberString()
  commissionAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/** Cuerpo de `POST /payments/payouts` (UC-42-13). */
export class CreatePayoutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Cuenta conectada destinataria', format: 'uuid' })
  @IsUUID()
  payeeRefId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  @ApiProperty({ description: 'Ítems a liquidar', type: [PayoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PayoutItemDto)
  items!: PayoutItemDto[];

  @ApiPropertyOptional({ description: 'Referencia del payout en el gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayPayoutRef?: string;
}

export class PayoutResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Suma de los ítems', example: '300.00' })
  amount!: string;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Registro del proveedor a contrastar contra el ledger. */
export class ProviderRecordDto {
  @ApiProperty({ description: 'Id de la transacción en el proveedor' })
  @IsString()
  @MaxLength(200)
  externalTransactionId!: string;

  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  providerAmount!: string;

  @ApiProperty({ description: 'Código de estado informado por el proveedor' })
  @IsString()
  @MaxLength(50)
  providerStatusCode!: string;

  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  providerCurrencyCode!: 'BOB' | 'USD';

  @ApiPropertyOptional({ example: '4.65' })
  @IsOptional()
  @IsNumberString()
  providerFeeAmount?: string;
}

/** Cuerpo de `POST /payments/reconciliation-runs` (UC-42-14). */
export class CreateReconciliationRunDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  @ApiProperty({
    description: 'Conexión de la que provienen los registros',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  @ApiProperty({
    description: 'Extracto del proveedor',
    type: [ProviderRecordDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderRecordDto)
  providerRecords!: ProviderRecordDto[];
}

export class ReconciliationRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Registros que casaron con una transacción local',
  })
  matchedCount!: number;

  @ApiProperty({ description: 'Registros sin contraparte local' })
  unmatchedCount!: number;

  @ApiProperty({ description: 'Excepciones abiertas por el descuadre' })
  exceptionCount!: number;

  @ApiProperty({
    description: 'Total informado por el proveedor',
    example: '1500.00',
  })
  totalGateway!: string;

  @ApiProperty({
    description: 'Total según el ledger local',
    example: '1450.00',
  })
  totalLedger!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
