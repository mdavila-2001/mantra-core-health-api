import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  PharmaciesService,
  PharmacySitesService,
  PharmacyProductsService,
  PharmacyPricingService,
  PharmacyIntegrationService,
  PharmacyCatalogService,
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
  PharmacyResponseDto,
  PriceListResponseDto,
  PriceResponseDto,
  ProductResponseDto,
  SiteResponseDto,
  StatusResultDto,
  VerifyLicenseDto,
} from '../dto';

/**
 * Endpoints del módulo Pharmacy (identidad, sedes, catálogo, precios,
 * integración y proyección). Capa fina: valida parámetros y delega en el servicio
 * de dominio. Todas las operaciones exigen rol `SECURITY_ADMIN` (guard global).
 */
@ApiTags('pharmacy')
@ApiBearerAuth()
@Controller('pharmacies')
@Roles('SECURITY_ADMIN')
export class PharmacyController {
  constructor(
    private readonly pharmaciesService: PharmaciesService,
    private readonly sitesService: PharmacySitesService,
    private readonly productsService: PharmacyProductsService,
    private readonly pricingService: PharmacyPricingService,
    private readonly integrationService: PharmacyIntegrationService,
    private readonly catalogService: PharmacyCatalogService,
  ) {}

  /** UC-24-01. */
  @Post()
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
