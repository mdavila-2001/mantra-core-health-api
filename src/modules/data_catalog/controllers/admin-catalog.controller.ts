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
import { Audited } from '../../../common/audit-trail/audit-trail.decorators';
import { ValidationFailedHttp } from './admin-catalog.errors';
import { iso } from '../catalog/timestamps';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import {
  CATALOG_WRITE_ROLES,
  PORTAL_READ_ROLES,
} from '../data_catalog.constants';
import {
  AnnotationIdParamDto,
  AnnotationPatchDto,
  CatalogObjectsQueryDto,
  ClassificationRunDto,
  ColumnIdParamDto,
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
  ClassificationRunResultDto,
  CatalogObjectsPageDto,
  ChangesPageDto,
  EvidenceDto,
  ImpactDto,
  PermissionDriftDto,
  ScanAcceptedDto,
  ScanDto,
  ScansPageDto,
  SchemaSummaryDto,
} from '../dto/catalog-response.dto';
import { CatalogClassificationService } from '../services/catalog-classification.service';
import { CatalogGovernanceService } from '../services/catalog-governance.service';
import { CatalogReadService } from '../services/catalog-read.service';
import { CatalogScanService } from '../services/catalog-scan.service';
import { PermissionDriftService } from '../services/permission-drift.service';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Catálogo de datos **vivo**: lo que un escaneo de `pg_catalog` observa de la base primaria y lo
 * que el equipo de datos curó encima (fichas, evidencia, revisiones).
 *
 * Lecturas para los roles de lectura del portal; escrituras y escaneos sólo para
 * `CATALOG_WRITE_ROLES`. Fuera de cualquier tenant: son datos de la
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
    private readonly classification: CatalogClassificationService,
    private readonly drift: PermissionDriftService,
  ) {}

  @Get('schemas')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
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
    summary: 'Objetos del catálogo, paginados por cursor',
  })
  @ApiResponse({ status: 200, type: CatalogObjectsPageDto })
  objects(@Query() q: CatalogObjectsQueryDto) {
    return this.read.objects(q);
  }

  @Get('objects/:id')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
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
    summary: 'Columnas observadas de un objeto, con su ficha si la tienen',
  })
  @ApiResponse({ status: 200, type: CatalogColumnsDto })
  columns(@Param() p: ObjectIdParamDto) {
    return this.read.columns(p.id);
  }

  @Get('objects/:id/evidence')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Evidencia enlazada a un objeto',
  })
  @ApiResponse({ status: 200, type: [EvidenceDto] })
  evidence(@Param() p: ObjectIdParamDto) {
    return this.read.evidence(p.id);
  }

  @Audited({
    action: 'CATALOG_EVIDENCE_ADDED',
    entity: 'catalog_evidence_item',
    entityId: 'result.id',
  })
  @Post('objects/:id/evidence')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
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

  @Get('columns/:id/evidence')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Evidencia enlazada a una columna',
  })
  @ApiResponse({ status: 200, type: [EvidenceDto] })
  @ApiResponse({ status: 404, description: 'No existe la columna' })
  columnEvidence(@Param() p: ColumnIdParamDto) {
    return this.read.columnEvidence(p.id);
  }

  @Audited({
    action: 'CATALOG_EVIDENCE_ADDED',
    entity: 'catalog_evidence_item',
    entityId: 'result.id',
  })
  @Post('columns/:id/evidence')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enlaza evidencia a una columna',
  })
  @ApiResponse({ status: 201, type: EvidenceDto })
  @ApiResponse({ status: 404, description: 'No existe la columna' })
  addColumnEvidence(
    @Param() p: ColumnIdParamDto,
    @Body() dto: EvidenceInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.governance.addColumnEvidence(actor.id, p.id, dto);
  }

  @Get('objects/:id/history')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Revisiones y decisiones de la ficha de un objeto',
  })
  @ApiResponse({ status: 200, type: AnnotationHistoryDto })
  history(@Param() p: ObjectIdParamDto) {
    return this.read.history(p.id);
  }

  @Get('objects/:id/changes')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Cambios que los escaneos detectaron en un objeto',
  })
  @ApiResponse({ status: 200, type: ChangesPageDto })
  changes(@Param() p: ObjectIdParamDto, @Query() q: CursorQueryDto) {
    return this.read.changes(p.id, q);
  }

  @Get('objects/:id/impact')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary:
      'Quién referencia a un objeto y a quién referencia, por claves foráneas observadas',
  })
  @ApiResponse({ status: 200, type: ImpactDto })
  impact(@Param() p: ObjectIdParamDto, @Query() q: ImpactQueryDto) {
    return this.read.impact(p.id, q);
  }

  @Audited({
    action: 'CATALOG_ANNOTATION_SAVED',
    entity: 'catalog_annotation',
    entityId: 'result.id',
  })
  @Put('objects/:id/annotation')
  @Roles(...CATALOG_WRITE_ROLES)
  @ApiOperation({
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

  @Audited({
    action: 'CATALOG_ANNOTATION_SAVED',
    entity: 'catalog_annotation',
    entityId: 'result.id',
  })
  @Put('columns/:id/annotation')
  @Roles(...CATALOG_WRITE_ROLES)
  @ApiOperation({
    summary:
      'Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED',
  })
  @ApiResponse({ status: 200, type: AnnotationDto })
  @ApiResponse({ status: 404, description: 'No existe la columna' })
  @ApiResponse({
    status: 409,
    description: 'La ficha cambió desde que se leyó (`CONCURRENCY_CONFLICT`)',
  })
  @ApiResponse({
    status: 422,
    description:
      'No puede enviarse a revisión: falta la definición (`VALIDATION_FAILED`, `details.violations`)',
  })
  saveColumnAnnotation(
    @Param() p: ColumnIdParamDto,
    @Body() dto: AnnotationPatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.governance.saveColumnAnnotation(actor.id, p.id, dto);
  }

  @Audited({
    action: 'CATALOG_ANNOTATION_REVIEWED',
    entity: 'catalog_annotation',
    entityId: 'param:id',
  })
  @Post('annotations/:id/review')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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

  @Audited({
    action: 'CATALOG_CLASSIFICATION_RUN',
    entity: 'catalog_annotation',
  })
  @Post('classification/run')
  @Roles(...CATALOG_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Corre la clasificación automática de sensibilidad sobre las columnas observadas',
    description:
      'Crea fichas de columna en AUTO_DETECTED (certeza) o NEEDS_REVIEW (duda). Nunca baja un nivel ni pisa fichas escritas por una persona o que ya salieron de AUTO_DETECTED.',
  })
  @ApiResponse({ status: 200, type: ClassificationRunResultDto })
  runClassification(
    @Body() dto: ClassificationRunDto,
  ): Promise<ClassificationRunResultDto> {
    return this.classification.run(dto.schema);
  }

  @Get('permission-drift')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary:
      'Deriva de permisos: roles que las rutas exigen contra los que la API siembra',
    description:
      'Compara los `@Roles(...)` de todas las rutas (leídos al arrancar) con los roles de los `*.roles.ts` y con `authz.roles`: roles usados sin sembrar, sembrados sin usar y rutas autenticadas sin `@Roles`.',
  })
  @ApiResponse({ status: 200, type: PermissionDriftDto })
  permissionDrift() {
    return this.drift.report();
  }

  @Get('coverage')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Cobertura del catálogo por dimensión, calculada por el servidor',
  })
  @ApiResponse({ status: 200, type: CatalogCoverageDto })
  coverage(@Query() q: CoverageQueryDto) {
    return this.read.coverage(q);
  }

  @Get('scans')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({
    summary: 'Escaneos, del más reciente al más antiguo',
  })
  @ApiResponse({ status: 200, type: ScansPageDto })
  listScans(@Query() q: CursorQueryDto) {
    return this.read.scans(q);
  }

  @Get('scans/:id')
  @Roles(...PORTAL_READ_ROLES)
  @ApiOperation({ summary: 'Un escaneo' })
  @ApiResponse({ status: 200, type: ScanDto })
  scan(@Param() p: ObjectIdParamDto) {
    return this.read.scan(p.id);
  }

  @Audited({
    action: 'DATA_CATALOG_SCAN_REQUESTED',
    entity: 'catalog_scan_run',
    entityId: 'result.id',
  })
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
      acceptedAt: iso(scan.requested_at),
      statusUrl: `/admin/catalog/scans/${scan.id}`,
    };
  }
}
