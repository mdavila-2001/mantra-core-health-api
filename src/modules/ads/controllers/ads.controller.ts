import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  AdsAccountsService,
  AdsCampaignsService,
  AdsDataService,
  AdsOptimizationService,
} from '../services';
import {
  ProvisionAdAccountDto,
  AdAccountResponseDto,
  LinkPartnerDto,
  PartnerLinkResponseDto,
  ConnectPlatformDto,
  PlatformConnectionResponseDto,
  LaunchCampaignDto,
  LaunchCampaignResponseDto,
  CreateTargetingDto,
  TargetingResponseDto,
  AssignIdentityDto,
  AssignIdentityResponseDto,
  CreateEventPolicyDto,
  EventPolicyResponseDto,
  IngestInsightsDto,
  IngestInsightsResponseDto,
  SendConversionDto,
  SendConversionResponseDto,
  UploadOfflineConversionsDto,
  OfflineUploadResponseDto,
  CreateExperimentDto,
  ExperimentResponseDto,
  EvaluateRuleDto,
  EvaluateRuleResponseDto,
  RecordReviewEventDto,
  ReviewEventResponseDto,
  SubmitAppealDto,
  AppealResponseDto,
  RunFeedDto,
  FeedRunResponseDto,
  IssueAdInvoiceDto,
  AdInvoiceResponseDto,
  SubmitLeadDto,
  LeadSubmissionResponseDto,
  CreateBudgetScheduleDto,
  BudgetScheduleResponseDto,
} from '../dto';

/** Endpoints de publicidad: cuentas, campañas, datos, optimización y leads. */
@ApiTags('ads')
@ApiBearerAuth()
@Controller('ads')
export class AdsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param accountsService - Valor de accounts service requerido por la operación.
   * @param campaignsService - Valor de campaigns service requerido por la operación.
   * @param dataService - Valor de data service requerido por la operación.
   * @param optimizationService - Valor de optimization service requerido por la operación.
   */
  constructor(
    private readonly accountsService: AdsAccountsService,
    private readonly campaignsService: AdsCampaignsService,
    private readonly dataService: AdsDataService,
    private readonly optimizationService: AdsOptimizationService,
  ) {}

  /** UC-43-01. */
  @Post('business-managers/:bmId/ad-accounts')
  @Roles('ADS_ADMIN', 'BUSINESS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Provisionar una cuenta publicitaria',
    description: 'El propietario queda con rol de administrador de la cuenta.',
  })
  provisionAdAccount(
    @Param('bmId', ParseUUIDPipe) bmId: string,
    @Body() dto: ProvisionAdAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdAccountResponseDto> {
    return this.accountsService.provisionAdAccount(bmId, dto, actor);
  }

  /** UC-43-02. */
  @Post('business-managers/:bmId/partners')
  @Roles('ADS_ADMIN', 'BUSINESS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular un socio y compartir el alcance de assets',
    description:
      'La vigencia anterior con ese socio se cierra en la misma transacción.',
  })
  linkPartner(
    @Param('bmId', ParseUUIDPipe) bmId: string,
    @Body() dto: LinkPartnerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PartnerLinkResponseDto> {
    return this.accountsService.linkPartner(bmId, dto, actor);
  }

  /** UC-43-03. */
  @Post('platform-connections')
  @Roles('ADS_ADMIN', 'BUSINESS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Conectar la plataforma externa e importar identidades',
    description:
      'El token vive en el vault; aquí sólo viaja el id de la credencial.',
  })
  connectPlatform(
    @Body() dto: ConnectPlatformDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlatformConnectionResponseDto> {
    return this.accountsService.connectPlatform(dto, actor);
  }

  /** UC-43-04. */
  @Post('ad-accounts/:id/campaigns/launch')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Lanzar una campaña con sus conjuntos, creativos y anuncios',
    description: 'Todo nace pausado y el anuncio en revisión.',
  })
  launchCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LaunchCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LaunchCampaignResponseDto> {
    return this.campaignsService.launchCampaign(id, dto, actor);
  }

  /** UC-43-05. */
  @Post('ad-accounts/:id/targeting')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Guardar una segmentación y, si se pide, su audiencia',
    description:
      'Las audiencias van hasheadas o pseudonimizadas; nunca datos de salud.',
  })
  createTargeting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTargetingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TargetingResponseDto> {
    return this.campaignsService.createTargeting(id, dto, actor);
  }

  /** UC-43-05. */
  @Post('ad-sets/:id/identity')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar la identidad con la que se publica el conjunto',
    description:
      'Sólo hay una identidad vigente por rol; la anterior se cierra.',
  })
  assignIdentity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignIdentityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignIdentityResponseDto> {
    return this.campaignsService.assignIdentity(id, dto, actor);
  }

  /** UC-43-06. */
  @Post('event-data-policies')
  @Roles('DATA_PRIVACY_OFFICER', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar la política de datos de evento con sus reglas de campo',
    description:
      'Es el cortafuegos que impide que un dato de salud salga a la plataforma.',
  })
  createEventPolicy(
    @Body() dto: CreateEventPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EventPolicyResponseDto> {
    return this.dataService.createEventPolicy(dto, actor);
  }

  /** UC-43-07. */
  @Post('ingest/insights')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ingerir entrega e insights y consolidar el gasto',
    description:
      'El rollup diario se reescribe; el gasto de la cuenta sube sólo con el delta.',
  })
  ingestInsights(
    @Body() dto: IngestInsightsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IngestInsightsResponseDto> {
    return this.dataService.ingestInsights(dto, actor);
  }

  /** UC-43-08. */
  @Post('datasets/:id/events')
  @Roles('SYSTEM', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar una conversión server-side',
    description:
      'Deduplica contra el evento del navegador y aplica la política de datos.',
  })
  sendConversion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendConversionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SendConversionResponseDto> {
    return this.dataService.sendConversion(id, dto, actor);
  }

  /** UC-43-09. */
  @Post('offline-conversion-sets/upload')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subir conversiones offline con reporte de coincidencia',
    description: 'Sólo se aceptan claves de coincidencia ya hasheadas.',
  })
  uploadOfflineConversions(
    @Body() dto: UploadOfflineConversionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OfflineUploadResponseDto> {
    return this.dataService.uploadOfflineConversions(dto, actor);
  }

  /** UC-43-10. */
  @Post('ad-accounts/:id/experiments')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un experimento A/B y arrancar sus variantes',
    description: 'El reparto debe sumar 100 y llevar exactamente un control.',
  })
  createExperiment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExperimentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExperimentResponseDto> {
    return this.optimizationService.createExperiment(id, dto, actor);
  }

  /** UC-43-11. */
  @Post('automated-rules/:id/evaluate')
  @Roles('SYSTEM', 'ADS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar la acción de una regla automatizada',
    description:
      'La ejecución se registra siempre, aunque no cambie ninguna entidad.',
  })
  evaluateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvaluateRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvaluateRuleResponseDto> {
    return this.optimizationService.evaluateRule(id, dto, actor);
  }

  /** UC-43-12. */
  @Post('ads/:id/review-events')
  @Roles('POLICY_REVIEWER', 'SYSTEM', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el resultado de la revisión del anuncio',
    description: 'Idempotente por el identificador externo de la revisión.',
  })
  recordReviewEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordReviewEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewEventResponseDto> {
    return this.optimizationService.recordReviewEvent(id, dto, actor);
  }

  /** UC-43-12. */
  @Post('policy-violations/:id/appeals')
  @Roles('POLICY_REVIEWER', 'AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apelar una infracción de política' })
  submitAppeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAppealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AppealResponseDto> {
    return this.optimizationService.submitAppeal(id, dto, actor);
  }

  /** UC-43-13. */
  @Post('catalogs/:id/feeds/:feedId/run')
  @Roles('SYSTEM', 'ADS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar el catálogo de productos con el feed',
    description:
      'Upsert idempotente por identificador del comercio; sin datos de salud.',
  })
  runFeed(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('feedId', ParseUUIDPipe) feedId: string,
    @Body() dto: RunFeedDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FeedRunResponseDto> {
    return this.dataService.runFeed(id, feedId, dto, actor);
  }

  /** UC-43-14. */
  @Post('ad-accounts/:id/invoices/issue')
  @Roles('FINANCE', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir la factura de anuncios del periodo',
    description:
      'El total se deriva de las líneas, agregando el consumo por campaña.',
  })
  issueInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueAdInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdInvoiceResponseDto> {
    return this.optimizationService.issueInvoice(id, dto, actor);
  }

  /** UC-43-15. */
  @Post('lead-forms/:id/submissions')
  @Roles('SYSTEM', 'AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Recibir un lead del formulario y encolar su entrega al CRM',
    description:
      'Idempotente por el identificador externo; las respuestas se cifran.',
  })
  submitLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LeadSubmissionResponseDto> {
    return this.optimizationService.submitLead(id, dto, actor);
  }

  /** UC-43-16. */
  @Post('ad-sets/:id/budget-schedules')
  @Roles('AD_OPS', 'ADS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programar un tramo de presupuesto o puja',
    description:
      'Cambiar presupuesto o puja reinicia la fase de aprendizaje del conjunto.',
  })
  createBudgetSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBudgetScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BudgetScheduleResponseDto> {
    return this.campaignsService.createBudgetSchedule(id, dto, actor);
  }
}
