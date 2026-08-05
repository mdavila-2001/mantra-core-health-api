import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ConsentSweepService } from '../services';
import { ExpirationSweepResultDto } from '../dto';

/**
 * Endpoint interno del worker de consentimiento: `/consent/internal/expiration-sweep`.
 * Protegido por rol administrativo; en producción lo invoca un scheduler bajo lock
 * distribuido.
 */
@ApiTags('consent-internal')
@ApiBearerAuth()
@Controller('consent/internal')
export class ConsentSweepController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param sweepService - Valor de sweep service requerido por la operación.
   */
  constructor(private readonly sweepService: ConsentSweepService) {}

  /** UC-07-11. */
  @Post('expiration-sweep')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expirar consentimientos y autorizaciones vencidas (barrido)',
  })
  sweep(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpirationSweepResultDto> {
    return this.sweepService.sweep(actor);
  }
}
