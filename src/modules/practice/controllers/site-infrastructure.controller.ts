import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  CareSpacesAdminService,
  ClinicalUnitsAdminService,
  InfrastructureReadService,
  SiteEstablishmentService,
} from '../services';
import {
  BulkCreateCareSpacesDto,
  BulkCreatedDto,
  ClinicalUnitNodeDto,
  CreateDeclaredCapacityDto,
  CreateSiteLicenseDto,
  ImportCareSpacesDto,
  ImportResultDto,
  SiteCapacityDto,
  SiteLicenseDto,
  SiteRegulatoryDto,
  SiteStructureDto,
  UpdateSiteRegulatoryDto,
} from '../dto';

/**
 * Rutas de infraestructura con raíz en una sede (F1, contrato §3). Conviven
 * con `SitesController` (mismo prefijo, rutas distintas). Sin `@Roles`: la
 * autorización por tenant, organización y sucursal es del servicio.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('sites')
export class SiteInfrastructureController {
  constructor(
    private readonly read: InfrastructureReadService,
    private readonly spaces: CareSpacesAdminService,
    private readonly units: ClinicalUnitsAdminService,
    private readonly establishment: SiteEstablishmentService,
  ) {}

  /** Árbol físico y organizativo de la sede, plano con `parentId`. */
  @Get(':siteId/structure')
  @ApiOperation({ summary: 'Estructura de la sede (espacios, unidades, vínculos)' })
  @ApiOkResponse({ type: SiteStructureDto })
  structure(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteStructureDto> {
    return this.read.structure(siteId, actor, requireTenantId());
  }

  /** Alta masiva con patrón; todo o nada, máximo 200. */
  @Audited({ action: 'CARE_SPACES_BULK_CREATED', entity: 'practice_site', entityId: 'param:siteId' })
  @Post(':siteId/care-spaces/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta masiva de espacios por patrón' })
  @ApiCreatedResponse({ type: BulkCreatedDto })
  bulk(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: BulkCreateCareSpacesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkCreatedDto> {
    return this.spaces.bulkCreate(siteId, dto, actor, requireTenantId());
  }

  /** Importación de filas ya parseadas, con validación en seco. */
  @Audited({ action: 'CARE_SPACES_IMPORTED', entity: 'practice_site', entityId: 'param:siteId' })
  @Post(':siteId/care-spaces/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importar espacios (dryRun=true valida sin escribir)' })
  @ApiQuery({ name: 'dryRun', required: false, enum: ['true', 'false'], description: 'Por defecto true' })
  @ApiOkResponse({ type: ImportResultDto })
  importRows(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('dryRun') dryRun: string | undefined,
    @Body() dto: ImportCareSpacesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImportResultDto> {
    return this.spaces.importRows(siteId, dto, dryRun !== 'false', actor, requireTenantId());
  }

  /** Unidades clínicas de la sede. */
  @Get(':siteId/clinical-units')
  @ApiOperation({ summary: 'Listar las unidades clínicas de la sede' })
  @ApiOkResponse({ type: [ClinicalUnitNodeDto] })
  listUnits(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitNodeDto[]> {
    return this.units.list(siteId, actor, requireTenantId());
  }

  /** Datos regulatorios del establecimiento. */
  @Get(':siteId/regulatory')
  @ApiOperation({ summary: 'Datos regulatorios del establecimiento' })
  @ApiOkResponse({ type: SiteRegulatoryDto })
  getRegulatory(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteRegulatoryDto> {
    return this.establishment.getRegulatory(siteId, actor, requireTenantId());
  }

  /** Editar datos regulatorios (409 `TYPOLOGY_CONFLICT`). */
  @Audited({ action: 'SITE_REGULATORY_UPDATED', entity: 'practice_site', entityId: 'param:siteId' })
  @Patch(':siteId/regulatory')
  @ApiOperation({ summary: 'Editar los datos regulatorios del establecimiento' })
  @ApiHeader({ name: 'If-Match', required: false, description: 'rowVersion de la sede; si viene y no coincide: 412' })
  @ApiOkResponse({ type: SiteRegulatoryDto })
  updateRegulatory(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateSiteRegulatoryDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteRegulatoryDto> {
    return this.establishment.updateRegulatory(siteId, dto, ifMatch, actor, requireTenantId());
  }

  /** Verificar el código SNIS (sólo plataforma). */
  @Audited({ action: 'SITE_SNIS_VERIFIED', entity: 'practice_site', entityId: 'param:siteId' })
  @Post(':siteId/regulatory/verify-snis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar el código SNIS del establecimiento (plataforma)' })
  @ApiOkResponse({ type: SiteRegulatoryDto })
  verifySnis(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteRegulatoryDto> {
    return this.establishment.verifySnis(siteId, actor, requireTenantId());
  }

  /** Habilitaciones de la sede. */
  @Get(':siteId/licenses')
  @ApiOperation({ summary: 'Habilitaciones del establecimiento' })
  @ApiOkResponse({ type: [SiteLicenseDto] })
  listLicenses(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteLicenseDto[]> {
    return this.establishment.listLicenses(siteId, actor, requireTenantId());
  }

  /** Registrar una habilitación (nace en trámite). */
  @Audited({ action: 'SITE_LICENSE_CREATED', entity: 'facility_license', entityId: 'result.id' })
  @Post(':siteId/licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una habilitación del establecimiento' })
  @ApiCreatedResponse({ type: SiteLicenseDto })
  createLicense(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateSiteLicenseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteLicenseDto> {
    return this.establishment.createLicense(siteId, dto, actor, requireTenantId());
  }

  /** Capacidad declarada vs. derivada. */
  @Get(':siteId/capacity')
  @ApiOperation({ summary: 'Capacidad declarada vs. derivada del establecimiento' })
  @ApiOkResponse({ type: SiteCapacityDto })
  capacity(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteCapacityDto> {
    return this.establishment.capacity(siteId, actor, requireTenantId());
  }

  /** Declarar capacidad (habilitación, resolución). */
  @Audited({ action: 'SITE_CAPACITY_DECLARED', entity: 'practice_site', entityId: 'param:siteId' })
  @Post(':siteId/declared-capacities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Declarar capacidad del establecimiento' })
  @ApiCreatedResponse({ type: SiteCapacityDto })
  declareCapacity(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateDeclaredCapacityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteCapacityDto> {
    return this.establishment.declareCapacity(siteId, dto, actor, requireTenantId());
  }
}
