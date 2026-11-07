import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import { UsersDirectoryQueryDto } from '../dto/users-directory-query.dto';
import { UsersDirectoryPageDto } from '../dto/users-directory-response.dto';
import { AuthzUsersDirectoryService } from '../services/authz-users-directory.service';

/**
 * Read-only directory of accounts by kind. `SECURITY_ADMIN` is held to the
 * organization of the request; only a platform `SUPERADMIN` crosses tenants,
 * which is why the platform opt-in lists `SUPERADMIN` alone.
 */
@ApiTags('authz-admin')
@ApiBearerAuth()
@Controller('authz/users')
@PlatformTenantOptional('SUPERADMIN')
export class AuthzUsersDirectoryController {
  constructor(private readonly directory: AuthzUsersDirectoryService) {}

  @Get('directory')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Directorio de usuarios por tipo, con roles y permisos efectivos',
    description:
      'Paginado por cursor. Sin contraseñas, documentos ni correo completo. Cada consulta queda sellada en la auditoría.',
  })
  @ApiOkResponse({ type: UsersDirectoryPageDto })
  list(
    @Query() q: UsersDirectoryQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.directory.list(actor, req.resolvedTenantId, q);
  }
}
