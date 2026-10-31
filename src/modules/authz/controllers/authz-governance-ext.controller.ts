import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  EndedResourceScopeGrantDto,
  EndResourceScopeGrantDto,
  ResourceScopeGrantIdParamDto,
  ResourceScopeGrantsPageDto,
  ResourceScopeGrantsQueryDto,
  RoleFieldPermissionsDto,
} from '../dto/authz-governance-ext.dto';
import { AuthzGovernanceExtService } from '../services/authz-governance-ext.service';

/**
 * Extensión del gobierno de acceso: lo que `AuthzGovernanceController` (quién puede qué,
 * revisiones, simulador) no cubre. Todo `SECURITY_ADMIN`.
 *
 * - `GET /authz/roles/:roleId/field-permissions` — reglas de enmascaramiento de un rol (la
 *   escritura es `PUT` del mismo recurso en `AuthzRolesController`).
 * - `GET /authz/resource-scope-grants` — permisos por alcance de recurso de CUALQUIER sujeto
 *   (usuario, rol o servicio), con filtros; el `GET /authz/users/:userId/resource-scope-grants` del
 *   controlador de gobierno sólo muestra los de un usuario.
 * - `DELETE /authz/resource-scope-grants/:grantId` — termina la vigencia (no borra la fila).
 *
 * A diferencia del controlador de gobierno, que exige administrador de plataforma, éste admite a
 * un `SECURITY_ADMIN` con alcance de organización: el servicio acota cada consulta y cada
 * escritura a su tenant, y lo ajeno responde el mismo 404 que lo inexistente.
 */
@ApiTags('authz-governance')
@ApiBearerAuth()
@Controller('authz')
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
export class AuthzGovernanceExtController {
  constructor(private readonly ext: AuthzGovernanceExtService) {}

  @Get('roles/:roleId/field-permissions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Reglas de enmascaramiento de campos de un rol' })
  @ApiResponse({ status: 200, type: RoleFieldPermissionsDto })
  @ApiResponse({
    status: 404,
    description: 'ROLE_NOT_FOUND (también si el rol es de otra organización)',
  })
  fieldPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ext.roleFieldPermissions(roleId, actor);
  }

  @Get('resource-scope-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Permisos por alcance de recurso, paginados' })
  @ApiResponse({ status: 200, type: ResourceScopeGrantsPageDto })
  scopeGrants(
    @Query() q: ResourceScopeGrantsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ext.resourceScopeGrants(q, actor);
  }

  @Audited({
    action: 'RESOURCE_SCOPE_GRANT_ENDED',
    entity: 'resource_scope_grant',
    entityId: 'param:grantId',
  })
  @Delete('resource-scope-grants/:grantId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminar la vigencia de un permiso por alcance de recurso',
    description:
      'Un permiso de efecto DENY exige `reason` en el cuerpo (422 RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED); en un ALLOW es opcional. Con alcance de tenant sólo se alcanzan los permisos del propio tenant.',
  })
  @ApiResponse({ status: 200, type: EndedResourceScopeGrantDto })
  @ApiResponse({
    status: 404,
    description:
      'RESOURCE_SCOPE_GRANT_NOT_FOUND (también si es de otro tenant)',
  })
  @ApiResponse({
    status: 409,
    description: 'RESOURCE_SCOPE_GRANT_ALREADY_ENDED',
  })
  @ApiResponse({
    status: 422,
    description: 'RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED',
  })
  endScopeGrant(
    @Param() p: ResourceScopeGrantIdParamDto,
    @Body() dto: EndResourceScopeGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ext.endResourceScopeGrant(p.grantId, dto, actor);
  }
}
