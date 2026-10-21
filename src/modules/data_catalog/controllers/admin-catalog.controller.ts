import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ValidationFailedHttp } from './admin-catalog.errors';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import {
  CATALOG_WRITE_ROLES,
  PORTAL_READ_ROLES,
} from '../data_catalog.constants';
import {
  AnnotationIdParamDto,
  AnnotationPatchDto,
  CatalogObjectsQueryDto,
  CoverageQueryDto,
  CursorQueryDto,
  EvidenceInputDto,
  ImpactQueryDto,
  ObjectIdParamDto,
  ReviewInputDto,
} from '../dto/catalog-request.dto';
import {
  AnnotationDto,
  AnnotationHistoryDto,
  CatalogColumnsDto,
  CatalogCoverageDto,
  CatalogObjectDetailDto,
  CatalogObjectsPageDto,
  ChangesPageDto,
  EvidenceDto,
  ImpactDto,
  ScanAcceptedDto,
  ScanDto,
  ScansPageDto,
  SchemaSummaryDto,
} from '../dto/catalog-response.dto';
import { CatalogGovernanceService } from '../services/catalog-governance.service';
import { CatalogReadService } from '../services/catalog-read.service';
import { CatalogScanService } from '../services/catalog-scan.service';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Catálogo de datos **vivo**: lo que un escaneo de `pg_catalog` observa de la base primaria y lo
 * que el equipo de datos curó encima (fichas, evidencia, revisiones).
 *
 * Lecturas para los cinco roles del catálogo; escrituras y escaneos sólo para
 * `GOVERNANCE_ADMIN` y `DATA_PLATFORM_ADMIN`. Fuera de cualquier tenant: son datos de la
 * plataforma. La autorización la decide esta API, no la pantalla.
 */
@ApiTags('admin-catalog')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(
    private readonly read: CatalogReadService,
    private readonly governance: CatalogGovernanceService,
    private readonly scans: CatalogScanService,
  ) {}

  @Get('schemas')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListSchemas',
    summary:
      'Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados',
  })
  @ApiResponse({ status: 200, type: [SchemaSummaryDto] })
  schemas() {
    return this.read.schemas();
  }

  @Get('objects')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListObjects',
    summary: 'Objetos del catálogo, paginados por cursor',
  })
  @ApiResponse({ status: 200, type: CatalogObjectsPageDto })
  objects(@Query() q: CatalogObjectsQueryDto) {
    return this.read.objects(q);
  }

  @Get('objects/:id')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogGetObject',
    summary:
      'Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto',
  })
  @ApiResponse({ status: 200, type: CatalogObjectDetailDto })
  @ApiResponse({ status: 404, description: 'No existe el objeto' })
  object(@Param() p: ObjectIdParamDto) {
    return this.read.objectDetail(p.id);
  }

  @Get('objects/:id/columns')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListColumns',
    summary: 'Columnas observadas de un objeto, con su ficha si la tienen',
  })
  @ApiResponse({ status: 200, type: CatalogColumnsDto })
  columns(@Param() p: ObjectIdParamDto) {
    return this.read.columns(p.id);
  }

  @Get('objects/:id/evidence')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListEvidence',
    summary: 'Evidencia enlazada a un objeto',
  })
  @ApiResponse({ status: 200, type: [EvidenceDto] })
  evidence(@Param() p: ObjectIdParamDto) {
    return this.read.evidence(p.id);
  }

  @Post('objects/:id/evidence')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'adminCatalogAddEvidence',
    summary: 'Enlaza evidencia a un objeto',
  })
  @ApiResponse({ status: 201, type: EvidenceDto })
  addEvidence(
    @Param() p: ObjectIdParamDto,
    @Body() dto: EvidenceInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.governance.addEvidence(actor.id, p.id, dto);
  }

  @Get('objects/:id/history')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogGetHistory',
    summary: 'Revisiones y decisiones de la ficha de un objeto',
  })
  @ApiResponse({ status: 200, type: AnnotationHistoryDto })
  history(@Param() p: ObjectIdParamDto) {
    return this.read.history(p.id);
  }

  @Get('objects/:id/changes')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListChanges',
    summary: 'Cambios que los escaneos detectaron en un objeto',
  })
  @ApiResponse({ status: 200, type: ChangesPageDto })
  changes(@Param() p: ObjectIdParamDto, @Query() q: CursorQueryDto) {
    return this.read.changes(p.id, q);
  }

  @Get('objects/:id/impact')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogGetImpact',
    summary:
      'Quién referencia a un objeto y a quién referencia, por claves foráneas observadas',
  })
  @ApiResponse({ status: 200, type: ImpactDto })
  impact(@Param() p: ObjectIdParamDto, @Query() q: ImpactQueryDto) {
    return this.read.impact(p.id, q);
  }

  @Put('objects/:id/annotation')
  @Roles(...CATALOG_WRITE_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogSaveAnnotation',
    summary: 'Crea o edita la ficha de un objeto (con versión esperada)',
  })
  @ApiResponse({ status: 200, type: AnnotationDto })
  @ApiResponse({
    status: 409,
    description: 'La ficha cambió desde que se leyó (`CONCURRENCY_CONFLICT`)',
  })
  @ApiResponse({
    status: 422,
    description:
      'No puede enviarse a revisión: faltan respuestas (`VALIDATION_FAILED`, `details.violations`)',
  })
  saveAnnotation(
    @Param() p: ObjectIdParamDto,
    @Body() dto: AnnotationPatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.governance.saveAnnotation(actor.id, p.id, dto);
  }

  @Post('annotations/:id/review')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'adminCatalogReviewAnnotation',
    summary: 'Aprueba o rechaza la revisión vigente de una ficha',
  })
  @ApiResponse({ status: 200, type: AnnotationDto })
  @ApiResponse({
    status: 403,
    description: 'Quien escribió la revisión no la decide (`SELF_REVIEW`)',
  })
  @ApiResponse({
    status: 409,
    description: 'Hay una revisión más reciente que la revisada',
  })
  @ApiResponse({
    status: 422,
    description: 'No está en revisión, falta evidencia o el rechazo no explica',
  })
  review(
    @Param() p: AnnotationIdParamDto,
    @Body() dto: ReviewInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.governance.review(actor.id, p.id, dto);
  }

  @Get('coverage')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogGetCoverage',
    summary: 'Cobertura del catálogo por dimensión, calculada por el servidor',
  })
  @ApiResponse({ status: 200, type: CatalogCoverageDto })
  coverage(@Query() q: CoverageQueryDto) {
    return this.read.coverage(q);
  }

  @Get('scans')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    operationId: 'adminCatalogListScans',
    summary: 'Escaneos, del más reciente al más antiguo',
  })
  @ApiResponse({ status: 200, type: ScansPageDto })
  listScans(@Query() q: CursorQueryDto) {
    return this.read.scans(q);
  }

  @Get('scans/:id')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({ operationId: 'adminCatalogGetScan', summary: 'Un escaneo' })
  @ApiResponse({ status: 200, type: ScanDto })
  scan(@Param() p: ObjectIdParamDto) {
    return this.read.scan(p.id);
  }

  @Post('scans')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      '8–128 caracteres; la misma clave del mismo usuario devuelve el escaneo ya aceptado',
  })
  @ApiOperation({
    operationId: 'adminCatalogRequestScan',
    summary:
      'Pide un escaneo de la base primaria (se ejecuta fuera de la petición)',
  })
  @ApiResponse({ status: 202, type: ScanAcceptedDto })
  @ApiResponse({
    status: 409,
    description: 'Ya hay un escaneo en curso de esta fuente',
  })
  async requestScan(
    @Headers('idempotency-key') key: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScanAcceptedDto> {
    if (!key || !IDEMPOTENCY_KEY.test(key))
      throw ValidationFailedHttp(
        'Idempotency-Key',
        'La cabecera Idempotency-Key es obligatoria (8–128 caracteres: letras, números, . _ : -)',
      );
    const { scan, created } = await this.scans.request(actor.id, key);
    return {
      scanId: scan.id,
      status: scan.status,
      created,
      acceptedAt: scan.requested_at,
      statusUrl: `/admin/catalog/scans/${scan.id}`,
    };
  }
}
