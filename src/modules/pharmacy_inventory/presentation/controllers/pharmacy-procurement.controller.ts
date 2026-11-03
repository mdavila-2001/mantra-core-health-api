import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { PharmacyProcurementService } from '../../services';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
  IdResponseDto,
  PurchaseOrderResponseDto,
  GoodsReceiptResponseDto,
} from '../dto';

/**
 * Aprovisionamiento de farmacia: proveedores, órdenes de compra (UC-25-01) y
 * recepción de mercancía (UC-25-02). Capa fina que delega en el servicio.
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacy')
export class PharmacyProcurementController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param procurement - Valor de procurement requerido por la operación.
   */
  constructor(private readonly procurement: PharmacyProcurementService) {}

  /** Bootstrap: alta de proveedor. */
  @Audited({
    action: 'PHARMACY_SUPPLIER_CREATED',
    entity: 'pharmacy_supplier',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/suppliers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un proveedor de farmacia' })
  createSupplier(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.procurement.createSupplier(pharmacyId, dto, actor);
  }

  /** UC-25-01: emitir orden de compra. */
  @Audited({
    action: 'PHARMACY_PURCHASE_ORDER_CREATED',
    entity: 'pharmacy_purchase_order',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/purchase-orders')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir una orden de compra a proveedor (UC-25-01)',
  })
  createPurchaseOrder(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.procurement.createPurchaseOrder(pharmacyId, dto, actor);
  }

  /** UC-25-02: recepción de mercancía por lote. */
  @Audited({
    action: 'PHARMACY_GOODS_RECEIVED',
    entity: 'pharmacy_goods_receipt',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/goods-receipts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Recepcionar mercancía por lote (UC-25-02)' })
  receiveGoods(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GoodsReceiptResponseDto> {
    return this.procurement.receiveGoods(pharmacyId, dto, actor);
  }
}
