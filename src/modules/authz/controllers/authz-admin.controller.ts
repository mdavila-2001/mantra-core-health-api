import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  InternalUsersPageDto,
  InternalUsersQueryDto,
  PermissionsPageDto,
  PermissionsQueryDto,
  RevokedAssignmentDto,
  RoleAssignmentParamsDto,
  RoleIdParamDto,
  RolePermissionsDto,
  UserIdParamDto,
  UserRoleAssignmentsDto,
} from '../dto/authz-admin.dto';
import { AuthzAdminReadService } from '../services/authz-admin-read.service';
import { AuthzAssignmentRevocationService } from '../services/authz-assignment-revocation.service';
import { RequirePermission } from '../../../common/auth/require-permission.decorator';

/**
 * Administración de acceso: las lecturas y la revocación que le faltaban a `/authz` para operar
 * usuarios, roles y permisos desde la consola. Todo es `SECURITY_ADMIN`.
 *
 * Es una vista de plataforma —atraviesa tenants—, así que no exige un tenant resuelto.
 */
@ApiTags('authz-admin')
@ApiBearerAuth()
@Controller('authz')
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
export class AuthzAdminController {
  constructor(
    private readonly read: AuthzAdminReadService,
    private readonly revocation: AuthzAssignmentRevocationService,
  ) {}

  @Get('users/:userId/role-assignments')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Asignaciones de rol de un usuario, activas o no',
    description:
      '`isEffective` dice cuáles llegan hoy al token. `appliesGlobally` dice si un rol de ámbito global se asignó sin tenant, que es la condición para que autorice en las rutas sin tenant.',
  })
  @ApiResponse({ status: 200, type: UserRoleAssignmentsDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  assignmentsOf(@Param() p: UserIdParamDto) {
    return this.read.assignmentsOf(p.userId);
  }

  @Audited({
    action: 'ROLE_ASSIGNMENT_REVOKED',
    entity: 'user_role_assignment',
    entityId: 'param:assignmentId',
  })
  @Delete('users/:userId/role-assignments/:assignmentId')
  @Roles('SECURITY_ADMIN')
  @RequirePermission('authz.users_role_assignments.delete', {
    resourceIdParam: 'assignmentId',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Revocar una asignación de rol (revocación lógica: la fila queda como historia)',
  })
  @ApiResponse({ status: 200, type: RevokedAssignmentDto })
  @ApiResponse({ status: 404, description: 'No existe, o es de otro usuario' })
  @ApiResponse({ status: 412, description: 'La asignación no está activa' })
  revoke(
    @Param() p: RoleAssignmentParamsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.revocation.revoke(p.userId, p.assignmentId, actor);
  }

  @Get('permissions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Catálogo de permisos, paginado por código' })
  @ApiResponse({ status: 200, type: PermissionsPageDto })
  permissions(@Query() q: PermissionsQueryDto) {
    return this.read.permissions(q);
  }

  @Get('roles/:roleId/permissions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Permisos activos de un rol, con su efecto y ámbito',
  })
  @ApiResponse({ status: 200, type: RolePermissionsDto })
  @ApiResponse({ status: 404, description: 'No existe el rol' })
  rolePermissions(@Param() p: RoleIdParamDto) {
    return this.read.rolePermissions(p.roleId);
  }

  @Get('internal-users')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Usuarios internos con sus roles',
    description:
      'Sin `roleCode`: quienes tienen un rol activo de ámbito global o un rol global de plataforma (`SECURITY_ADMIN`, `SUPERADMIN`). Con `roleCode`: quienes tienen ese rol activo en cualquier ámbito.',
  })
  @ApiResponse({ status: 200, type: InternalUsersPageDto })
  internalUsers(@Query() q: InternalUsersQueryDto) {
    return this.read.internalUsers(q);
  }
}
