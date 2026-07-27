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
  MarketingCampaignsService,
  MarketingJourneysService,
} from '../services';
import {
  CreateSegmentDto,
  SegmentResponseDto,
  RefreshSegmentDto,
  RefreshSegmentResponseDto,
  CreateCampaignDto,
  CampaignResponseDto,
  MaterializeMembersDto,
  MaterializeMembersResponseDto,
  PublishTemplateVersionDto,
  TemplateVersionResponseDto,
  CreateJourneyDto,
  JourneyResponseDto,
  AddJourneyStepsDto,
  JourneyStepsResponseDto,
  ActivateJourneyDto,
  ActivateJourneyResponseDto,
  AdvanceEnrollmentDto,
  AdvanceEnrollmentResponseDto,
  ExitEnrollmentDto,
  ExitEnrollmentResponseDto,
  CreateTrackedLinkDto,
  TrackedLinkResponseDto,
  RecordTouchpointDto,
  TouchpointResponseDto,
  ComputeAttributionDto,
  ComputeAttributionResponseDto,
} from '../dto';

/** Endpoints de marketing: segmentos, campañas, contenido, journeys y atribución. */
@ApiTags('marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly campaignsService: MarketingCampaignsService,
    private readonly journeysService: MarketingJourneysService,
  ) {}

  /** UC-50-01. */
  @Post('segments')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un segmento y ligarlo a su read model' })
  createSegment(
    @Body() dto: CreateSegmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    return this.campaignsService.createSegment(dto, actor);
  }

  /** UC-50-02. */
  @Post('segments/:id/refresh')
  @Roles('MARKETING_MANAGER', 'SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recomputar la membresía del segmento',
    description:
      'El cuerpo trae la membresía completa: quien no aparece se da de baja.',
  })
  refreshSegment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefreshSegmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshSegmentResponseDto> {
    return this.campaignsService.refreshSegment(id, dto, actor);
  }

  /** UC-50-03. */
  @Post('campaigns')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Lanzar una campaña multicanal desde un segmento' })
  createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.createCampaign(dto, actor);
  }

  /** UC-50-04. */
  @Post('campaigns/:id/members/materialize')
  @Roles('MARKETING_MANAGER', 'SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Materializar la audiencia de la campaña desde su segmento',
    description: 'Idempotente: repetir la llamada no duplica miembros.',
  })
  materializeMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MaterializeMembersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MaterializeMembersResponseDto> {
    return this.campaignsService.materializeMembers(id, dto, actor);
  }

  /** UC-50-05. */
  @Post('content-templates/:code/versions')
  @Roles('CONTENT_EDITOR', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión de plantilla de contenido',
    description: 'La versión anterior queda archivada en la misma transacción.',
  })
  publishTemplateVersion(
    @Param('code') code: string,
    @Body() dto: PublishTemplateVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateVersionResponseDto> {
    return this.campaignsService.publishTemplateVersion(code, dto, actor);
  }

  /** UC-50-06. */
  @Post('journeys')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un journey en borrador' })
  createJourney(
    @Body() dto: CreateJourneyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JourneyResponseDto> {
    return this.journeysService.createJourney(dto, actor);
  }

  /** UC-50-06. */
  @Post('journeys/:id/steps')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Añadir pasos al journey',
    description: 'Los pasos se encadenan en el orden recibido.',
  })
  addSteps(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddJourneyStepsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JourneyStepsResponseDto> {
    return this.journeysService.addSteps(id, dto, actor);
  }

  /** UC-50-07. */
  @Post('journeys/:id/activate')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar el journey e inscribir la cohorte inicial',
  })
  activateJourney(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateJourneyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ActivateJourneyResponseDto> {
    return this.journeysService.activateJourney(id, dto, actor);
  }

  /** UC-50-08. */
  @Post('enrollments/:id/advance')
  @Roles('SYSTEM', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Avanzar la inscripción al siguiente paso',
    description:
      'Ejecuta el paso actual (send/wait/branch) y mueve la inscripción.',
  })
  advanceEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdvanceEnrollmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdvanceEnrollmentResponseDto> {
    return this.journeysService.advanceEnrollment(id, dto, actor);
  }

  /** UC-50-09. */
  @Post('enrollments/:id/exit')
  @Roles('SYSTEM', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la inscripción por meta, baja o rebote' })
  exitEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExitEnrollmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExitEnrollmentResponseDto> {
    return this.journeysService.exitEnrollment(id, dto, actor);
  }

  /** UC-50-10. */
  @Post('tracked-links')
  @Roles('MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un enlace rastreable con parámetros UTM' })
  createTrackedLink(
    @Body() dto: CreateTrackedLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackedLinkResponseDto> {
    return this.journeysService.createTrackedLink(dto, actor);
  }

  /** UC-50-11. */
  @Post('touchpoints')
  @Roles('SYSTEM', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un touchpoint de marketing',
    description:
      'Log append-only; actualiza el estado del miembro de campaña cuando procede.',
  })
  recordTouchpoint(
    @Body() dto: RecordTouchpointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TouchpointResponseDto> {
    return this.journeysService.recordTouchpoint(dto, actor);
  }

  /** UC-50-12. */
  @Post('attribution/compute')
  @Roles('SYSTEM', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular la atribución multi-touch de una conversión',
    description: 'Recalcular reemplaza el reparto anterior del mismo modelo.',
  })
  computeAttribution(
    @Body() dto: ComputeAttributionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ComputeAttributionResponseDto> {
    return this.journeysService.computeAttribution(dto, actor);
  }
}
