import {
  Body,
  Controller,
  Get,
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
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CareSpaceCreationService,
  CareSpaceReadService,
  ClinicalUnitsService,
  SiteCapacityService,
  SiteLicensesService,
  SiteRegulatoryService,
  type DeclaredCapacityView,
  type SiteCapacity,
  type SiteLicenseView,
  type SiteRegulatory,
} from '../services';
import {
  BulkCareSpacesDto,
  CreateSiteLicenseDto,
  DeclareCapacityDto,
  ImportCareSpacesDto,
  UpdateSiteRegulatoryDto,
} from '../dto';
import type {
  CareSpaceDetail,
  ClinicalUnitNode,
  ImportResult,
  SiteStructure,
} from '../dto/infrastructure.types';
import { coerceImportRow } from '../services/infrastructure-import';
import { CorrelationId, IfMatch } from '../http/request-decorators';

/**
 * Estructura, datos regulatorios, habilitaciones y capacidad de un
 * establecimiento (`/sites/:siteId/…`, CONTRATO-F0-F1 §3).
 *
 * Sin `@Roles` salvo la verificación SNIS: la autorización es de organización y
 * sucursal (`StructureAccessService`) y un establecimiento de otro tenant o de
 * otra sucursal del actor responde 404.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('sites')
export class SiteInfrastructureController {
  /**
   * @param reader - Árbol del establecimiento.
   * @param creation - Alta masiva e importación.
   * @param units - Unidades.
   * @param regulatory - Datos regulatorios.
   * @param licenses - Habilitaciones.
   * @param capacity - Capacidad declarada vs derivada.
   */
  constructor(
    private readonly reader: CareSpaceReadService,
    private readonly creation: CareSpaceCreationService,
    private readonly units: ClinicalUnitsService,
    private readonly regulatory: SiteRegulatoryService,
    private readonly licenses: SiteLicensesService,
    private readonly capacity: SiteCapacityService,
  ) {}

  /** Árbol plano del establecimiento (espacios, unidades y vínculos) con `asOf`. */
  @Get(':siteId/structure')
  @ApiOperation({ summary: 'Árbol físico y organizativo del establecimiento' })
  structure(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteStructure> {
    return this.reader.structure(siteId, actor);
  }

  /** Alta masiva por patrón (`301-{A..H}`), todo o nada, máximo 200. */
  @Audited({
    action: 'CARE_SPACES_BULK_CREATED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Post(':siteId/care-spaces/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta masiva de espacios por patrón' })
  bulk(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: BulkCareSpacesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<{ created: CareSpaceDetail[] }> {
    return this.creation.bulk(siteId, dto, actor, correlationId);
  }

  /** Importación con validación en seco; con `dryRun=false` crea todo o nada. */
  @Audited({
    action: 'CARE_SPACES_IMPORTED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Post(':siteId/care-spaces/import')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'dryRun',
    required: false,
    description: 'true (por omisión): valida sin escribir',
  })
  @ApiOperation({
    summary: 'Importar espacios (filas ya parseadas) con dry-run',
  })
  async importRows(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('dryRun') dryRun: string | undefined,
    @Body() dto: ImportCareSpacesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<ImportResult> {
    const coerced = dto.rows.map((raw, index) =>
      coerceImportRow(raw, index + 1),
    );
    return this.creation.import(
      siteId,
      coerced,
      dryRun !== 'false',
      actor,
      correlationId,
    );
  }

  /** Unidades clínicas del establecimiento. */
  @Get(':siteId/clinical-units')
  @ApiOperation({ summary: 'Unidades clínicas del establecimiento' })
  listUnits(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitNode[]> {
    return this.units.list(siteId, actor);
  }

  /** Datos regulatorios (lectura: quien ve el establecimiento). */
  @Get(':siteId/regulatory')
  @ApiOperation({ summary: 'Datos regulatorios del establecimiento' })
  getRegulatory(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteRegulatory> {
    return this.regulatory.get(siteId, actor);
  }

  /** Edita SNIS, subsector, nivel, tipología, red, SEDES y municipio. */
  @Audited({
    action: 'PRACTICE_SITE_REGULATORY_UPDATED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Patch(':siteId/regulatory')
  @ApiHeader({ name: 'If-Match', required: true })
  @ApiOperation({ summary: 'Editar los datos regulatorios (If-Match)' })
  @ApiResponse({
    status: 409,
    description:
      'TYPOLOGY_CONFLICT con la lista de espacios, o SNIS_CODE_UNAVAILABLE',
  })
  patchRegulatory(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateSiteRegulatoryDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SiteRegulatory> {
    return this.regulatory.patch(
      siteId,
      dto,
      expectedVersion,
      actor,
      correlationId,
    );
  }

  /** La plataforma verifica el código SNIS (abre el contexto SYSTEM sólo para esa escritura). */
  @Audited({
    action: 'PRACTICE_SITE_SNIS_VERIFIED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Roles('SECURITY_ADMIN', 'SUPERADMIN')
  @Post(':siteId/snis-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar el código SNIS (sólo plataforma)' })
  verifySnis(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SiteRegulatory> {
    return this.regulatory.verifySnis(siteId, actor, correlationId);
  }

  /** Habilitaciones; el estado vencido se calcula al leer. */
  @Get(':siteId/licenses')
  @ApiOperation({ summary: 'Habilitaciones del establecimiento' })
  listLicenses(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteLicenseView[]> {
    return this.licenses.list(siteId, actor);
  }

  /** Registra una habilitación (sobre `organization_extensions.facility_licenses`). */
  @Audited({
    action: 'SITE_LICENSE_CREATED',
    entity: 'facility_license',
    entityId: 'result.id',
  })
  @Post(':siteId/licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una habilitación' })
  createLicense(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateSiteLicenseDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SiteLicenseView> {
    return this.licenses.create(siteId, dto, actor, correlationId);
  }

  /** Capacidad declarada vs derivada, con brechas y advertencias de tipología. */
  @Get(':siteId/capacity')
  @ApiOperation({ summary: 'Capacidad declarada vs derivada' })
  getCapacity(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteCapacity> {
    return this.capacity.get(siteId, actor);
  }

  /** Agrega una declaración de capacidad (no sobrescribe las anteriores). */
  @Audited({
    action: 'SITE_CAPACITY_DECLARED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Post(':siteId/declared-capacities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Declarar capacidad ante el SEDES' })
  declare(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: DeclareCapacityDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<DeclaredCapacityView & { id: string; validTo: string | null }> {
    return this.capacity.declare(siteId, dto, actor, correlationId);
  }
}
