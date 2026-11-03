import { Controller, Get, Headers } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
  Roles,
} from '../../../../common';
import { MyClaimListDto } from '../dto/my-claims.dto';
import { MyClaimsService } from '../../application/services/my-claims.service';

/**
 * Autoservicio P56: el titular puede no pertenecer a ninguna organización.
 * Excepción localizada a TenantAgnostic: la rama de centro reconstruye el
 * contexto y RLS sólo después de verificar la membresía; no habilita barridos.
 *
 * `@Roles()` vacío (O3-3): el sujeto sale del token (perfil profesional o de
 * paciente) y la vista de centro exige que el tenant declarado sea una
 * membresía de la sesión.
 */
@ApiTags('my-insurance-claims')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('insurance/my-claims')
export class MyClaimsController {
  constructor(private readonly service: MyClaimsService) {}

  @Get()
  @Roles()
  @ApiOperation({
    summary: 'Solicitudes de seguro propias, con su dictamen vigente',
  })
  @ApiOkResponse({ type: MyClaimListDto })
  @ApiUnauthorizedResponse({ description: 'Sin sesión válida.' })
  @ApiForbiddenResponse({
    description: 'El tenant seleccionado no es una membresía de la sesión.',
  })
  listMyClaims(
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('x-tenant-id') tenantId?: string,
  ): Promise<MyClaimListDto> {
    return this.service.list(actor, tenantId);
  }
}
