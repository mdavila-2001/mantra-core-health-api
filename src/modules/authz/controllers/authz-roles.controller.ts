import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzRolesService } from '../services';
import {
  CreateRoleDto,
  SetRolePermissionsDto,
  SetFieldPermissionsDto,
  RoleResponseDto,
  AuthzStatusResultDto,
} from '../dto';

/** UC-06-03 (roles+permisos) y UC-06-08 (enmascaramiento de campos por rol). */
@ApiTags('authz-roles')
@ApiBearerAuth()
@Controller('authz/roles')
export class AuthzRolesController {
  constructor(private readonly rolesService: AuthzRolesService) {}

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
