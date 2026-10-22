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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
  PharmacyStaffReadService,
} from '../services';
import {
  CatalogProjectionDto,
  ConnectionResponseDto,
  CreateConnectionDto,
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

  /** UC-24-01. */
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
