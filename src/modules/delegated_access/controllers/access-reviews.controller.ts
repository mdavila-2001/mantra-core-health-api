import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  AccessReviewCampaignsService,
  AccessReviewItemsService,
  GovernanceExportService,
} from '../services';
import {
  BulkReviewDecisionDto,
  BulkReviewResultDto,
  CampaignDraftDto,
  CampaignExportQueryDto,
  CampaignListDto,
  CampaignPreviewDto,
  CampaignResultsDto,
  CampaignViewDto,
  CancelCampaignDto,
  CloseCampaignResultDto,
  CreateCampaignDto,
  DecideReviewItemDto,
  ExportedFileDto,
  LaunchCampaignResultDto,
  MyReviewsQueryDto,
  OperationResultDto,
  ReviewDecisionResultDto,
  ReviewItemListDto,
  ReviewItemViewDto,
  UpdateCampaignDto,
} from '../dto';

/** Decisiones y aprobaciones: 30 por minuto y persona (CONTRATO-GOBIERNO §8.9). */
const DECISION_THROTTLE = { default: { limit: 30, ttl: 60_000 } };

/**
 * Campañas de certificación de accesos desde la organización
 * (`SECURITY_ADMIN`, o un administrador delegado con `team.campaigns.manage`
 * sobre su población): vista previa, borrador, lanzamiento, cierre, resultados
 * y exportación.
 */
@ApiTags('delegated-access-access-reviews')
@ApiBearerAuth()
@Controller('org/access-reviews/campaigns')
export class AccessReviewCampaignsController {
  /**
   * @param campaigns - Campañas.
   * @param exports - Exportación auditable.
   */
  constructor(
    private readonly campaigns: AccessReviewCampaignsService,
    private readonly exports: GovernanceExportService,
  ) {}

  /** Campañas de la organización. */
  @Get()
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Campañas de certificación de accesos' })
  @ApiOkResponse({ type: CampaignListDto })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<CampaignListDto> {
    return this.campaigns.list(actor);
  }

  /** Cuántos ítems tendría una campaña y quién los revisa, sin crear nada. */
  @NotAudited(
    'Vista previa sin efectos: no crea ni cambia nada; la campaña queda sellada al crearla (ACCESS_REVIEW_CAMPAIGN_CREATED).',
  )
  @Post('preview')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vista previa de una campaña (sin crear nada)' })
  @ApiOkResponse({ type: CampaignPreviewDto })
  preview(
    @Body() dto: CampaignDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CampaignPreviewDto> {
    return this.campaigns.preview(dto, actor);
  }

  /** Crea una campaña en borrador. */
  @Audited({
    action: 'ACCESS_REVIEW_CAMPAIGN_CREATED',
    entity: 'access_review_campaign',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Crear una campaña de certificación (borrador)' })
  @ApiCreatedResponse({ type: OperationResultDto })
  create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.campaigns.create(dto, actor);
  }

  /** Una campaña. */
  @Get(':id')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Una campaña de certificación' })
  @ApiOkResponse({ type: CampaignViewDto })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CampaignViewDto> {
    return this.campaigns.get(id, actor);
  }

  /** Edita una campaña en borrador. */
  @Audited({
    action: 'ACCESS_REVIEW_CAMPAIGN_UPDATED',
    entity: 'access_review_campaign',
    entityId: 'param:id',
  })
  @Patch(':id')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Editar una campaña en borrador' })
  @ApiOkResponse({ type: OperationResultDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.campaigns.update(id, dto, actor);
  }

  /** Lanza la campaña: genera los ítems con su evidencia. */
  @Audited({
    action: 'ACCESS_REVIEW_CAMPAIGN_LAUNCHED',
    entity: 'access_review_campaign',
    entityId: 'param:id',
  })
  @Post(':id/launch')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lanzar una campaña de certificación' })
  @ApiOkResponse({ type: LaunchCampaignResultDto })
  launch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LaunchCampaignResultDto> {
    return this.campaigns.launch(id, actor);
  }

  /** Cierra la campaña y aplica la acción de lo no certificado. */
  @Audited({
    action: 'ACCESS_REVIEW_CAMPAIGN_CLOSED',
    entity: 'access_review_campaign',
    entityId: 'param:id',
  })
  @Post(':id/close')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una campaña (revoca lo no certificado)' })
  @ApiOkResponse({ type: CloseCampaignResultDto })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CloseCampaignResultDto> {
    return this.campaigns.close(id, actor);
  }

  /** Cancela la campaña: no revoca nada. */
  @Audited({
    action: 'ACCESS_REVIEW_CAMPAIGN_CANCELLED',
    entity: 'access_review_campaign',
    entityId: 'param:id',
  })
  @Post(':id/cancel')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una campaña (no revoca nada)' })
  @ApiOkResponse({ type: OperationResultDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.campaigns.cancel(id, dto, actor);
  }

  /** Estado de cada ítem de la campaña. */
  @Get(':id/items')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Ítems de una campaña y su estado' })
  @ApiOkResponse({ type: ReviewItemListDto })
  items(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewItemListDto> {
    return this.campaigns.items(id, actor);
  }

  /** Resultados de la campaña. */
  @Get(':id/results')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Resultados de una campaña' })
  @ApiOkResponse({ type: CampaignResultsDto })
  results(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CampaignResultsDto> {
    return this.campaigns.results(id, actor);
  }

  /**
   * Exporta la campaña (CSV o JSON, con su `sha256`); queda un asiento. Pide un motivo (código) y
   * el paso extra reciente (A-B4) y lleva tope de frecuencia: 5 por minuto por persona (B-B12).
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get(':id/export')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Exportar una campaña (auditado, con sha256)' })
  @ApiOkResponse({ type: ExportedFileDto })
  export(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CampaignExportQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<ExportedFileDto> {
    return this.exports.exportCampaign(id, query, actor, { ip });
  }
}

/**
 * Bandeja del revisor (`my-reviews`): sus ítems con la evidencia congelada y
 * sus decisiones. Autoriza el servicio, por elegibilidad: no es ni la persona
 * revisada ni quien otorgó o aprobó la concesión (`SOD-GOV-02`).
 */
@ApiTags('delegated-access-my-reviews')
@ApiBearerAuth()
@Controller('me/access-reviews/items')
export class MyAccessReviewsController {
  /**
   * @param items - Ítems y decisiones.
   */
  constructor(private readonly items: AccessReviewItemsService) {}

  /** Mis ítems por estado. */
  @Get()
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Mis ítems de certificación' })
  @ApiOkResponse({ type: ReviewItemListDto })
  list(
    @Query() query: MyReviewsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewItemListDto> {
    return this.items.list(actor, query);
  }

  /** Decisión en lote: solo `CERTIFY` de bajo riesgo, todo o nada. */
  @Audited({
    action: 'ACCESS_REVIEW_ITEM_CERTIFIED',
    entity: 'access_review_item',
  })
  @Throttle(DECISION_THROTTLE)
  @Post('bulk-decision')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Certificar en lote lo de bajo riesgo (todo o nada)',
  })
  @ApiOkResponse({ type: BulkReviewResultDto })
  bulk(
    @Body() dto: BulkReviewDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BulkReviewResultDto> {
    return this.items.bulk(dto, actor);
  }

  /** Un ítem mío, con su evidencia. */
  @Get(':id')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Un ítem de certificación, con su evidencia' })
  @ApiOkResponse({ type: ReviewItemViewDto })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewItemViewDto> {
    return this.items.get(id, actor);
  }

  /** Certifica, revoca o ajusta un ítem (el ajuste solo reduce). */
  @Audited({
    action: 'ACCESS_REVIEW_ITEM_CERTIFIED',
    entity: 'access_review_item',
    entityId: 'param:id',
  })
  @Throttle(DECISION_THROTTLE)
  @Post(':id/decision')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decidir un ítem: certificar, revocar o ajustar' })
  @ApiOkResponse({ type: ReviewDecisionResultDto })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideReviewItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewDecisionResultDto> {
    return this.items.decide(id, dto, actor);
  }
}
