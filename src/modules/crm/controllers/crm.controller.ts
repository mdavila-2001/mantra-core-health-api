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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CrmSalesService, CrmServiceService } from '../services';
import {
  CreateAccountDto,
  AccountResponseDto,
  AddTeamMemberDto,
  TeamMemberResponseDto,
  CreateLeadDto,
  QualifyLeadDto,
  LeadResponseDto,
  ConvertLeadDto,
  ConvertLeadResponseDto,
  CreateActivityDto,
  ActivityResponseDto,
  AdvanceStageDto,
  LoseOpportunityDto,
  OpportunityResponseDto,
  CreatePartnershipDto,
  PartnershipResponseDto,
  CreateCaseDto,
  CaseResponseDto,
  AddCaseCommentDto,
  ChangeCaseStatusDto,
  CaseStatusResponseDto,
  ChannelOptInDto,
  ChannelOptInResponseDto,
  Account360ResponseDto,
} from '../dto';

/** Endpoints de CRM: cuentas, leads, oportunidades, actividades, alianzas y casos. */
@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
export class CrmController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param salesService - Valor de sales service requerido por la operación.
   * @param serviceService - Valor de service service requerido por la operación.
   */
  constructor(
    private readonly salesService: CrmSalesService,
    private readonly serviceService: CrmServiceService,
  ) {}

  /** UC-49-01. */
  @Post('accounts')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cuenta con su contacto principal' })
  createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountResponseDto> {
    return this.salesService.createAccount(dto, actor);
  }

  /** UC-49-02. */
  @Post('accounts/:id/team-members')
  @Roles('CRM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sumar un usuario al equipo de la cuenta' })
  addTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    return this.salesService.addTeamMember(id, dto, actor);
  }

  /** UC-49-14. */
  @Get('accounts/:id/360')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vista 360 de la cuenta',
    description:
      'Se compone en caliente; en producción la servirá un read model materializado por el outbox.',
  })
  getAccount360(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Account360ResponseDto> {
    return this.serviceService.getAccount360(id);
  }

  /** UC-49-03. */
  @Post('leads')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Capturar un lead' })
  createLead(
    @Body() dto: CreateLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.salesService.createLead(dto, actor);
  }

  /** UC-49-03. */
  @Patch('leads/:id/qualify')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calificar o descartar el lead' })
  qualifyLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QualifyLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.salesService.qualifyLead(id, dto, actor);
  }

  /** UC-49-04. */
  @Post('leads/:id/convert')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convertir el lead en oportunidad' })
  convertLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConvertLeadResponseDto> {
    return this.salesService.convertLead(id, dto, actor);
  }

  /** UC-49-05 y UC-49-06. */
  @Post('activities')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una actividad y su subtipo',
    description: 'Las de tipo TASK y NOTE crean además su fila de subtipo.',
  })
  createActivity(
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    return this.serviceService.createActivity(dto, actor);
  }

  /** UC-49-07. */
  @Post('opportunities/:id/advance-stage')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avanzar la oportunidad de etapa' })
  advanceStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdvanceStageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.salesService.advanceStage(id, dto, actor);
  }

  /** UC-49-08. */
  @Post('opportunities/:id/win')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar la oportunidad como ganada' })
  winOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.salesService.winOpportunity(id, actor);
  }

  /** UC-49-09. */
  @Post('opportunities/:id/lose')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar la oportunidad como perdida con su motivo' })
  loseOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LoseOpportunityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OpportunityResponseDto> {
    return this.salesService.loseOpportunity(id, dto, actor);
  }

  /** UC-49-10. */
  @Post('partnerships')
  @Roles('CRM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una alianza y su acuerdo marco' })
  createPartnership(
    @Body() dto: CreatePartnershipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PartnershipResponseDto> {
    return this.serviceService.createPartnership(dto, actor);
  }

  /** UC-49-11. */
  @Post('cases')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir un caso de servicio' })
  createCase(
    @Body() dto: CreateCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    return this.serviceService.createCase(dto, actor);
  }

  /** UC-49-12. */
  @Post('cases/:id/comments')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comentar el caso' })
  addCaseComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCaseCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string; /**
     * Identificador asociado a case.
     */
    caseId: string;
  }> {
    return this.serviceService.addCaseComment(id, dto, actor);
  }

  /** UC-49-12. */
  @Patch('cases/:id/status')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transicionar el estado del caso' })
  changeCaseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeCaseStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CaseStatusResponseDto> {
    return this.serviceService.changeCaseStatus(id, dto, actor);
  }

  /** UC-49-13. */
  @Post('cases/:id/resolve')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver el caso' })
  resolveCase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CaseStatusResponseDto> {
    return this.serviceService.changeCaseStatus(
      id,
      { status: 'RESOLVED' },
      actor,
    );
  }

  /** UC-49-15. */
  @Patch('contacts/:id/channels/:cid/opt-in')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar el consentimiento del canal de contacto',
    description:
      'Revocar activa `do_not_contact`, que marketing respeta antes de enviar.',
  })
  setChannelOptIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cid', ParseUUIDPipe) cid: string,
    @Body() dto: ChannelOptInDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChannelOptInResponseDto> {
    return this.serviceService.setChannelOptIn(id, cid, dto, actor);
  }
}
