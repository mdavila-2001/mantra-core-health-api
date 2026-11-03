import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { FrontendViewsService } from '../services';
import { parseServeViewQuery } from '../services/serve-view-query';
import {
  PublishViewContractDto,
  UpsertViewPreferencesDto,
  ViewContractResponseDto,
  ViewPreferencesResponseDto,
  ServeViewDataResponseDto,
  AvailableActionDto,
} from '../dto';

/**
 * Endpoints de contratos de vista y lectura del read model. Publicar el contrato
 * es una operación administrativa (`SECURITY_ADMIN`); servir datos, derivar
 * acciones y guardar preferencias son operaciones de usuario autenticado.
 */
@ApiTags('read-models-views')
@ApiBearerAuth()
@Controller()
export class FrontendViewsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: FrontendViewsService) {}

  /** UC-30-02. */
  @Audited({
    action: 'FRONTEND_VIEW_CONTRACT_PUBLISHED',
    entity: 'frontend_page_view',
    entityId: 'result.id',
  })
  @Post('portals/:portalCode/routes/:routeCode/views')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar el contrato de una vista de página' })
  publishViewContract(
    @Param('portalCode') portalCode: string,
    @Param('routeCode') routeCode: string,
    @Body() dto: PublishViewContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ViewContractResponseDto> {
    return this.service.publishViewContract(portalCode, routeCode, dto, actor);
  }

  /** UC-30-05. */
  @Get('portals/:portalCode/routes/:routeCode/views/:viewCode/data')
  @ApiOperation({
    summary:
      'Servir el read model al frontend (consent-aware, masking heredado)',
    description:
      'Exige cumplir el contrato de acceso de la vista (audiencia, permiso, propósito, feature flag y contextos de tenant/paciente); si no, responde el mismo 404 que una vista inexistente. Los parámetros distintos de los reservados son filtros declarados en el contrato de la vista.',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Se recorta al máximo de página de la definición',
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Código de orden' })
  @ApiQuery({
    name: 'purposeOfUse',
    required: false,
    description: 'Propósito de uso (concepto) que la ruta exige',
  })
  @ApiQuery({
    name: 'patientProfileId',
    required: false,
    description: 'Paciente de las vistas con contexto de paciente',
  })
  serveData(
    @Param('portalCode') portalCode: string,
    @Param('routeCode') routeCode: string,
    @Param('viewCode') viewCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query?: Record<string, unknown>,
  ): Promise<ServeViewDataResponseDto> {
    return this.service.serveData(
      portalCode,
      routeCode,
      viewCode,
      user,
      parseServeViewQuery(query),
    );
  }

  /** UC-30-11. */
  @Get('portals/:portalCode/routes/:routeCode/views/:viewCode/actions')
  @ApiOperation({
    summary: 'Derivar available_actions_json (estado + permiso + purpose)',
  })
  deriveActions(
    @Param('portalCode') portalCode: string,
    @Param('routeCode') routeCode: string,
    @Param('viewCode') viewCode: string,
    @Query('state') state: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Query('purposeOfUse') purposeOfUse?: string,
    @Query('patientProfileId') patientProfileId?: string,
  ): Promise<AvailableActionDto[]> {
    const { purposeOfUse: purpose, patientProfileId: patient } =
      parseServeViewQuery({ purposeOfUse, patientProfileId });
    return this.service.deriveAvailableActions(
      portalCode,
      routeCode,
      viewCode,
      state,
      user,
      { purposeOfUse: purpose, patientProfileId: patient },
    );
  }

  /** UC-30-09. */
  @Audited({
    action: 'USER_VIEW_PREFERENCES_UPSERTED',
    entity: 'user_view_preference',
    entityId: 'result.id',
  })
  @Put('views/:frontendPageViewId/preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardar preferencias de vista del usuario' })
  upsertPreferences(
    @Param('frontendPageViewId', ParseUUIDPipe) frontendPageViewId: string,
    @Body() dto: UpsertViewPreferencesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ViewPreferencesResponseDto> {
    return this.service.upsertPreferences(frontendPageViewId, dto, user);
  }
}
