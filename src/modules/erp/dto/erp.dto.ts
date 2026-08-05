import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de partner number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de socio, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  partnerNumber!: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SUPPLIER', 'CUSTOMER', 'BOTH'] })
  @IsIn(['SUPPLIER', 'CUSTOMER', 'BOTH'])
  category!: PartnerCategory;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  legalName?: string;

  /**
   * Identificador asociado a tax.
   */
  @ApiPropertyOptional({ description: 'Identificación fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  /**
   * Valor de bank name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cuenta bancaria principal a registrar con el alta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  /**
   * Valor de iban masked mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'IBAN enmascarado; nunca el número completo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ibanMasked?: string;
}

/**
 * Define el contrato validado para partner response.
 */
export class PartnerResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de partner number mantenido por la instancia.
   */
  @ApiProperty()
  partnerNumber!: string;

  /**
   * Identificador asociado a bank account.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  bankAccountId?: string;
}

/**
 * Define el contrato validado para verify bank account response.
 */
export class VerifyBankAccountResponseDto {
  /**
   * Identificador asociado a bank account.
   */
  @ApiProperty({ format: 'uuid' })
  bankAccountId!: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;
}

/** Tipo de contrato. */
export type ContractType = 'SERVICE' | 'SUPPLY' | 'LEASE';

/** Cuerpo de `POST /erp/contracts` (UC-38-03). */
@ApiSchema({ name: 'ErpCreateContractDto' })
export class CreateContractDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de contract number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de contrato, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  contractNumber!: string;

  /**
   * Valor de contract type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SERVICE', 'SUPPLY', 'LEASE'] })
  @IsIn(['SERVICE', 'SUPPLY', 'LEASE'])
  contractType!: ContractType;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Identificador asociado a primary business partner.
   */
  @ApiProperty({ description: 'Socio de negocio contraparte', format: 'uuid' })
  @IsUUID()
  primaryBusinessPartnerId!: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startDate!: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  /**
   * Valor de total value mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '120000.00' })
  @IsOptional()
  @IsNumberString()
  totalValue?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/**
 * Define el contrato validado para contract response.
 */
export class ContractResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de contract number mantenido por la instancia.
   */
  @ApiProperty()
  contractNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a approval status concept.
   */
  @ApiProperty({ format: 'uuid' })
  approvalStatusConceptId!: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/approval-requests` (UC-38-04). */
@ApiSchema({ name: 'ErpRequestApprovalDto' })
export class RequestApprovalDto {
  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha límite de la aprobación',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Decisión inmediata cuando el aprobador resuelve en el acto',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsOptional()
  @IsIn(['APPROVED', 'REJECTED'])
  decision?: 'APPROVED' | 'REJECTED';
}

/**
 * Define el contrato validado para approval response.
 */
export class ApprovalResponseDto {
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
   * Valor de contract activated mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la decisión activó el contrato' })
  contractActivated!: boolean;
}

/** Cuerpo de `POST /erp/contracts/{id}/amendments` (UC-38-05). */
export class CreateAmendmentDto {
  /**
   * Identificador asociado a base version.
   */
  @ApiProperty({
    description: 'Versión sobre la que se enmienda',
    format: 'uuid',
  })
  @IsUUID()
  baseVersionId!: string;

  /**
   * Valor de amendment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SCOPE', 'PRICE'] })
  @IsIn(['SCOPE', 'PRICE'])
  amendmentType!: 'SCOPE' | 'PRICE';

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;

  /**
   * Valor de effective date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/renewals` (UC-38-06). */
export class CreateRenewalDto {
  /**
   * Valor de renewal type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AUTOMATIC', 'NEGOTIATED'] })
  @IsIn(['AUTOMATIC', 'NEGOTIATED'])
  renewalType!: 'AUTOMATIC' | 'NEGOTIATED';

  /**
   * Valor de new end date mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nueva fecha de fin', format: 'date-time' })
  @IsISO8601()
  newEndDate!: string;

  /**
   * Valor de proposed value mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '130000.00' })
  @IsOptional()
  @IsNumberString()
  proposedValue?: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/terminations` (UC-38-07). */
export class CreateTerminationDto {
  /**
   * Valor de termination type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['CAUSE', 'CONVENIENCE'] })
  @IsIn(['CAUSE', 'CONVENIENCE'])
  terminationType!: 'CAUSE' | 'CONVENIENCE';

  /**
   * Valor de effective date mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fecha efectiva de la terminación',
    format: 'date-time',
  })
  @IsISO8601()
  effectiveDate!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonText?: string;

  /**
   * Valor de settlement amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Liquidación pactada',
    example: '5000.00',
  })
  @IsOptional()
  @IsNumberString()
  settlementAmount?: string;
}

/**
 * Define el contrato validado para contract change response.
 */
export class ContractChangeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a contract.
   */
  @ApiProperty({ format: 'uuid' })
  contractId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/contracts/{id}/payment-schedules:generate` (UC-38-16). */
export class GeneratePaymentScheduleDto {
  /**
   * Valor de installments mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de cuotas a generar', minimum: 1 })
  @IsInt()
  @Min(1)
  installments!: number;

  /**
   * Valor de first due date mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fecha de la primera cuota',
    format: 'date-time',
  })
  @IsISO8601()
  firstDueDate!: string;

  /**
   * Valor de interval days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Días entre cuotas',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Sentido del pago',
    enum: ['OUTBOUND', 'INBOUND'],
  })
  @IsOptional()
  @IsIn(['OUTBOUND', 'INBOUND'])
  direction?: 'OUTBOUND' | 'INBOUND';
}

/**
 * Define el contrato validado para payment schedule response.
 */
export class PaymentScheduleResponseDto {
  /**
   * Identificador asociado a contract.
   */
  @ApiProperty({ format: 'uuid' })
  contractId!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cuotas creadas en esta ejecución' })
  created!: number;

  /**
   * Valor de installment amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe de cada cuota' })
  installmentAmount!: string;
}

/** Cuerpo de `POST /erp/employees:onboard` (UC-38-08). */
export class OnboardEmployeeDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  fullName!: string;

  /**
   * Identificador asociado a person user.
   */
  @ApiPropertyOptional({
    description: 'Usuario de la plataforma vinculado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  personUserId?: string;

  /**
   * Valor de hire date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  hireDate?: string;

  /**
   * Valor de base salary mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '8000.00' })
  @IsOptional()
  @IsNumberString()
  baseSalary?: string;
}

/**
 * Define el contrato validado para employee response.
 */
export class EmployeeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @ApiProperty()
  fullName!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/employees/{id}/time-off` (UC-38-09). */
export class RequestTimeOffDto {
  /**
   * Valor de leave type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['VACATION', 'SICK'] })
  @IsIn(['VACATION', 'SICK'])
  leaveType!: 'VACATION' | 'SICK';

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startDate!: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endDate!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /erp/employees/{id}/time-off/{reqId}:approve` (UC-38-09). */
export class ApproveTimeOffDto {
  /**
   * Valor de approved mantenido por la instancia.
   */
  @ApiProperty({ description: 'true aprueba la solicitud; false la rechaza' })
  @IsIn([true, false])
  approved!: boolean;
}

/**
 * Define el contrato validado para time off response.
 */
export class TimeOffResponseDto {
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
}

/** Línea de una orden de compra. */
export class PurchaseOrderItemDto {
  /**
   * Valor de item type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['MATERIAL', 'SERVICE'] })
  @IsIn(['MATERIAL', 'SERVICE'])
  itemType!: 'MATERIAL' | 'SERVICE';

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ example: '10' })
  @IsNumberString()
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @ApiProperty({ example: '250.00' })
  @IsNumberString()
  unitPrice!: string;
}

/** Cuerpo de `POST /erp/purchase-orders` (UC-38-10). */
@ApiSchema({ name: 'ErpCreatePurchaseOrderDto' })
export class CreatePurchaseOrderDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de orden, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purchaseOrderNumber!: string;

  /**
   * Identificador asociado a supplier business partner.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  supplierBusinessPartnerId!: string;

  /**
   * Identificador asociado a purchase requisition.
   */
  @ApiPropertyOptional({ description: 'Requisición de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseRequisitionId?: string;

  /**
   * Identificador asociado a contract.
   */
  @ApiPropertyOptional({ description: 'Contrato marco', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  /**
   * Valor de expected delivery date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  expectedDeliveryDate?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

/**
 * Define el contrato validado para purchase order response.
 */
export class PurchaseOrderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  @ApiProperty()
  purchaseOrderNumber!: string;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty()
  itemCount!: number;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe total de la orden' })
  totalAmount!: string;
}

/** Línea recibida de una orden. */
export class GoodsReceiptItemDto {
  /**
   * Identificador asociado a purchase order item.
   */
  @ApiProperty({
    description: 'Línea de la orden que se recibe',
    format: 'uuid',
  })
  @IsUUID()
  purchaseOrderItemId!: string;

  /**
   * Valor de received quantity mantenido por la instancia.
   */
  @ApiProperty({ example: '10' })
  @IsNumberString()
  receivedQuantity!: string;

  /**
   * Valor de accepted quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cantidad aceptada tras control de calidad',
    example: '9',
  })
  @IsOptional()
  @IsNumberString()
  acceptedQuantity?: string;
}

/** Cuerpo de `POST /erp/purchase-orders/{id}/goods-receipts` (UC-38-11). */
@ApiSchema({ name: 'ErpCreateGoodsReceiptDto' })
export class CreateGoodsReceiptDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de receipt number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de recepción', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  receiptNumber!: string;

  /**
   * Valor de supplier delivery reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del albarán del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierDeliveryReference?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];
}

/**
 * Define el contrato validado para goods receipt response.
 */
export class GoodsReceiptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de receipt number mantenido por la instancia.
   */
  @ApiProperty()
  receiptNumber!: string;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty()
  itemCount!: number;

  /**
   * Valor de rejected units mantenido por la instancia.
   */
  @ApiProperty({ description: 'Unidades rechazadas en el control de calidad' })
  rejectedUnits!: string;
}

/** Cuerpo de `POST /erp/purchase-orders/{id}/service-entry-sheets` (UC-38-12). */
export class CreateServiceEntrySheetDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de sheet number mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sheetNumber!: string;

  /**
   * Valor de performed from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  performedFrom?: string;

  /**
   * Valor de performed to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  performedTo?: string;
}

/**
 * Define el contrato validado para service entry sheet response.
 */
export class ServiceEntrySheetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de sheet number mantenido por la instancia.
   */
  @ApiProperty()
  sheetNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/bills/{billId}/invoice-match-runs` (UC-38-13). */
export class CreateInvoiceMatchDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a purchase order.
   */
  @ApiProperty({
    description: 'Orden de compra contra la que se concilia',
    format: 'uuid',
  })
  @IsUUID()
  purchaseOrderId!: string;

  /**
   * Valor de invoiced amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe facturado por el proveedor',
    example: '2500.00',
  })
  @IsNumberString()
  invoicedAmount!: string;

  /**
   * Valor de tolerance amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tolerancia admitida antes de marcar desviación',
    example: '10.00',
  })
  @IsOptional()
  @IsNumberString()
  toleranceAmount?: string;
}

/**
 * Define el contrato validado para invoice match response.
 */
export class InvoiceMatchResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de matched amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe de la orden contra el que se comparó' })
  matchedAmount!: string;

  /**
   * Valor de variance amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Diferencia entre lo facturado y lo ordenado' })
  varianceAmount!: string;

  /**
   * Valor de matched mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la diferencia queda dentro de la tolerancia',
  })
  matched!: boolean;
}

/** Cuerpo de `POST /erp/sales-orders` (UC-38-14). */
export class CreateSalesOrderDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de sales order number mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  salesOrderNumber!: string;

  /**
   * Identificador asociado a customer business partner.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerBusinessPartnerId!: string;

  /**
   * Identificador asociado a opportunity.
   */
  @ApiPropertyOptional({
    description: 'Oportunidad ganada que la origina',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  /**
   * Identificador asociado a contract.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;
}

/**
 * Define el contrato validado para sales order response.
 */
export class SalesOrderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de sales order number mantenido por la instancia.
   */
  @ApiProperty()
  salesOrderNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /erp/lease-contracts/{id}/valuations` (UC-38-15). */
export class CreateLeaseValuationDto {
  /**
   * Valor de valuation date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  valuationDate!: string;

  /**
   * Valor de right of use asset value mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Valor del activo por derecho de uso',
    example: '95000.00',
  })
  @IsNumberString()
  rightOfUseAssetValue!: string;

  /**
   * Valor de lease liability value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Pasivo por arrendamiento', example: '92000.00' })
  @IsNumberString()
  leaseLiabilityValue!: string;

  /**
   * Valor de interest expense mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '1200.00' })
  @IsOptional()
  @IsNumberString()
  interestExpense?: string;

  /**
   * Valor de depreciation expense mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '2500.00' })
  @IsOptional()
  @IsNumberString()
  depreciationExpense?: string;
}

/**
 * Define el contrato validado para lease valuation response.
 */
export class LeaseValuationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a lease contract.
   */
  @ApiProperty({ format: 'uuid' })
  leaseContractId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
