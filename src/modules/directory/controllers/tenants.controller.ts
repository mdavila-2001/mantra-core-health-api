import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  DirectoryBranchesService,
  DirectoryMembershipsService,
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
} from '../dto';

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
   */
  constructor(
    private readonly tenantsService: DirectoryTenantsService,
    private readonly branchesService: DirectoryBranchesService,
    private readonly membershipsService: DirectoryMembershipsService,
  ) {}

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
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
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
  @Roles('SECURITY_ADMIN')
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
