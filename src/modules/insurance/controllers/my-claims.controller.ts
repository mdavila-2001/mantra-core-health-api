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
} from '../../../common';
import { MyClaimListDto } from '../dto/my-claims.dto';
import { MyClaimsService } from '../services/my-claims.service';

/**
 * Autoservicio P56: el titular puede no pertenecer a ninguna organización.
 * Excepción localizada a TenantAgnostic: la rama de centro reconstruye el
 * contexto y RLS sólo después de verificar la membresía; no habilita barridos.
 */
@ApiTags('my-insurance-claims')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('insurance/my-claims')
export class MyClaimsController {
  constructor(private readonly service: MyClaimsService) {}

  @Get()
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
