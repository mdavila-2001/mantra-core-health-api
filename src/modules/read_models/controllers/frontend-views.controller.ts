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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { FrontendViewsService } from '../services';
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
  })
  serveData(
    @Param('portalCode') portalCode: string,
    @Param('routeCode') routeCode: string,
    @Param('viewCode') viewCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ServeViewDataResponseDto> {
    return this.service.serveData(portalCode, routeCode, viewCode, user);
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
  ): Promise<AvailableActionDto[]> {
    return this.service.deriveAvailableActions(
      portalCode,
      routeCode,
      viewCode,
      state,
      user,
    );
  }

  /** UC-30-09. */
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
