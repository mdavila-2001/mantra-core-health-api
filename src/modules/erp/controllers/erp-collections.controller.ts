import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ErpCollectionsService } from '../services';
import {
  BusinessPartnerPageDto,
  ContractPageDto,
  ErpGoodsReceiptPageDto,
  ErpPurchaseOrderPageDto,
  ListBusinessPartnersQueryDto,
  ListContractsQueryDto,
  ListGoodsReceiptsQueryDto,
  ListPurchaseOrdersQueryDto,
  ListSalesOrdersQueryDto,
  ListServiceEntrySheetsQueryDto,
  SalesOrderPageDto,
  ServiceEntrySheetPageDto,
} from '../dto';

/**
 * `GET` de colección de `erp` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('erp-collections')
@ApiBearerAuth()
@Controller()
export class ErpCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ErpCollectionsService) {}

  /** V38-02: listar socios comerciales del tenant. */
  @Get('erp/business-partners')
  @Roles('ERP_ADMIN')
  @ApiOperation({ summary: 'Listar socios comerciales del tenant' })
  @ApiOkResponse({ type: BusinessPartnerPageDto })
  listBusinessPartners(
    @Query() query: ListBusinessPartnersQueryDto,
  ): Promise<BusinessPartnerPageDto> {
    return this.collections.listBusinessPartners(query);
  }

  /** V38-04: listar contratos del tenant. */
  @Get('erp/contracts')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @ApiOperation({ summary: 'Listar contratos del tenant' })
  @ApiOkResponse({ type: ContractPageDto })
  listContracts(
    @Query() query: ListContractsQueryDto,
  ): Promise<ContractPageDto> {
    return this.collections.listContracts(query);
  }

  /** V38-13: listar órdenes de compra del tenant. */
  @Get('erp/purchase-orders')
  @Roles('ERP_ADMIN', 'BUYER')
  @ApiOperation({ summary: 'Listar órdenes de compra del tenant' })
  @ApiOkResponse({ type: ErpPurchaseOrderPageDto })
  listPurchaseOrders(
    @Query() query: ListPurchaseOrdersQueryDto,
  ): Promise<ErpPurchaseOrderPageDto> {
    return this.collections.listPurchaseOrders(query);
  }

  /** V38-14: listar recepciones de una orden de compra del tenant. */
  @Get('erp/purchase-orders/:id/goods-receipts')
  @Roles('ERP_ADMIN', 'BUYER', 'WAREHOUSE')
  @ApiOperation({
    summary: 'Listar recepciones de una orden de compra del tenant',
  })
  @ApiOkResponse({ type: ErpGoodsReceiptPageDto })
  listGoodsReceipts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListGoodsReceiptsQueryDto,
  ): Promise<ErpGoodsReceiptPageDto> {
    return this.collections.listGoodsReceipts(id, query);
  }

  /** V38-15: listar hojas de servicio de una orden de compra del tenant. */
  @Get('erp/purchase-orders/:id/service-entry-sheets')
  @Roles('ERP_ADMIN', 'BUYER')
  @ApiOperation({
    summary: 'Listar hojas de servicio de una orden de compra del tenant',
  })
  @ApiOkResponse({ type: ServiceEntrySheetPageDto })
  listServiceEntrySheets(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListServiceEntrySheetsQueryDto,
  ): Promise<ServiceEntrySheetPageDto> {
    return this.collections.listServiceEntrySheets(id, query);
  }

  /** V38-16: listar órdenes de venta del tenant. */
  @Get('erp/sales-orders')
  @Roles('ERP_ADMIN', 'SALES')
  @ApiOperation({ summary: 'Listar órdenes de venta del tenant' })
  @ApiOkResponse({ type: SalesOrderPageDto })
  listSalesOrders(
    @Query() query: ListSalesOrdersQueryDto,
  ): Promise<SalesOrderPageDto> {
    return this.collections.listSalesOrders(query);
  }
}
