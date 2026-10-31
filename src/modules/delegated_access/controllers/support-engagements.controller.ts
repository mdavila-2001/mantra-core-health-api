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
  Res,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  EffectiveSupportAccessService,
  RoleTemplatesService,
  SupportActivityService,
  SupportCatalogService,
  SupportEngagementsService,
} from '../services';
import { DelegationScopeService } from '../services/delegation-scope.service';
import {
  AccessLookupQueryDto,
  AccessLookupResponseDto,
  CreateRoleTemplateDto,
  CreateSupportGrantDto,
  GrantChangePendingDto,
  EndEngagementDto,
  ListRoleTemplatesResponseDto,
  ListSupportEngagementsResponseDto,
  OperationResultDto,
  RecertifyEngagementDto,
  ResourceCreatedDto,
  SupportActivityQueryDto,
  SupportActivityResponseDto,
  SupportCatalogResponseDto,
  SupportGrantViewDto,
  UpdateRoleTemplateDto,
  UpdateSupportGrantDto,
} from '../dto';

/**
 * Vínculos de apoyo desde la organización: permisos con sus acciones,
 * recertificación, fin de vínculo, plantillas de rol, quién tiene acceso a qué
 * y qué hizo el personal. La organización decide solo sobre su tenant.
 */
@ApiTags('delegated-access-support-engagements')
@ApiBearerAuth()
@Controller('org')
export class SupportEngagementsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param engagements - Vínculos de apoyo.
   * @param templates - Plantillas de rol.
   * @param effective - Acceso efectivo derivado.
   * @param activity - Bitácora de actividad.
   * @param scope - Política común de tenant.
   * @param catalogService - Catálogo de doctores, servicios y ubicaciones.
   */
  constructor(
    private readonly engagements: SupportEngagementsService,
    private readonly templates: RoleTemplatesService,
    private readonly effective: EffectiveSupportAccessService,
    private readonly activity: SupportActivityService,
    private readonly scope: DelegationScopeService,
    private readonly catalogService: SupportCatalogService,
  ) {}

  /** Vínculos de apoyo de la organización. */
  @Get('support-engagements')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Vínculos de apoyo de la organización' })
  list(): Promise<ListSupportEngagementsResponseDto> {
    return this.engagements.listForTenant();
  }

  /** Permisos de un vínculo. */
  @Get('support-engagements/:id/grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Permisos de un vínculo de apoyo' })
  listGrants(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupportGrantViewDto[]> {
    return this.engagements.listGrants(id);
  }

  /** Alta de un permiso. */
  @Audited({
    action: 'SUPPORT_GRANT_CREATED',
    entity: 'support_scope_grant',
    entityId: 'result.id',
  })
  @Post('support-engagements/:id/grants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ResourceCreatedDto })
  @ApiAcceptedResponse({
    type: GrantChangePendingDto,
    description:
      'Agrega o amplía (alcance, modo DYNAMIC o vigencia) un permiso crítico: no se escribió nada y queda a la espera de la aprobación de otra persona (cuatro ojos).',
  })
  @ApiOperation({
    summary:
      'Otorgar un permiso de apoyo (202 si agrega o amplía un permiso crítico y espera la aprobación de otra persona)',
  })
  async addGrant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupportGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResourceCreatedDto | GrantChangePendingDto> {
    const out = await this.engagements.addGrant(id, dto, actor);
    // Agregar o ampliar un átomo CRÍTICA queda a la espera de otra persona (cuatro ojos).
    if ('approvalId' in out) res.status(HttpStatus.ACCEPTED);
    return out;
  }

  /** Edición o baja de un permiso. */
  @Audited({
    action: 'SUPPORT_GRANT_UPDATED',
    entity: 'support_scope_grant',
    entityId: 'body.grantId',
  })
  @Patch('support-engagements/:id/grants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OperationResultDto })
  @ApiAcceptedResponse({
    type: GrantChangePendingDto,
    description:
      'Agrega o amplía (alcance, modo DYNAMIC o vigencia) un permiso crítico: no se escribió nada y queda a la espera de la aprobación de otra persona (cuatro ojos).',
  })
  @ApiOperation({ summary: 'Editar o dar de baja un permiso de apoyo' })
  async updateGrant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OperationResultDto | GrantChangePendingDto> {
    const out = await this.engagements.updateGrant(id, dto, actor);
    if ('approvalId' in out) res.status(HttpStatus.ACCEPTED);
    return out;
  }

  /** Recertifica el vínculo. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_RECERTIFIED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('support-engagements/:id/recertify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recertificar un vínculo de apoyo' })
  recertify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecertifyEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.engagements.recertify(id, dto, actor);
  }

  /** Fin de vínculo: revocación inmediata en cascada; las citas se mantienen. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_ENDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('support-engagements/:id/end')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminar un vínculo de apoyo (revocación inmediata)',
  })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.engagements.end(id, dto, actor);
  }

  /** Doctores, servicios y ubicaciones que se pueden nombrar en un permiso. */
  @Get('support-catalog')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Catálogo de doctores, servicios y ubicaciones para los permisos',
  })
  catalog(): Promise<SupportCatalogResponseDto> {
    return this.catalogService.forActiveTenant();
  }

  /** Quién tiene acceso a un doctor, un servicio o una ubicación. */
  @Get('access-lookup')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Quién tiene acceso a un doctor, servicio o ubicación',
  })
  lookup(
    @Query() query: AccessLookupQueryDto,
  ): Promise<AccessLookupResponseDto> {
    return this.effective.lookup(this.scope.resolveTenant(), query);
  }

  /** Qué hizo el personal de apoyo. */
  @Get('support-activity')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Actividad del personal de apoyo' })
  activityOfTenant(
    @Query() query: SupportActivityQueryDto,
  ): Promise<SupportActivityResponseDto> {
    return this.activity.forTenant(query);
  }

  /** Plantillas de rol visibles para la organización. */
  @Get('role-templates')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Plantillas de rol de apoyo' })
  listTemplates(): Promise<ListRoleTemplatesResponseDto> {
    return this.templates.list();
  }

  /** Crea una plantilla propia. */
  @Audited({
    action: 'SUPPORT_ROLE_TEMPLATE_CREATED',
    entity: 'role_template',
    entityId: 'result.id',
  })
  @Post('role-templates')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una plantilla de rol propia' })
  createTemplate(
    @Body() dto: CreateRoleTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.templates.create(dto, actor);
  }

  /** Publica una versión nueva de una plantilla propia. */
  @Audited({
    action: 'SUPPORT_ROLE_TEMPLATE_UPDATED',
    entity: 'role_template',
    entityId: 'param:id',
  })
  @Patch('role-templates/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Versionar una plantilla de rol propia' })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.templates.update(id, dto, actor);
  }
}
