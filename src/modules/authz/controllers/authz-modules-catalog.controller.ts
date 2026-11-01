import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  ModulesCatalogDto,
  ModulesCatalogQueryDto,
} from '../dto/authz-modules-catalog.dto';
import { AuthzModulesCatalogService } from '../services/authz-modules-catalog.service';

/**
 * RBAC por módulo: permisos finos agrupados por recurso y acción, los roles que los tienen y los
 * huecos (rutas protegidas sólo por un rol grueso). Sólo lectura. Es una vista de plataforma
 * —atraviesa tenants—, así que no exige un tenant resuelto.
 */
@ApiTags('authz-catalog')
@ApiBearerAuth()
@Controller('authz')
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
export class AuthzModulesCatalogController {
  constructor(private readonly catalog: AuthzModulesCatalogService) {}

  @Get('catalog/modules')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Catálogo RBAC por módulo, con sus huecos',
    description:
      'Por módulo: permisos por recurso y acción canónica (`read, list, create, update, delete, export, approve, reject, assign, configure, audit`), los roles que los tienen y los huecos detectados en las rutas. Los códigos propuestos no están sembrados. `SUPERADMIN` entra por comodín; el resto recibe 403. Un `SECURITY_ADMIN` con alcance de organización sólo ve los roles de sistema y los de su organización.',
  })
  @ApiResponse({ status: 200, type: ModulesCatalogDto })
  @ApiResponse({ status: 403, description: 'Rol insuficiente' })
  modules(
    @Query() query: ModulesCatalogQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ModulesCatalogDto> {
    return this.catalog.catalog(query, actor);
  }
}
