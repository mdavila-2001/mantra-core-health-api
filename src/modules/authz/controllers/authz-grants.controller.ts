import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzGrantsService } from '../services';
import {
  CreateRoleAssignmentDto,
  CreatePermissionGrantDto,
  CreateResourceScopeGrantDto,
  AuthzIdResponseDto,
} from '../dto';

/** UC-06-04 (role-assignments), UC-06-05 (permission-grants), UC-06-09 (resource-scope-grants). */
@ApiTags('authz-grants')
@ApiBearerAuth()
@Controller('authz')
export class AuthzGrantsController {
  constructor(private readonly grantsService: AuthzGrantsService) {}

  /** UC-06-04. */
  @Post('users/:userId/role-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar un rol a un usuario con vigencia y ámbito' })
  assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateRoleAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.grantsService.assignRole(userId, dto, actor);
  }

  /** UC-06-05. */
  @Post('users/:userId/permission-grants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar una excepción de permiso por usuario' })
  grantPermission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreatePermissionGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.grantsService.grantPermission(userId, dto, actor);
  }

  /** UC-06-09. */
  @Post('resource-scope-grants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar acceso a un recurso específico (grant polimórfico)' })
  grantResourceScope(
    @Body() dto: CreateResourceScopeGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.grantsService.grantResourceScope(dto, actor);
  }
}
