import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { CorrelationId, IfMatch } from '../http/request-decorators';
import {
  BackgroundContentQueryDto,
  CreateElementDto,
  CreateFloorPlanDto,
  CreatePlacementDto,
  FloorPlanLifecycleDto,
  LayoutQueryDto,
  ListPlansQueryDto,
  PatchLayoutDto,
  PlanCatalogQueryDto,
  ReplaceLayoutDto,
  SetBackgroundDto,
  UnplacedQueryDto,
  UpdateElementDto,
  UpdateFloorPlanDto,
  UpdatePlacementDto,
} from './floor-plan.dto';
import { PLAN_LIMITS } from './floor-plan.constants';
import type {
  FloorPlanSummary,
  LayoutWriteResult,
  PlanValidationIssue,
  UnplacedSpace,
} from './floor-plan.types';
import {
  FloorPlansService,
  type FloorPlanCatalog,
  type FloorPlanWithViewer,
} from './floor-plans.service';
import { FloorPlanLayoutService } from './floor-plan-layout.service';
import { FloorPlanLayoutWriteService } from './floor-plan-layout-write.service';
import {
  FloorPlanBackgroundService,
  type BackgroundResult,
} from './floor-plan-background.service';
import { isDryRun, LayoutIfMatch, SupportReason } from './plan-request-decorators';

const IF_MATCH_ROW = {
  name: 'If-Match',
  required: true,
  description: 'rowVersion vigente del recurso (412 si no coincide, 428 si falta)',
};
const IF_MATCH_LAYOUT = {
  name: 'If-Match',
  required: true,
  description:
    'layoutVersion vigente del lienzo, o el ETag de su layout (412 PLAN_VERSION_MISMATCH si no coincide)',
};
const SUPPORT_REASON = {
  name: 'X-Support-Reason',
  required: false,
  description: 'Motivo obligatorio sólo para el soporte de plataforma (422 si falta)',
};
const DRY_RUN = {
  name: 'dryRun',
  required: false,
  description: 'true: valida con la base y deshace; nada se escribe',
};

/**
 * Plano de planta: catálogo, lienzos, fondo y dibujo (CONTRATO-PLANO §3).
 *
 * Sin `@Roles`: igual que la estructura, la regla es de **organización y
 * sucursal** (`StructureAccessService`) más los roles operativos de las
 * asignaciones delegadas; un lienzo, sede o espacio de otro tenant responde
 * 404, y quien lee pero no administra recibe 403 `INFRA_ACTION_NOT_ALLOWED` al
 * intentar escribir. Editar el plano es editar estructura.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller()
export class FloorPlansController {
  /**
   * @param plans - Lienzos y consultas de apoyo.
   * @param layout - Lectura del layout.
   * @param writes - Escritura del layout.
   * @param background - Fondo importado.
   */
  constructor(
    private readonly plans: FloorPlansService,
    private readonly layout: FloorPlanLayoutService,
    private readonly writes: FloorPlanLayoutWriteService,
    private readonly background: FloorPlanBackgroundService,
  ) {}

  // ------------------------------------------------------------------ catálogo

  /** Catálogo del plano: tipos de elemento, límites, plantillas y reglas del fondo. */
  @Get('practice/floor-plan-catalog')
  @ApiOperation({ summary: 'Catálogo del plano de planta' })
  catalog(
    @Query() query: PlanCatalogQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FloorPlanCatalog> {
    return this.plans.catalog(query.siteId, actor);
  }

  // ------------------------------------------------------------------- lienzos

  /** Lienzos de la sede con recuentos de figuras. */
  @Get('sites/:siteId/floor-plans')
  @ApiOperation({ summary: 'Lienzos de una sede' })
  list(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: ListPlansQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FloorPlanSummary[]> {
    return this.plans.listBySite(siteId, query.includeRetired ?? false, actor);
  }

  /** Crea un lienzo (piso, zona o campus). */
  @Audited({
    action: 'FLOOR_PLAN_CREATED',
    entity: 'floor_plan',
    entityId: 'result.id',
  })
  @Post('sites/:siteId/floor-plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Crear un lienzo' })
  @ApiResponse({
    status: 409,
    description: 'PLAN_CODE_TAKEN · PLAN_ANCHOR_TAKEN · PLAN_CAMPUS_EXISTS',
  })
  @ApiResponse({
    status: 422,
    description: 'PLAN_ANCHOR_FORM_INVALID · PLAN_ANCHOR_NOT_ACTIVE · PLAN_CANVAS_INVALID',
  })
  create(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateFloorPlanDto,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<FloorPlanWithViewer> {
    return this.plans.create(siteId, dto, actor, supportReason, correlationId);
  }

  /** Metadatos del lienzo y capacidades de quien mira. */
  @Get('floor-plans/:id')
  @Header('Cache-Control', 'private, no-cache')
  @ApiOperation({ summary: 'Un lienzo' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FloorPlanWithViewer> {
    return this.plans.get(id, actor);
  }

  /** Edita nombre, tamaño, cota, rumbo, grilla o tolerancia. */
  @Audited({
    action: 'FLOOR_PLAN_UPDATED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Patch('floor-plans/:id')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Editar un lienzo (If-Match: rowVersion)' })
  @ApiResponse({ status: 409, description: 'PLAN_BOUNDS_EXCLUDE_CONTENT · PLAN_RETIRED' })
  @ApiResponse({ status: 412, description: 'ROW_VERSION_MISMATCH' })
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFloorPlanDto,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<FloorPlanWithViewer> {
    return this.plans.patch(id, dto, expectedRowVersion, actor, supportReason, correlationId);
  }

  /** Clausura o reabre un lienzo (con motivo). */
  @Audited({
    action: 'FLOOR_PLAN_LIFECYCLE_CHANGED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Post('floor-plans/:id/lifecycle')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Clausurar o reabrir un lienzo (If-Match: rowVersion)' })
  @ApiResponse({ status: 409, description: 'PLAN_SPACE_OCCUPIED · PLAN_LIFECYCLE_INVALID' })
  lifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FloorPlanLifecycleDto,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<FloorPlanWithViewer> {
    return this.plans.lifecycle(id, dto, expectedRowVersion, actor, supportReason, correlationId);
  }

  // --------------------------------------------------------------------- fondo

  /** Fija el fondo importado (imagen PNG/JPEG/WebP del mismo tenant) con su calibración. */
  @Audited({
    action: 'FLOOR_PLAN_BACKGROUND_SET',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Put('floor-plans/:id/background')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Importar y calibrar el fondo (If-Match: rowVersion)' })
  @ApiResponse({ status: 404, description: 'Archivo de otro tenant o inexistente' })
  @ApiResponse({
    status: 422,
    description: 'BACKGROUND_FILE_INVALID · BACKGROUND_CALIBRATION_INVALID',
  })
  setBackground(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetBackgroundDto,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<BackgroundResult> {
    return this.background.set(id, dto, expectedRowVersion, actor, supportReason, correlationId);
  }

  /** Quita la referencia al fondo (el archivo no se borra). */
  @Audited({
    action: 'FLOOR_PLAN_BACKGROUND_CLEARED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Delete('floor-plans/:id/background')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Quitar el fondo (If-Match: rowVersion)' })
  clearBackground(
    @Param('id', ParseUUIDPipe) id: string,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<BackgroundResult> {
    return this.background.clear(id, expectedRowVersion, actor, supportReason, correlationId);
  }

  /** Bytes del fondo, con la URL firmada de vida corta que emite la API. */
  @Get('floor-plans/:id/background/content')
  @ApiOperation({ summary: 'Contenido del fondo (URL firmada de vida corta)' })
  @ApiResponse({ status: 403, description: 'BACKGROUND_URL_INVALID: firma inválida' })
  @ApiResponse({ status: 410, description: 'La URL venció' })
  async backgroundContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BackgroundContentQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.background.content(
      id,
      { v: query.v, exp: query.exp, sig: query.sig },
      actor,
    );
    res.setHeader('Content-Type', content.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Privado: un plano es información de seguridad; nunca una caché compartida.
    res.setHeader('Cache-Control', `private, max-age=${content.expiresInSeconds}`);
    res.send(content.buffer);
  }

  // -------------------------------------------------------------------- layout

  /** Layout ligero, paginado y cacheable (ETag por layoutVersion, 304). */
  @Get('floor-plans/:id/layout')
  @ApiOperation({ summary: 'Layout del lienzo (ETag, 304, ventana, foco, paginado)' })
  @ApiQuery({ name: 'bbox', required: false, example: '0,0,32,13' })
  async readLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LayoutQueryDto,
    @Req() req: Request,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    const result = await this.layout.read(id, query, req.headers['if-none-match'], actor);
    res.setHeader('ETag', result.etag);
    res.setHeader('Cache-Control', 'private, no-cache');
    if (result.status === 304) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }
    return result.body;
  }

  /** Delta del editor: agrega, mueve y quita, todo o nada. */
  @Audited({
    action: 'FLOOR_PLAN_LAYOUT_CHANGED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Patch('floor-plans/:id/layout')
  @ApiHeader(IF_MATCH_LAYOUT)
  @ApiHeader(SUPPORT_REASON)
  @ApiQuery(DRY_RUN)
  @ApiOperation({ summary: `Guardar un delta del layout (máx. ${PLAN_LIMITS.maxItemsPerPatch} ítems)` })
  @ApiResponse({
    status: 422,
    description: 'PLAN_LAYOUT_INVALID con `details.errors` por elemento',
  })
  @ApiResponse({ status: 412, description: 'PLAN_VERSION_MISMATCH' })
  @ApiResponse({ status: 413, description: 'PLAN_TOO_MANY_ITEMS' })
  patchLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchLayoutDto,
    @LayoutIfMatch() expectedLayoutVersion: number,
    @Query('dryRun') dryRun: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.patch(id, dto, expectedLayoutVersion, isDryRun(dryRun), {
      actor,
      supportReason,
      correlationId,
    });
  }

  /** Reemplazo total del dibujo (clonar un piso, importar, restaurar). */
  @Audited({
    action: 'FLOOR_PLAN_LAYOUT_REPLACED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Put('floor-plans/:id/layout')
  @ApiHeader(IF_MATCH_LAYOUT)
  @ApiHeader(SUPPORT_REASON)
  @ApiQuery(DRY_RUN)
  @ApiOperation({ summary: `Reemplazar el layout (máx. ${PLAN_LIMITS.maxItemsPerReplace} ítems)` })
  replaceLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceLayoutDto,
    @LayoutIfMatch() expectedLayoutVersion: number,
    @Query('dryRun') dryRun: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.replace(id, dto, expectedLayoutVersion, isDryRun(dryRun), {
      actor,
      supportReason,
      correlationId,
    });
  }

  // ----------------------------------------------------- operaciones sueltas

  /** Dibuja un espacio (operación suelta; sube igual el layoutVersion). */
  @Audited({
    action: 'SPACE_PLACEMENT_CREATED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Post('floor-plans/:id/placements')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Dibujar un espacio' })
  createPlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlacementDto,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult & { placementId: string | null }> {
    return this.writes.createPlacement(id, dto, { actor, supportReason, correlationId });
  }

  /** Mueve, redimensiona o rota un espacio dibujado. */
  @Audited({
    action: 'SPACE_PLACEMENT_UPDATED',
    entity: 'space_placement',
    entityId: 'param:id',
  })
  @Patch('space-placements/:id')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Editar una ubicación (If-Match: rowVersion de la ubicación)' })
  updatePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlacementDto,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.updatePlacement(id, dto, expectedRowVersion, {
      actor,
      supportReason,
      correlationId,
    });
  }

  /** Saca un espacio del plano (no lo borra del árbol). */
  @Audited({
    action: 'SPACE_PLACEMENT_DELETED',
    entity: 'space_placement',
    entityId: 'param:id',
  })
  @Delete('space-placements/:id')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiQuery({ name: 'cascade', required: false })
  @ApiOperation({ summary: 'Quitar una ubicación del plano (If-Match: rowVersion)' })
  deletePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @IfMatch() expectedRowVersion: number,
    @Query('cascade') cascade: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.deletePlacement(id, expectedRowVersion, cascade === 'true', {
      actor,
      supportReason,
      correlationId,
    });
  }

  /** Agrega un elemento (muro, puerta, ventana, escalera…). */
  @Audited({
    action: 'PLAN_ELEMENT_CREATED',
    entity: 'floor_plan',
    entityId: 'param:id',
  })
  @Post('floor-plans/:id/elements')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Agregar un elemento' })
  createElement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateElementDto,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.createElement(id, dto, { actor, supportReason, correlationId });
  }

  /** Edita un elemento. */
  @Audited({
    action: 'PLAN_ELEMENT_UPDATED',
    entity: 'plan_element',
    entityId: 'param:id',
  })
  @Patch('plan-elements/:id')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Editar un elemento (If-Match: rowVersion)' })
  updateElement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateElementDto,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.updateElement(id, dto, expectedRowVersion, {
      actor,
      supportReason,
      correlationId,
    });
  }

  /** Quita un elemento (un muro arrastra las aberturas que aloja). */
  @Audited({
    action: 'PLAN_ELEMENT_DELETED',
    entity: 'plan_element',
    entityId: 'param:id',
  })
  @Delete('plan-elements/:id')
  @ApiHeader(IF_MATCH_ROW)
  @ApiHeader(SUPPORT_REASON)
  @ApiOperation({ summary: 'Quitar un elemento (If-Match: rowVersion)' })
  deleteElement(
    @Param('id', ParseUUIDPipe) id: string,
    @IfMatch() expectedRowVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @SupportReason() supportReason: string | undefined,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<LayoutWriteResult> {
    return this.writes.deleteElement(id, expectedRowVersion, {
      actor,
      supportReason,
      correlationId,
    });
  }

  // ------------------------------------------------- validación y paleta

  /** Auditoría completa del lienzo (solapes, contención, límites, áreas). */
  @Get('floor-plans/:id/validation')
  @ApiOperation({ summary: 'Validar el lienzo (practice.plan_validate)' })
  validation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ issues: PlanValidationIssue[] }> {
    return this.plans.validation(id, actor);
  }

  /** Espacios del alcance del lienzo que todavía no se dibujaron (paleta del editor). */
  @Get('floor-plans/:id/unplaced-spaces')
  @ApiOperation({ summary: 'Espacios sin ubicar (paleta del editor)' })
  unplaced(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UnplacedQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ items: UnplacedSpace[]; nextCursor: string | null }> {
    return this.plans.unplacedSpaces(id, query.cursor, query.limit ?? 200, actor);
  }
}
