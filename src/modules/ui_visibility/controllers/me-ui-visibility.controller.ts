import { Controller, Get, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import {
  UiVisibilityMeService,
  pickVisibilityTenant,
} from '../services/ui-visibility-me.service';

/**
 * Visibilidad de la propia persona. Cualquier usuario autenticado, sin rol: sólo ve su propia
 * resolución (el sujeto sale del token, no de la petición). `@TenantAgnostic` porque la
 * presentación no debe fallar en una cuenta sin organización ni en la selección de organización;
 * la organización se toma de `X-Tenant-Id` sólo si es una membresía del token.
 */
@ApiTags('me-ui-visibility')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('me/ui-visibility')
export class MeUiVisibilityController {
  constructor(private readonly service: UiVisibilityMeService) {}

  @Get()
  @ApiOperation({
    summary: 'Claves ocultas para quien llama',
    description:
      'Sólo lo oculto; lo demás es visible. La visibilidad no es autorización: la API sigue autorizando cada petición.',
  })
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.service.resolveMine(
      user,
      pickVisibilityTenant(tenantHeader, user),
    );
  }
}
