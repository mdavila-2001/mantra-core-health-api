import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PriorAuthReadService, PriorAuthService } from '../services';
import {
  CreatePriorAuthRequestDto,
  CreateDeterminationDto,
  CreatedResourceDto,
  PriorAuthDetailDto,
  PriorAuthInboxQueryDto,
  PriorAuthListDto,
  ResourceStatusDto,
} from '../dto';

/**
 * Autorización previa (UC-26-04, UC-26-05). Capa fina que delega en
 * `PriorAuthService`.
 */
@ApiTags('insurance-prior-auth')
@ApiBearerAuth()
@Roles('BILLING', 'FINANCE')
@Controller()
export class PriorAuthController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(
    private readonly service: PriorAuthService,
    private readonly reader: PriorAuthReadService,
  ) {}

  /**
   * Bandeja de la aseguradora: las solicitudes de aprobación cuya cobertura es
   * suya. El servicio exige administrar el tenant de la aseguradora.
   */
  @Get('prior-authorization-requests/inbox')
  @Roles()
  @ApiOkResponse({ type: PriorAuthListDto })
  @ApiOperation({
    summary: 'Bandeja de solicitudes de aprobación (aseguradora)',
  })
  inbox(
    @Query() query: PriorAuthInboxQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PriorAuthListDto> {
    return this.reader.listInbox(query, actor);
  }

  /** Detalle con ítems y decisión vigente por ítem (aseguradora). */
  @Get('prior-authorization-requests/:id')
  @Roles()
  @ApiOkResponse({ type: PriorAuthDetailDto })
  @ApiOperation({
    summary: 'Detalle de una solicitud de aprobación (aseguradora)',
  })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PriorAuthDetailDto> {
    return this.reader.getForInsurer(id, actor);
  }

  /** UC-26-04. El servicio autoriza por membresía del prestador; mantiene el guard histórico para solicitudes genéricas. */
  @Post('prior-authorization-requests')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar autorización previa con items' })
  submit(
    @Body() dto: CreatePriorAuthRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.submitRequest(dto, actor);
  }

  /**
   * UC-26-05. Con `items`, la aseguradora decide APROBADO / NO APROBADO por
   * ítem (cláusula obligatoria al no aprobar) y la global se deriva.
   */
  @Post('prior-authorization-requests/:id/determinations')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir determinación de autorización previa' })
  determine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeterminationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.issueDetermination(id, dto, actor);
  }
}
