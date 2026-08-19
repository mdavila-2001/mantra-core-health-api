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
import {
  DirectoryBranchesService,
  DirectoryMembershipsService,
  DirectoryReadService,
  DirectoryTenantsService,
} from '../services';
import {
  BranchAssignmentDto,
  BranchMembershipResponseDto,
  BranchResponseDto,
  ChangeMembershipRoleDto,
  CreateBranchDto,
  CreateChildTenantDto,
  CreateMembershipDto,
  MembershipResponseDto,
  StatusResultDto,
  TenantResponseDto,
  TransferMembershipDto,
  ListBranchAssignmentsResponseDto,
  ListBranchesResponseDto,
  SearchMembershipsResponseDto,
  SearchTenantsResponseDto,
  TenantDetailResponseDto,
  MyOrganizationsResponseDto,
  UpdateTenantDto,
} from '../dto';

/** Tope de filas por página cuando el cliente no pide uno. */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Endpoints con scope de tenant sobre `/tenants/{tenantId}`: sub-tenants, branches
 * y ciclo de vida de membresías. Capa fina que delega en los servicios de dominio.
 */
@ApiTags('directory-tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param tenantsService - Valor de tenants service requerido por la operación.
   * @param branchesService - Valor de branches service requerido por la operación.
   * @param membershipsService - Valor de memberships service requerido por la operación.
   * @param readService - Cara de lectura del directorio, con el alcance por organización.
   */
  constructor(
    private readonly tenantsService: DirectoryTenantsService,
    private readonly branchesService: DirectoryBranchesService,
    private readonly membershipsService: DirectoryMembershipsService,
    private readonly readService: DirectoryReadService,
  ) {}

  /**
   * Ficha de una organización.
   *
   * Estas lecturas no exigen rol global: el alcance lo decide la membresía activa
   * en la propia organización (`assertCanRead`). Pedir `SECURITY_ADMIN` para leer
   * dejaría a la organización sin poder consultarse a sí misma, que es el mismo
   * problema que `TenantAdministrationService` corrigió para las escrituras.
   *
   * @param tenantId - Organización a leer.
   * @param actor - Quien pide la lectura.
   * @returns Ficha de la organización.
   */
  /**
   * TP-1: las organizaciones del actor.
   *
   * Va declarada **antes** que `:tenantId`: Nest resuelve por orden y el
   * parámetro capturaría `me` —y `ParseUUIDPipe` lo rechazaría con un 400 que
   * no explica nada—.
   *
   * Sin `@Roles`: lo único que puede devolver es lo del propio actor, porque
   * el sujeto sale de la sesión y no hay parámetro que apunte a otro. Una
   * lista vacía es una respuesta legítima —quien no pertenece a ninguna
   * organización no tiene panel—, no un 403.
   */
  @Get('me')
  @ApiOperation({
    summary: 'Las organizaciones del actor, con su rol en cada una',
    description:
      'Con esto el panel de la organización puede abrirse sin que la pantalla ' +
      'conozca de antemano el identificador de la organización.',
  })
  listMyTenants(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyOrganizationsResponseDto> {
    return this.readService.listMyTenants(actor);
  }

  /**
   * TP-1: la organización corrige sus propios datos.
   *
   * Sólo owner o admin **de esa** organización (o la plataforma): un `staff`
   * la ve y no la edita.
   */
  @Patch(':tenantId')
  @ApiOperation({ summary: 'Editar los datos de la propia organización' })
  updateTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.updateTenant(tenantId, dto, actor);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Ficha de una organización' })
  getTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantDetailResponseDto> {
    return this.readService.getTenantById(tenantId, actor);
  }

  /** UC-04-03 (cara de lectura). */
  @Get(':tenantId/child-tenants')
  @ApiOperation({ summary: 'Sub-organizaciones de una organización' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listChildTenants(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchTenantsResponseDto> {
    return this.readService.listChildTenants(
      tenantId,
      { cursor, limit: limit ?? DEFAULT_PAGE_SIZE },
      actor,
    );
  }

  /** UC-04-02 (cara de lectura). */
  @Get(':tenantId/branches')
  @ApiOperation({ summary: 'Sucursales de la organización' })
  listBranches(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListBranchesResponseDto> {
    return this.readService.listBranches(tenantId, actor);
  }

  /** UC-04-04 (cara de lectura). */
  @Get(':tenantId/memberships')
  @ApiOperation({ summary: 'Plantilla de la organización' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Concepto de estado al que acotar',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listMemberships(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('status', new ParseUUIDPipe({ optional: true }))
    statusConceptId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchMembershipsResponseDto> {
    return this.readService.listMemberships(
      tenantId,
      { statusConceptId, cursor, limit: limit ?? DEFAULT_PAGE_SIZE },
      actor,
    );
  }

  /** UC-04-05 (cara de lectura). */
  @Get(':tenantId/memberships/:membershipId/branch-assignments')
  @ApiOperation({ summary: 'Sucursales asignadas a una membresía' })
  listBranchAssignments(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListBranchAssignmentsResponseDto> {
    return this.readService.listBranchAssignments(
      tenantId,
      membershipId,
      actor,
    );
  }

  /** UC-04-03. */
  @Post(':tenantId/child-tenants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una organización hija / sub-tenant' })
  createChild(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateChildTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.createChild(tenantId, dto, actor);
  }

  /** UC-04-04. */
  @Post(':tenantId/branches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una branch / sede física con geolocalización',
  })
  createBranch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    return this.branchesService.create(tenantId, dto, actor);
  }

  /** UC-04-05. */
  @Post(':tenantId/memberships')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Incorporar un usuario al tenant (membership)' })
  invite(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateMembershipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.invite(tenantId, dto, actor);
  }

  /** UC-04-06. */
  @Post(':tenantId/memberships/:membershipId/branch-assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar la membresía a una branch' })
  assignBranch(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: BranchAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BranchMembershipResponseDto> {
    return this.membershipsService.assignBranch(
      tenantId,
      membershipId,
      dto,
      actor,
    );
  }

  /** UC-04-07. */
  @Post(':tenantId/memberships/:membershipId/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transferir la membresía entre branches' })
  transfer(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: TransferMembershipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.membershipsService.transfer(tenantId, membershipId, dto, actor);
  }

  /** UC-04-08. */
  @Patch(':tenantId/memberships/:membershipId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar rol / scope de la membresía' })
  changeRole(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: ChangeMembershipRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.changeRole(
      tenantId,
      membershipId,
      dto,
      actor,
    );
  }

  /** UC-04-09. */
  @Post(':tenantId/memberships/:membershipId/offboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar / offboarding de un miembro' })
  offboard(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.membershipsService.offboard(tenantId, membershipId, actor);
  }
}
