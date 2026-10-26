import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
  PharmacyStaffReadService,
  PharmacyOpeningHoursService,
} from '../services';
import {
  CatalogProjectionDto,
  ConnectionResponseDto,
  CreateConnectionDto,
  CreateOnCallShiftDto,
  OnCallShiftDto,
  PharmacyOpeningHoursDto,
  SetOpen24hDto,
  SiteOpeningHoursDto,
  CreateMappingDto,
  CreatePharmacyDto,
  CreatePriceDto,
  CreatePriceListDto,
  CreateProductDto,
  CreateSiteDto,
  MappingResponseDto,
  PharmacyCategoryListDto,
  PharmacyProductReadDto,
  PharmacyResponseDto,
  PriceListResponseDto,
  PriceResponseDto,
  ProductResponseDto,
  SiteResponseDto,
  StatusResultDto,
  UpdateProductDto,
  VerifyLicenseDto,
} from '../dto';

/**
 * Endpoints del módulo Pharmacy (identidad, sedes, catálogo, precios,
 * integración y proyección). Capa fina: valida parámetros y delega en el servicio
 * de dominio. Exigen `SECURITY_ADMIN` o `PHARMACY_STAFF` acotado a su propia
 * farmacia (`PharmacyTenantScopeGuard`); el alta de la farmacia y la verificación
 * de licencias siguen siendo sólo de `SECURITY_ADMIN`.
 */
@ApiTags('pharmacy')
@ApiBearerAuth()
@Controller('pharmacies')
@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
@UseGuards(PharmacyTenantScopeGuard)
export class PharmacyController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param pharmaciesService - Valor de pharmacies service requerido por la operación.
   * @param sitesService - Valor de sites service requerido por la operación.
   * @param productsService - Valor de products service requerido por la operación.
   * @param pricingService - Valor de pricing service requerido por la operación.
   * @param integrationService - Valor de integration service requerido por la operación.
   * @param catalogService - Valor de catalog service requerido por la operación.
   */
  constructor(
    private readonly pharmaciesService: PharmaciesService,
    private readonly sitesService: PharmacySitesService,
    private readonly productsService: PharmacyProductsService,
    private readonly pricingService: PharmacyPricingService,
    private readonly integrationService: PharmacyIntegrationService,
    private readonly catalogService: PharmacyCatalogService,
    private readonly staffReadService: PharmacyStaffReadService,
    private readonly openingHoursService: PharmacyOpeningHoursService,
  ) {}

  /** P47: categorías de la farmacia (el modelo todavía no las guarda: lista vacía). */
  @Get(':pharmacyId/categories')
  @ApiOperation({ summary: 'Categorías de la farmacia (sólo su personal)' })
  @ApiOkResponse({ type: PharmacyCategoryListDto })
  listCategories(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyCategoryListDto> {
    return this.staffReadService.listCategories(pharmacyId, actor);
  }

  /** P34: 24 h y turnos de guardia de cada sede (sólo su personal). */
  @Get(':pharmacyId/opening-hours')
  @ApiOperation({
    summary:
      'Horario declarado de las sedes: 24 h y turnos vigentes y próximos',
    description:
      'Sólo el personal de la farmacia (o la plataforma). Los turnos ya terminados o cancelados no se listan. Las horas vienen en UTC y en la hora local de la sede (`timeZone`, `America/La_Paz` por defecto).',
  })
  @ApiOkResponse({ type: PharmacyOpeningHoursDto })
  getOpeningHours(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyOpeningHoursDto> {
    return this.openingHoursService.getOpeningHours(pharmacyId, actor);
  }

  /** P34: la sede declara (o retira) que abre 24 h. */
  @Audited({
    action: 'PHARMACY_SITE_OPEN_24H_DECLARED',
    entity: 'pharmacy_site',
    entityId: 'param:siteId',
  })
  @Put(':pharmacyId/sites/:siteId/open-24h')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Declarar si la sede abre las 24 horas',
    description:
      '`open24h: null` vuelve a «no declarado». Una sede de otra farmacia responde 404 igual que una inexistente.',
  })
  @ApiOkResponse({ type: SiteOpeningHoursDto })
  setOpen24h(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: SetOpen24hDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteOpeningHoursDto> {
    return this.openingHoursService.setOpen24h(pharmacyId, siteId, dto, actor);
  }

  /** P34: registrar un turno de guardia de la sede. */
  @Audited({
    action: 'PHARMACY_ON_CALL_SHIFT_CREATED',
    entity: 'pharmacy_on_call_shift',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/sites/:siteId/on-call-shifts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un turno de guardia de la sede',
    description:
      'Horas ISO-8601 con desplazamiento obligatorio. Como mucho 72 h, no ya terminado, a no más de 62 días: si no, 422 `ON_CALL_SHIFT_WINDOW_INVALID`. Solapado con otro turno activo de la sede: 409 `ON_CALL_SHIFT_OVERLAP`.',
  })
  @ApiOkResponse({ type: OnCallShiftDto })
  createOnCallShift(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateOnCallShiftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OnCallShiftDto> {
    return this.openingHoursService.createShift(pharmacyId, siteId, dto, actor);
  }

  /** P34: cancelar un turno que todavía no terminó. */
  @Audited({
    action: 'PHARMACY_ON_CALL_SHIFT_CANCELLED',
    entity: 'pharmacy_on_call_shift',
    entityId: 'param:shiftId',
  })
  @Post(':pharmacyId/on-call-shifts/:shiftId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar un turno de guardia (deja de publicarse)',
  })
  @ApiOkResponse({ type: OnCallShiftDto })
  cancelOnCallShift(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OnCallShiftDto> {
    return this.openingHoursService.cancelShift(pharmacyId, shiftId, actor);
  }

  /** UC-24-01. */
  @Audited({
    action: 'PHARMACY_CREATED',
    entity: 'pharmacy',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de farmacia con licencia inicial' })
  createPharmacy(
    @Body() dto: CreatePharmacyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyResponseDto> {
    return this.pharmaciesService.createPharmacy(dto, actor);
  }

  /** UC-24-03. */
  @Audited({
    action: 'PHARMACY_LICENSE_VERIFIED',
    entity: 'pharmacy_license',
    entityId: 'param:licenseId',
  })
  @Post(':pharmacyId/licenses/:licenseId/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar licencia y aprobar farmacia' })
  verifyLicense(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('licenseId', ParseUUIDPipe) licenseId: string,
    @Body() dto: VerifyLicenseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.pharmaciesService.verifyLicense(
      pharmacyId,
      licenseId,
      dto,
      actor,
    );
  }

  /** UC-24-02. */
  @Audited({
    action: 'PHARMACY_SITE_CREATED',
    entity: 'pharmacy_site',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/sites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar sede dispensadora' })
  createSite(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateSiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    return this.sitesService.createSite(pharmacyId, dto, actor);
  }

  /** UC-24-04. */
  @Audited({
    action: 'PHARMACY_PRODUCT_PUBLISHED',
    entity: 'pharmacy_product',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar producto en catálogo con identificadores',
  })
  publishProduct(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    return this.productsService.publishProduct(pharmacyId, dto, actor);
  }

  /** P47 §2. */
  @Audited({
    action: 'PHARMACY_PRODUCT_UPDATED',
    entity: 'pharmacy_product',
    entityId: 'param:productId',
  })
  @Patch(':pharmacyId/products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Editar los datos descriptivos de un producto del catálogo',
    description:
      'Marca, genérico, concentración, empaque y receta: cada uno opcional y `null` lo borra. Precio, categoría, descripción, existencias, estado e imágenes no tienen columna (P47 §3-5) y se rechazan con 400. Un producto retirado responde 422.',
  })
  @ApiOkResponse({ type: PharmacyProductReadDto })
  updateProduct(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmacyProductReadDto> {
    return this.productsService.updateProduct(
      pharmacyId,
      productId,
      dto,
      actor,
    );
  }

  /** UC-24-09. */
  @Audited({
    action: 'PHARMACY_PRODUCT_RETIRED',
    entity: 'pharmacy_product',
    entityId: 'param:productId',
  })
  @Delete(':pharmacyId/products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar (soft-delete) producto del catálogo' })
  retireProduct(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.productsService.retireProduct(pharmacyId, productId, actor);
  }

  /** UC-24-05. */
  @Audited({
    action: 'PHARMACY_PRICE_LIST_CREATED',
    entity: 'pharmacy_price_list',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/price-lists')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear lista de precios (pública / por aseguradora)',
  })
  createPriceList(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreatePriceListDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PriceListResponseDto> {
    return this.pricingService.createPriceList(pharmacyId, dto, actor);
  }

  /** UC-24-06. */
  @Audited({
    action: 'PHARMACY_PRODUCT_PRICE_VERSIONED',
    entity: 'pharmacy_product_price',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/price-lists/:priceListId/prices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Fijar/versionar precio de producto' })
  versionPrice(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('priceListId', ParseUUIDPipe) priceListId: string,
    @Body() dto: CreatePriceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PriceResponseDto> {
    return this.pricingService.versionPrice(
      pharmacyId,
      priceListId,
      dto,
      actor,
    );
  }

  /** UC-24-10. */
  @Audited({
    action: 'PHARMACY_PRICE_LIST_CLOSED',
    entity: 'pharmacy_price_list',
    entityId: 'param:priceListId',
  })
  @Post(':pharmacyId/price-lists/:priceListId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar/expirar lista de precios' })
  closePriceList(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('priceListId', ParseUUIDPipe) priceListId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.pricingService.closePriceList(pharmacyId, priceListId, actor);
  }

  /** UC-24-07. */
  @Audited({
    action: 'PHARMACY_INTEGRATION_CONNECTION_CREATED',
    entity: 'pharmacy_integration_connection',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/integration-connections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Establecer conexión de integración externa' })
  createConnection(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: CreateConnectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConnectionResponseDto> {
    return this.integrationService.createConnection(pharmacyId, dto, actor);
  }

  /** UC-24-08. */
  @Audited({
    action: 'PHARMACY_EXTERNAL_PRODUCT_MAPPED',
    entity: 'pharmacy_external_product_mapping',
    entityId: 'result.id',
  })
  @Post(':pharmacyId/integration-connections/:connId/product-mappings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mapear producto a código de proveedor externo' })
  mapProduct(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connId', ParseUUIDPipe) connId: string,
    @Body() dto: CreateMappingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MappingResponseDto> {
    return this.integrationService.mapProduct(pharmacyId, connId, dto, actor);
  }

  /** UC-24-11. */
  @Audited({
    action: 'PHARMACY_CATALOG_PROJECTED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/projections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Proyectar catálogo y precios a read-model' })
  projectCatalog(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CatalogProjectionDto> {
    return this.catalogService.projectCatalog(pharmacyId, actor);
  }
}
