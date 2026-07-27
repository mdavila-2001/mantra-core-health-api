import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Categoría del socio de negocio. */
export type PartnerCategory = 'SUPPLIER' | 'CUSTOMER' | 'BOTH';

/** Cuerpo de `POST /erp/business-partners` (UC-38-01). */
export class CreatePartnerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Número de socio, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  partnerNumber!: string;

  @ApiProperty({ enum: ['SUPPLIER', 'CUSTOMER', 'BOTH'] })
  @IsIn(['SUPPLIER', 'CUSTOMER', 'BOTH'])
  category!: PartnerCategory;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  legalName?: string;

  @ApiPropertyOptional({ description: 'Identificación fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Cuenta bancaria principal a registrar con el alta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @ApiPropertyOptional({
    description: 'IBAN enmascarado; nunca el número completo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ibanMasked?: string;
}

export class PartnerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  partnerNumber!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  bankAccountId?: string;
}

export class VerifyBankAccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  bankAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;
}

/** Tipo de contrato. */
export type ContractType = 'SERVICE' | 'SUPPLY' | 'LEASE';

/** Cuerpo de `POST /erp/contracts` (UC-38-03). */
export class CreateContractDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Número de contrato, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  contractNumber!: string;

  @ApiProperty({ enum: ['SERVICE', 'SUPPLY', 'LEASE'] })
  @IsIn(['SERVICE', 'SUPPLY', 'LEASE'])
  contractType!: ContractType;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ description: 'Socio de negocio contraparte', format: 'uuid' })
  @IsUUID()
  primaryBusinessPartnerId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startDate!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ example: '120000.00' })
  @IsOptional()
  @IsNumberString()
  totalValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class ContractResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  contractNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  approvalStatusConceptId!: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/approval-requests` (UC-38-04). */
export class RequestApprovalDto {
  @ApiPropertyOptional({
    description: 'Fecha límite de la aprobación',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional({
    description: 'Decisión inmediata cuando el aprobador resuelve en el acto',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsIn(['APPROVED', 'REJECTED'])
  decision?: 'APPROVED' | 'REJECTED';
}

export class ApprovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'true si la decisión activó el contrato' })
  contractActivated!: boolean;
}

/** Cuerpo de `POST /erp/contracts/{id}/amendments` (UC-38-05). */
export class CreateAmendmentDto {
  @ApiProperty({
    description: 'Versión sobre la que se enmienda',
    format: 'uuid',
  })
  @IsUUID()
  baseVersionId!: string;

  @ApiProperty({ enum: ['SCOPE', 'PRICE'] })
  @IsIn(['SCOPE', 'PRICE'])
  amendmentType!: 'SCOPE' | 'PRICE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/renewals` (UC-38-06). */
export class CreateRenewalDto {
  @ApiProperty({ enum: ['AUTOMATIC', 'NEGOTIATED'] })
  @IsIn(['AUTOMATIC', 'NEGOTIATED'])
  renewalType!: 'AUTOMATIC' | 'NEGOTIATED';

  @ApiProperty({ description: 'Nueva fecha de fin', format: 'date-time' })
  @IsISO8601()
  newEndDate!: string;

  @ApiPropertyOptional({ example: '130000.00' })
  @IsOptional()
  @IsNumberString()
  proposedValue?: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/terminations` (UC-38-07). */
export class CreateTerminationDto {
  @ApiProperty({ enum: ['CAUSE', 'CONVENIENCE'] })
  @IsIn(['CAUSE', 'CONVENIENCE'])
  terminationType!: 'CAUSE' | 'CONVENIENCE';

  @ApiProperty({
    description: 'Fecha efectiva de la terminación',
    format: 'date-time',
  })
  @IsISO8601()
  effectiveDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;

  @ApiPropertyOptional({
    description: 'Liquidación pactada',
    example: '5000.00',
  })
  @IsOptional()
  @IsNumberString()
  settlementAmount?: string;
}

export class ContractChangeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  contractId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/payment-schedules:generate` (UC-38-16). */
export class GeneratePaymentScheduleDto {
  @ApiProperty({ description: 'Número de cuotas a generar', minimum: 1 })
  @IsInt()
  @Min(1)
  installments!: number;

  @ApiProperty({
    description: 'Fecha de la primera cuota',
    format: 'date-time',
  })
  @IsISO8601()
  firstDueDate!: string;

  @ApiPropertyOptional({
    description: 'Días entre cuotas',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @ApiPropertyOptional({
    description: 'Sentido del pago',
    enum: ['OUTBOUND', 'INBOUND'],
  })
  @IsOptional()
  @IsIn(['OUTBOUND', 'INBOUND'])
  direction?: 'OUTBOUND' | 'INBOUND';
}

export class PaymentScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  contractId!: string;

  @ApiProperty({ description: 'Cuotas creadas en esta ejecución' })
  created!: number;

  @ApiProperty({ description: 'Importe de cada cuota' })
  installmentAmount!: string;
}

/** Cuerpo de `POST /erp/employees:onboard` (UC-38-08). */
export class OnboardEmployeeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Usuario de la plataforma vinculado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personUserId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  hireDate?: string;

  @ApiPropertyOptional({ example: '8000.00' })
  @IsOptional()
  @IsNumberString()
  baseSalary?: string;
}

export class EmployeeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/employees/{id}/time-off` (UC-38-09). */
export class RequestTimeOffDto {
  @ApiProperty({ enum: ['VACATION', 'SICK'] })
  @IsIn(['VACATION', 'SICK'])
  leaveType!: 'VACATION' | 'SICK';

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startDate!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /erp/employees/{id}/time-off/{reqId}:approve` (UC-38-09). */
export class ApproveTimeOffDto {
  @ApiProperty({ description: 'true aprueba la solicitud; false la rechaza' })
  @IsIn([true, false])
  approved!: boolean;
}

export class TimeOffResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Línea de una orden de compra. */
export class PurchaseOrderItemDto {
  @ApiProperty({ enum: ['MATERIAL', 'SERVICE'] })
  @IsIn(['MATERIAL', 'SERVICE'])
  itemType!: 'MATERIAL' | 'SERVICE';

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '10' })
  @IsNumberString()
  quantity!: string;

  @ApiProperty({ example: '250.00' })
  @IsNumberString()
  unitPrice!: string;
}

/** Cuerpo de `POST /erp/purchase-orders` (UC-38-10). */
export class CreatePurchaseOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Número de orden, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purchaseOrderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  supplierBusinessPartnerId!: string;

  @ApiPropertyOptional({ description: 'Requisición de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseRequisitionId?: string;

  @ApiPropertyOptional({ description: 'Contrato marco', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  expectedDeliveryDate?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class PurchaseOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  purchaseOrderNumber!: string;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty({ description: 'Importe total de la orden' })
  totalAmount!: string;
}

/** Línea recibida de una orden. */
export class GoodsReceiptItemDto {
  @ApiProperty({
    description: 'Línea de la orden que se recibe',
    format: 'uuid',
  })
  @IsUUID()
  purchaseOrderItemId!: string;

  @ApiProperty({ example: '10' })
  @IsNumberString()
  receivedQuantity!: string;

  @ApiPropertyOptional({
    description: 'Cantidad aceptada tras control de calidad',
    example: '9',
  })
  @IsOptional()
  @IsNumberString()
  acceptedQuantity?: string;
}

/** Cuerpo de `POST /erp/purchase-orders/{id}/goods-receipts` (UC-38-11). */
export class CreateGoodsReceiptDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Número de recepción', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  receiptNumber!: string;

  @ApiPropertyOptional({ description: 'Referencia del albarán del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierDeliveryReference?: string;

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];
}

export class GoodsReceiptResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  receiptNumber!: string;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty({ description: 'Unidades rechazadas en el control de calidad' })
  rejectedUnits!: string;
}

/** Cuerpo de `POST /erp/purchase-orders/{id}/service-entry-sheets` (UC-38-12). */
export class CreateServiceEntrySheetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sheetNumber!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  performedFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  performedTo?: string;
}

export class ServiceEntrySheetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  sheetNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/bills/{billId}/invoice-match-runs` (UC-38-13). */
export class CreateInvoiceMatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Orden de compra contra la que se concilia',
    format: 'uuid',
  })
  @IsUUID()
  purchaseOrderId!: string;

  @ApiProperty({
    description: 'Importe facturado por el proveedor',
    example: '2500.00',
  })
  @IsNumberString()
  invoicedAmount!: string;

  @ApiPropertyOptional({
    description: 'Tolerancia admitida antes de marcar desviación',
    example: '10.00',
  })
  @IsOptional()
  @IsNumberString()
  toleranceAmount?: string;
}

export class InvoiceMatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Importe de la orden contra el que se comparó' })
  matchedAmount!: string;

  @ApiProperty({ description: 'Diferencia entre lo facturado y lo ordenado' })
  varianceAmount!: string;

  @ApiProperty({
    description: 'true si la diferencia queda dentro de la tolerancia',
  })
  matched!: boolean;
}

/** Cuerpo de `POST /erp/sales-orders` (UC-38-14). */
export class CreateSalesOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  salesOrderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerBusinessPartnerId!: string;

  @ApiPropertyOptional({
    description: 'Oportunidad ganada que la origina',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;
}

export class SalesOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  salesOrderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/lease-contracts/{id}/valuations` (UC-38-15). */
export class CreateLeaseValuationDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  valuationDate!: string;

  @ApiProperty({
    description: 'Valor del activo por derecho de uso',
    example: '95000.00',
  })
  @IsNumberString()
  rightOfUseAssetValue!: string;

  @ApiProperty({ description: 'Pasivo por arrendamiento', example: '92000.00' })
  @IsNumberString()
  leaseLiabilityValue!: string;

  @ApiPropertyOptional({ example: '1200.00' })
  @IsOptional()
  @IsNumberString()
  interestExpense?: string;

  @ApiPropertyOptional({ example: '2500.00' })
  @IsOptional()
  @IsNumberString()
  depreciationExpense?: string;
}

export class LeaseValuationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  leaseContractId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
