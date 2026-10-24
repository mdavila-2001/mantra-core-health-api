import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  BusinessPartners,
  Contracts,
  GoodsReceipts,
  PurchaseOrders,
  SalesOrders,
  ServiceEntrySheets,
} from '../entities';
import type {
  BusinessPartnerItemDto,
  ContractItemDto,
  ErpGoodsReceiptItemDto,
  ErpPurchaseOrderItemDto,
  ListBusinessPartnersQueryDto,
  ListContractsQueryDto,
  ListGoodsReceiptsQueryDto,
  ListPurchaseOrdersQueryDto,
  ListSalesOrdersQueryDto,
  ListServiceEntrySheetsQueryDto,
  SalesOrderItemDto,
  ServiceEntrySheetItemDto,
} from '../dto';

/**
 * Lecturas de colección de `erp`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ErpCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar socios comerciales del tenant (V38-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listBusinessPartners(
    query: ListBusinessPartnersQueryDto,
  ): Promise<PageResponseDto<BusinessPartnerItemDto>> {
    return listTenantCollection(this.em.fork(), BusinessPartners, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): BusinessPartnerItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        partnerNumber: row.partnerNumber,
        partnerCategoryConceptId: row.partnerCategoryConceptId,
        displayName: row.displayName,
        legalName: row.legalName ?? null,
        taxId: row.taxId ?? null,
        countryConceptId: row.countryConceptId ?? null,
        linkedTenantId: row.linkedTenantId ?? null,
        linkedPersonId: row.linkedPersonId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar contratos del tenant (V38-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listContracts(
    query: ListContractsQueryDto,
  ): Promise<PageResponseDto<ContractItemDto>> {
    return listTenantCollection(this.em.fork(), Contracts, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ContractItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        contractNumber: row.contractNumber,
        contractTypeConceptId: row.contractTypeConceptId,
        title: row.title,
        description: row.description ?? null,
        counterpartyTypeConceptId: row.counterpartyTypeConceptId,
        counterpartyRefType: row.counterpartyRefType ?? null,
        counterpartyRefId: row.counterpartyRefId ?? null,
        counterpartyName: row.counterpartyName ?? null,
        startDate: row.startDate,
        endDate: row.endDate ?? null,
        renewalTypeConceptId: row.renewalTypeConceptId ?? null,
        noticePeriodDays: row.noticePeriodDays ?? null,
        totalValue: row.totalValue ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        governingJurisdictionConceptId:
          row.governingJurisdictionConceptId ?? null,
        ownerUserId: row.ownerUserId ?? null,
        primaryBusinessPartnerId: row.primaryBusinessPartnerId ?? null,
        currentVersionId: row.currentVersionId ?? null,
        parentContractId: row.parentContractId ?? null,
        masterAgreementId: row.masterAgreementId ?? null,
        owningDepartmentId: row.owningDepartmentId ?? null,
        owningCostCenterId: row.owningCostCenterId ?? null,
        owningProfitCenterId: row.owningProfitCenterId ?? null,
        approvalStatusConceptId: row.approvalStatusConceptId ?? null,
        signatureStatusConceptId: row.signatureStatusConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar órdenes de compra del tenant (V38-13).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPurchaseOrders(
    query: ListPurchaseOrdersQueryDto,
  ): Promise<PageResponseDto<ErpPurchaseOrderItemDto>> {
    return listTenantCollection(this.em.fork(), PurchaseOrders, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ErpPurchaseOrderItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        purchaseOrderNumber: row.purchaseOrderNumber,
        supplierBusinessPartnerId: row.supplierBusinessPartnerId,
        contractId: row.contractId ?? null,
        purchaseRequisitionId: row.purchaseRequisitionId ?? null,
        orderingDepartmentId: row.orderingDepartmentId ?? null,
        buyerEmployeeId: row.buyerEmployeeId ?? null,
        orderDate: row.orderDate ?? null,
        expectedDeliveryDate: row.expectedDeliveryDate ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        paymentTermsConceptId: row.paymentTermsConceptId ?? null,
        incotermConceptId: row.incotermConceptId ?? null,
        approvalStatusConceptId: row.approvalStatusConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar recepciones de una orden de compra del tenant (V38-14).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listGoodsReceipts(
    id: string,
    query: ListGoodsReceiptsQueryDto,
  ): Promise<PageResponseDto<ErpGoodsReceiptItemDto>> {
    return listTenantCollection(this.em.fork(), GoodsReceipts, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        purchaseOrderId: id,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ErpGoodsReceiptItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        receiptNumber: row.receiptNumber,
        purchaseOrderId: row.purchaseOrderId,
        receivingBranchId: row.receivingBranchId ?? null,
        receivedByEmployeeId: row.receivedByEmployeeId ?? null,
        receivedAt: row.receivedAt ?? null,
        supplierDeliveryReference: row.supplierDeliveryReference ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar hojas de servicio de una orden de compra del tenant (V38-15).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listServiceEntrySheets(
    id: string,
    query: ListServiceEntrySheetsQueryDto,
  ): Promise<PageResponseDto<ServiceEntrySheetItemDto>> {
    return listTenantCollection(this.em.fork(), ServiceEntrySheets, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        purchaseOrderId: id,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ServiceEntrySheetItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        sheetNumber: row.sheetNumber,
        purchaseOrderId: row.purchaseOrderId,
        supplierBusinessPartnerId: row.supplierBusinessPartnerId ?? null,
        performedFrom: row.performedFrom ?? null,
        performedTo: row.performedTo ?? null,
        acceptedByEmployeeId: row.acceptedByEmployeeId ?? null,
        approvalStatusConceptId: row.approvalStatusConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar órdenes de venta del tenant (V38-16).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listSalesOrders(
    query: ListSalesOrdersQueryDto,
  ): Promise<PageResponseDto<SalesOrderItemDto>> {
    return listTenantCollection(this.em.fork(), SalesOrders, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): SalesOrderItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        salesOrderNumber: row.salesOrderNumber,
        customerBusinessPartnerId: row.customerBusinessPartnerId,
        contractId: row.contractId ?? null,
        opportunityId: row.opportunityId ?? null,
        orderDate: row.orderDate ?? null,
        requestedServiceDate: row.requestedServiceDate ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        paymentTermsConceptId: row.paymentTermsConceptId ?? null,
        ownerEmployeeId: row.ownerEmployeeId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
