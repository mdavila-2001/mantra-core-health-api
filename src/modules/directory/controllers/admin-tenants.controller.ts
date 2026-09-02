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
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { DirectoryReadService, DirectoryTenantsService } from '../services';
import {
  CreateTenantDto,
  SearchTenantsResponseDto,
  StatusResultDto,
  SuspendTenantDto,
  TenantResponseDto,
  UpdateTenantPublicProfileDto,
  VerifyTenantDto,
} from '../dto';

/** Tope de organizaciones por página cuando el cliente no pide uno. */
const DEFAULT_TENANTS_PAGE_SIZE = 50;

/**
 * Endpoints de plataforma sobre `/admin/tenants`. Operaciones fuera del contexto
 * RLS de tenant (aprovisionamiento, verificación, suspensión). Capa fina que
 * delega en `DirectoryTenantsService`.
 */
@ApiTags('directory-admin-tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
export class AdminTenantsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param tenantsService - Valor de tenants service requerido por la operación.
   * @param readService - Cara de lectura del directorio.
   */
  constructor(
    private readonly tenantsService: DirectoryTenantsService,
    private readonly readService: DirectoryReadService,
  ) {}

  /**
   * UC-04-01 (cara de lectura): listado de organizaciones de la plataforma.
   *
   * Va antes que las rutas con parámetro para que ninguna capture un segmento fijo.
   *
   * @param query - Texto sobre código, razón social o nombre comercial.
   * @param statusConceptId - Estado al que acotar.
   * @param cursor - Cursor opaco de la página anterior.
   * @param limit - Tope de filas.
   * @returns Página de organizaciones.
   */
  @Get()
  @Roles('SUPERADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listado paginado de organizaciones' })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Texto a buscar en el código, la razón social o el nombre comercial',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Concepto de estado al que acotar',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Tope de resultados (por defecto ${DEFAULT_TENANTS_PAGE_SIZE})`,
  })
  searchTenants(
    @Query('q') query?: string,
    @Query('status', new ParseUUIDPipe({ optional: true }))
    statusConceptId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchTenantsResponseDto> {
    return this.readService.searchTenants({
      query,
      statusConceptId,
      cursor,
      limit: limit ?? DEFAULT_TENANTS_PAGE_SIZE,
    });
  }

  /** UC-04-01. */
  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aprovisionar un tenant raíz con su membership owner',
  })
  provision(
    @Body() dto: CreateTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.provision(dto, actor);
  }

  /** UC-04-02. */
  @Post(':tenantId/verification')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar y activar un tenant' })
  verify(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: VerifyTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.verify(tenantId, dto, actor);
  }

  /**
   * Llena la vitrina pública de la organización.
   *
   * `PUT` y no `PATCH` porque es idempotente y la pantalla que la edita no
   * necesita saber si ya había algo escrito; los campos omitidos se conservan,
   * que es la misma regla que `PUT /community/profiles/me`.
   *
   * @param tenantId - La organización.
   * @param dto - Titular, presentación, logo y portada.
   * @param actor - Quién lo hace.
   * @returns La organización.
   */
  @Put(':tenantId/public-profile')
  @Roles('SUPERADMIN', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar la ficha pública de una organización verificada',
  })
  updatePublicProfile(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: UpdateTenantPublicProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.updatePublicProfile(tenantId, dto, actor);
  }

  /** UC-04-10. */
  @Post(':tenantId/suspend')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender un tenant con cascada de revocación' })
  suspend(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.tenantsService.suspend(tenantId, dto, actor);
  }
}
