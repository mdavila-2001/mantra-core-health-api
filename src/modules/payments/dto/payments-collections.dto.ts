import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de sesiones de cobro (V42-02). */
export class PaymentCheckoutSessionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  gatewayConnectionId!: string;

  @ApiProperty({ format: 'uuid' })
  paymentDebtId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentIntentId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  externalTransactionId!: string | null;

  @ApiProperty({ type: String })
  redirectUrl!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  successReturnUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  failureReturnUrl!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  callbackEndpointId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  openedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de sesiones de cobro. */
export class ListCheckoutSessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de sesiones de cobro. */
export class PaymentCheckoutSessionPageDto extends pageResponseOf(
  PaymentCheckoutSessionItemDto,
  'PaymentCheckoutSessionPageDto',
) {}

/** Fila de aranceles (V42-03). */
export class FeeScheduleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  feeTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  calculationMethodConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  percentage!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  fixedAmount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  minAmount!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  maxAmount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  appliesToConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de aranceles. */
export class ListFeeSchedulesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de aranceles. */
export class FeeSchedulePageDto extends pageResponseOf(
  FeeScheduleItemDto,
  'FeeSchedulePageDto',
) {}

/** Fila de intenciones de pago (V42-04). */
export class PaymentIntentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceId!: string | null;

  @ApiProperty({ format: 'uuid' })
  gatewayId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  gatewayConnectionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentMethodId!: string | null;

  @ApiProperty({ format: 'uuid' })
  purposeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  invoiceId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sourceRefType!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourceRefId!: string | null;

  @ApiProperty({ type: String })
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  currencyConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  gatewayIntentRef!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de intenciones de pago. */
export class ListIntentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de intenciones de pago. */
export class PaymentIntentPageDto extends pageResponseOf(
  PaymentIntentItemDto,
  'PaymentIntentPageDto',
) {}

/** Fila de liquidaciones (V42-09). */
export class PaymentsPayoutItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceId!: string | null;

  @ApiProperty({ format: 'uuid' })
  payeeTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  payeeRefId!: string;

  @ApiProperty({ format: 'uuid' })
  gatewayId!: string;

  @ApiProperty({ type: String })
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  currencyConceptId!: string;

  @ApiProperty({ type: String, format: 'date' })
  periodStart!: Date;

  @ApiProperty({ type: String, format: 'date' })
  periodEnd!: Date;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  scheduledAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  executedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  destinationRef!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  gatewayPayoutRef!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  journalTransactionId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de liquidaciones. */
export class ListPayoutsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de liquidaciones. */
export class PaymentsPayoutPageDto extends pageResponseOf(
  PaymentsPayoutItemDto,
  'PaymentsPayoutPageDto',
) {}

/** Fila de conciliaciones de pagos (V42-10). */
export class PaymentsReconciliationRunItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  gatewayId!: string;

  @ApiProperty({ type: String, format: 'date' })
  periodStart!: Date;

  @ApiProperty({ type: String, format: 'date' })
  periodEnd!: Date;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  totalGateway!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  totalLedger!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  totalBank!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  matchedCount!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  unmatchedCount!: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  finishedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de conciliaciones de pagos. */
export class ListReconciliationRunsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de conciliaciones de pagos. */
export class PaymentsReconciliationRunPageDto extends pageResponseOf(
  PaymentsReconciliationRunItemDto,
  'PaymentsReconciliationRunPageDto',
) {}
