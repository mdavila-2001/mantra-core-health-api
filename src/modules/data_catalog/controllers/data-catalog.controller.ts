import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CATALOG_EDIT_ROLES,
  CATALOG_READ_ROLES,
  CATALOG_REVIEW_ROLES,
  CATALOG_SCAN_ROLES,
} from '../data-catalog.roles';
import {
  AddEvidenceDto,
  CoverageQueryDto,
  CursorQueryDto,
  ImpactQueryDto,
  ListObjectsQueryDto,
  ReviewAnnotationDto,
  ScanAcceptedDto,
  ScanViewDto,
  UpsertAnnotationDto,
} from '../dto';
import {
  CatalogAnnotationsService,
  CatalogQueryService,
  CatalogScanService,
  scanView,
} from '../services';

/**
 * Catálogo de datos del portal administrativo: qué tablas y columnas existen,
 * por qué existen, quién responde por ellas y con qué evidencia.
 *
 * Capa fina: valida, autoriza por rol y delega. Las reglas (segregación,
 * relleno, versiones) viven en el dominio y los servicios.
 */
@ApiTags('data-catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
export class DataCatalogController {
  constructor(
    private readonly query: CatalogQueryService,
    private readonly annotations: CatalogAnnotationsService,
    private readonly scans: CatalogScanService,
  ) {}

  // -------------------------------------------------------------- inventario

  @Get('schemas')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Resumen por schema del alcance observado' })
  listSchemas() {
    return this.query.listSchemas();
  }

  @Get('objects')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Inventario de tablas y vistas, con estado de su ficha',
  })
  listObjects(@Query() query: ListObjectsQueryDto) {
    return this.query.listObjects(query);
  }

  @Get('objects/:objectId')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Ficha técnica, de negocio, cobertura y gobierno de un objeto',
  })
  getObject(@Param('objectId', ParseUUIDPipe) objectId: string) {
    return this.query.getObject(objectId);
  }

  @Get('objects/:objectId/columns')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Columnas observadas y sus fichas' })
  listColumns(@Param('objectId', ParseUUIDPipe) objectId: string) {
    return this.query.listColumns(objectId);
  }

  @Get('objects/:objectId/changes')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Historial técnico (cambios detectados por escaneos)',
  })
  listObjectChanges(
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Query() page: CursorQueryDto,
  ) {
    return this.query.listObjectChanges(objectId, page.cursor, page.limit);
  }

  @Get('objects/:objectId/impact')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary:
      'Impacto estructural (FK observadas): qué depende de la tabla y de qué depende',
    description:
      'Profundidad máx. 5 y 200 nodos; declara truncamiento y alcance. Una FK no es un flujo de datos.',
  })
  impact(
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Query() query: ImpactQueryDto,
  ) {
    return this.query.impact(objectId, query.direction, query.depth);
  }

  @Get('objects/:objectId/history')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Revisiones y decisiones de la ficha de la tabla' })
  objectHistory(@Param('objectId', ParseUUIDPipe) objectId: string) {
    return this.annotations.historyForObject(objectId);
  }

  @Get('columns/:columnId/history')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Revisiones y decisiones de la ficha de una columna',
  })
  columnHistory(@Param('columnId', ParseUUIDPipe) columnId: string) {
    return this.annotations.historyForColumn(columnId);
  }

  // ------------------------------------------------------------------ fichas

  @Put('objects/:objectId/annotation')
  @Roles(...CATALOG_EDIT_ROLES)
  @ApiOperation({
    summary:
      'Crear o editar la ficha de una tabla (expectedVersion obligatorio)',
    description:
      '409 si la ficha cambió desde que se leyó; 422 si falta un campo obligatorio al enviar a revisión o el texto es relleno.',
  })
  upsertObjectAnnotation(
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Body() dto: UpsertAnnotationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annotations.upsertForObject(objectId, dto, actor);
  }

  @Put('columns/:columnId/annotation')
  @Roles(...CATALOG_EDIT_ROLES)
  @ApiOperation({ summary: 'Crear o editar la ficha de una columna' })
  upsertColumnAnnotation(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: UpsertAnnotationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annotations.upsertForColumn(columnId, dto, actor);
  }

  @Post('annotations/:annotationId/review')
  @Roles(...CATALOG_REVIEW_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar o rechazar la revisión vigente de una ficha',
    description:
      '403 si quien revisa escribió la revisión; 409 si hay una revisión más reciente; 422 sin evidencia o sin comentario de rechazo.',
  })
  review(
    @Param('annotationId', ParseUUIDPipe) annotationId: string,
    @Body() dto: ReviewAnnotationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annotations.review(annotationId, dto, actor);
  }

  // --------------------------------------------------------------- evidencia

  @Get('objects/:objectId/evidence')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Evidencia de la tabla' })
  listObjectEvidence(@Param('objectId', ParseUUIDPipe) objectId: string) {
    return this.annotations.listEvidenceForObject(objectId);
  }

  @Post('objects/:objectId/evidence')
  @Roles(...CATALOG_EDIT_ROLES)
  @ApiOperation({ summary: 'Enlazar evidencia a la tabla' })
  addObjectEvidence(
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Body() dto: AddEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annotations.addEvidenceToObject(objectId, dto, actor);
  }

  @Get('columns/:columnId/evidence')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Evidencia de una columna' })
  listColumnEvidence(@Param('columnId', ParseUUIDPipe) columnId: string) {
    return this.annotations.listEvidenceForColumn(columnId);
  }

  @Post('columns/:columnId/evidence')
  @Roles(...CATALOG_EDIT_ROLES)
  @ApiOperation({ summary: 'Enlazar evidencia a una columna' })
  addColumnEvidence(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: AddEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annotations.addEvidenceToColumn(columnId, dto, actor);
  }

  // --------------------------------------------------------------- cobertura

  @Get('coverage')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary:
      'Cobertura explicada por dimensión (técnica, semántica, owner, sensibilidad, revisión)',
    description:
      'UNKNOWN sin escaneo terminado; NOT_APPLICABLE con denominador cero. Nunca un porcentaje inventado.',
  })
  coverage(@Query() query: CoverageQueryDto) {
    return this.query.coverage(query.schema);
  }

  // ---------------------------------------------------------------- escaneos

  @Post('scans')
  @Roles(...CATALOG_SCAN_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary: 'Solicitar un escaneo técnico (202 tras aceptación durable)',
    description:
      'El worker data_catalog lo ejecuta. 409 si ya hay uno vivo de la misma fuente.',
  })
  @ApiAcceptedResponse({ type: ScanAcceptedDto })
  async requestScan(
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ScanAcceptedDto> {
    const key = idempotencyKey?.trim().slice(0, 200) || undefined;
    const { scan, created } = await this.scans.request(actor, key);
    const statusUrl = `/admin/catalog/scans/${scan.id}`;
    res.setHeader('Location', statusUrl);
    return {
      scanId: scan.id,
      status: scan.status,
      acceptedAt: scan.requestedAt.toISOString(),
      statusUrl,
      created,
    };
  }

  @Get('scans')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Corridas de escaneo, de la más reciente a la más antigua',
  })
  listScans(@Query() page: CursorQueryDto) {
    return this.query.listScans(page.cursor, page.limit);
  }

  @Get('scans/:scanId')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({
    summary: 'Estado, contadores, huella y limitaciones de una corrida',
  })
  getScan(
    @Param('scanId', ParseUUIDPipe) scanId: string,
  ): Promise<ScanViewDto> {
    return this.query.getScan(scanId);
  }

  @Get('scans/:scanId/changes')
  @Roles(...CATALOG_READ_ROLES)
  @ApiOperation({ summary: 'Diff detectado por una corrida' })
  listScanChanges(
    @Param('scanId', ParseUUIDPipe) scanId: string,
    @Query() page: CursorQueryDto,
  ) {
    return this.query.listScanChanges(scanId, page.cursor, page.limit);
  }

  @Post('scans/:scanId/cancel')
  @Roles(...CATALOG_SCAN_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Pedir la cancelación',
    description:
      'En cola se cancela ya; en marcha queda cancelRequestedAt y el runner la confirma.',
  })
  async cancelScan(
    @Param('scanId', ParseUUIDPipe) scanId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScanViewDto> {
    return scanView(await this.scans.cancel(scanId, actor));
  }
}
