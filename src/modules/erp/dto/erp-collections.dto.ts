import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de socios comerciales (V38-02). */
export class BusinessPartnerItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  partnerNumber!: string;

  @ApiProperty({ format: 'uuid' })
  partnerCategoryConceptId!: string;

  @ApiProperty({ type: String })
  displayName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  taxId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  countryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  linkedTenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  linkedPersonId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de socios comerciales. */
export class ListBusinessPartnersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de socios comerciales. */
export class BusinessPartnerPageDto extends pageResponseOf(
  BusinessPartnerItemDto,
  'BusinessPartnerPageDto',
) {}

/** Fila de contratos (V38-04). */
export class ContractItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  contractNumber!: string;

  @ApiProperty({ format: 'uuid' })
  contractTypeConceptId!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  counterpartyTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  counterpartyRefType!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  counterpartyRefId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  counterpartyName!: string | null;

  @ApiProperty({ type: String, format: 'date' })
  startDate!: Date;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  endDate!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  renewalTypeConceptId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  noticePeriodDays!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  totalValue!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  governingJurisdictionConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  primaryBusinessPartnerId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentVersionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentContractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  masterAgreementId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  owningDepartmentId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  owningCostCenterId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  owningProfitCenterId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvalStatusConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  signatureStatusConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de contratos. */
export class ListContractsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de contratos. */
export class ContractPageDto extends pageResponseOf(
  ContractItemDto,
  'ContractPageDto',
) {}

/** Fila de órdenes de compra (V38-13). */
export class ErpPurchaseOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  purchaseOrderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  supplierBusinessPartnerId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  purchaseRequisitionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  orderingDepartmentId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  buyerEmployeeId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  orderDate!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  expectedDeliveryDate!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentTermsConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  incotermConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvalStatusConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de órdenes de compra. */
export class ListPurchaseOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de órdenes de compra. */
export class ErpPurchaseOrderPageDto extends pageResponseOf(
  ErpPurchaseOrderItemDto,
  'ErpPurchaseOrderPageDto',
) {}

/** Fila de recepciones de una orden de compra (V38-14). */
export class ErpGoodsReceiptItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  receiptNumber!: string;

  @ApiProperty({ format: 'uuid' })
  purchaseOrderId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  receivingBranchId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  receivedByEmployeeId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  receivedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  supplierDeliveryReference!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de recepciones de una orden de compra. */
export class ListGoodsReceiptsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de recepciones de una orden de compra. */
export class ErpGoodsReceiptPageDto extends pageResponseOf(
  ErpGoodsReceiptItemDto,
  'ErpGoodsReceiptPageDto',
) {}

/** Fila de hojas de servicio de una orden de compra (V38-15). */
export class ServiceEntrySheetItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  sheetNumber!: string;

  @ApiProperty({ format: 'uuid' })
  purchaseOrderId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  supplierBusinessPartnerId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  performedFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  performedTo!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  acceptedByEmployeeId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvalStatusConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de hojas de servicio de una orden de compra. */
export class ListServiceEntrySheetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de hojas de servicio de una orden de compra. */
export class ServiceEntrySheetPageDto extends pageResponseOf(
  ServiceEntrySheetItemDto,
  'ServiceEntrySheetPageDto',
) {}

/** Fila de órdenes de venta (V38-16). */
export class SalesOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  salesOrderNumber!: string;

  @ApiProperty({ format: 'uuid' })
  customerBusinessPartnerId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contractId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  opportunityId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  orderDate!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  requestedServiceDate!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  paymentTermsConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerEmployeeId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de órdenes de venta. */
export class ListSalesOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de órdenes de venta. */
export class SalesOrderPageDto extends pageResponseOf(
  SalesOrderItemDto,
  'SalesOrderPageDto',
) {}
