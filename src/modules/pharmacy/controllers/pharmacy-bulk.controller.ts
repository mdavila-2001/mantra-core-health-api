import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { BulkRequestDto, BulkResponseDto } from '../dto';
import { PharmacyBulkService } from '../services/pharmacy-bulk.service';
import { CategoriesBulkHandler } from '../services/bulk/categories.bulk-handler';
import { PricesBulkHandler } from '../services/bulk/prices.bulk-handler';
import { ProductsBulkHandler } from '../services/bulk/products.bulk-handler';
import { SitesBulkHandler } from '../services/bulk/sites.bulk-handler';
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';

/**
 * Carga masiva del catálogo de la farmacia (FAR-05): categorías, productos,
 * precios y sucursales, hasta 1000 filas por pedido y con vista previa
 * (`dryRun`). Mismo acceso que el resto del catálogo: `SECURITY_ADMIN` o el
 * personal de esa farmacia (`PharmacyTenantScopeGuard`). Responde 200 aunque
 * haya filas rechazadas: el resultado de cada una viaja en `results`. Una vista
 * previa se audita como `*_BULK_PREVIEWED`, no como la carga que simula.
 */
@ApiTags('pharmacy')
@ApiBearerAuth()
@Controller('pharmacies')
@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
@UseGuards(PharmacyTenantScopeGuard)
export class PharmacyBulkController {
  constructor(
    private readonly bulk: PharmacyBulkService,
    private readonly categories: CategoriesBulkHandler,
    private readonly products: ProductsBulkHandler,
    private readonly prices: PricesBulkHandler,
    private readonly sites: SitesBulkHandler,
  ) {}

  @Audited({
    action: 'PHARMACY_CATEGORIES_BULK_LOADED',
    dryRunAction: 'PHARMACY_CATEGORIES_BULK_PREVIEWED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/categories/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar categorías en lote, con vista previa' })
  @ApiOkResponse({ type: BulkResponseDto })
  bulkCategories(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: BulkRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    return this.bulk.run('categories', pharmacyId, dto, this.categories, actor);
  }

  @Audited({
    action: 'PHARMACY_PRODUCTS_BULK_LOADED',
    dryRunAction: 'PHARMACY_PRODUCTS_BULK_PREVIEWED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/products/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar productos en lote, con vista previa' })
  @ApiOkResponse({ type: BulkResponseDto })
  bulkProducts(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: BulkRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    return this.bulk.run('products', pharmacyId, dto, this.products, actor);
  }

  @Audited({
    action: 'PHARMACY_PRICES_BULK_LOADED',
    dryRunAction: 'PHARMACY_PRICES_BULK_PREVIEWED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/prices/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cargar precios de venta en lote, con vista previa',
  })
  @ApiOkResponse({ type: BulkResponseDto })
  bulkPrices(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: BulkRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    return this.bulk.run('prices', pharmacyId, dto, this.prices, actor);
  }

  @Audited({
    action: 'PHARMACY_SITES_BULK_LOADED',
    dryRunAction: 'PHARMACY_SITES_BULK_PREVIEWED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/sites/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cargar sucursales (sedes de venta) en lote, con vista previa',
  })
  @ApiOkResponse({ type: BulkResponseDto })
  bulkSites(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: BulkRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    return this.bulk.run('sites', pharmacyId, dto, this.sites, actor);
  }
}
