import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  type AuthenticatedUser,
  type PageResponseDto,
} from '../../../../common';
import { ReadInventoryManagementUseCase } from '../../application/inventory-management/read-inventory-management.use-case';
import {
  InventoryLedgerItemDto,
  InventoryLedgerPageDto,
  InventoryLedgerQueryDto,
  InventoryLocationListDto,
  InventoryLocationsQueryDto,
  InventoryLotItemDto,
  InventoryLotPageDto,
  InventoryLotsQueryDto,
  InventoryPositionItemDto,
  InventoryPositionPageDto,
  InventoryPositionsQueryDto,
} from '../dto';

/**
 * Own inventory of a pharmacy, read-only (locations, positions, ledger and
 * lots). It is the management view: unlike the patient directory it also shows
 * unpublished sites. The scope (session tenant → pharmacy → ids of the query)
 * is resolved by the use case.
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacy')
@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
export class PharmacyInventoryManagementController {
  constructor(private readonly reads: ReadInventoryManagementUseCase) {}

  @Get(':pharmacyId/inventory/locations')
  @ApiOperation({ summary: 'Ubicaciones activas de las sedes de la farmacia' })
  @ApiOkResponse({ type: InventoryLocationListDto })
  locations(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Query() query: InventoryLocationsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InventoryLocationListDto> {
    return this.reads.locations(pharmacyId, query, actor);
  }

  @Get(':pharmacyId/inventory/positions')
  @ApiOperation({
    summary: 'Existencias por sede, ubicación y lote, con su desglose',
  })
  @ApiOkResponse({ type: InventoryPositionPageDto })
  positions(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Query() query: InventoryPositionsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryPositionItemDto>> {
    return this.reads.positions(pharmacyId, query, actor);
  }

  @Get(':pharmacyId/inventory/ledger')
  @ApiOperation({
    summary:
      'Libro de movimientos (kardex), por secuencia de registro, la más reciente primero',
  })
  @ApiOkResponse({ type: InventoryLedgerPageDto })
  ledger(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Query() query: InventoryLedgerQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryLedgerItemDto>> {
    return this.reads.ledger(pharmacyId, query, actor);
  }

  @Get(':pharmacyId/inventory/lots')
  @ApiOperation({
    summary: 'Lotes con su vencimiento, estados y existencia por sede',
  })
  @ApiOkResponse({ type: InventoryLotPageDto })
  lots(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Query() query: InventoryLotsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryLotItemDto>> {
    return this.reads.lots(pharmacyId, query, actor);
  }
}
