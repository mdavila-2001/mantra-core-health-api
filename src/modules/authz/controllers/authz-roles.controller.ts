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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AuthzRolesService } from '../services';
import {
  CreateRoleDto,
  SetRolePermissionsDto,
  SetFieldPermissionsDto,
  RoleResponseDto,
  AssignableRoleDto,
  AuthzStatusResultDto,
} from '../dto';

/** UC-06-03 (roles+permisos) y UC-06-08 (enmascaramiento de campos por rol). */
@ApiTags('authz-roles')
@ApiBearerAuth()
@Controller('authz/roles')
export class AuthzRolesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param rolesService - Valor de roles service requerido por la operación.
   */
  constructor(private readonly rolesService: AuthzRolesService) {}

  /**
   * Catálogo de roles que se pueden asignar a un usuario.
   *
   * Es la contraparte de lectura de `POST /authz/users/:userId/role-assignments`:
   * devuelve el `code` —el que exige `@Roles(...)`— junto al id, de modo que
   * asignar un rol no obligue a conocer de antemano un uuid que ninguna
   * operación devolvía.
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los roles asignables' })
  listAssignable(): Promise<AssignableRoleDto[]> {
    return this.rolesService.listAssignable(getCurrentTenantId());
  }

  /** UC-06-03. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Componer un rol (con herencia opcional)' })
  createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.createRole(dto, actor);
  }

  /** UC-06-03. */
  @Put(':roleId/permissions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar permisos al rol (reemplaza los activos)' })
  setPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: SetRolePermissionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.setPermissions(roleId, dto, actor);
  }

  /** UC-06-08. */
  @Put(':roleId/field-permissions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar el enmascaramiento de campos del rol' })
  setFieldPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: SetFieldPermissionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.rolesService.setFieldPermissions(roleId, dto, actor);
  }
}
