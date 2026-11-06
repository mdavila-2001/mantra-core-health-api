import { Controller, Get, Header, Headers, Ip, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { OpenPrescriptionShareUseCase } from '../../application/prescription-shares/open-prescription-share.use-case';
import { PharmacyPrescriptionShareDto } from '../dto/pharmacy-prescription-share.dto';

/**
 * FAR-02 · la farmacia abre la receta que el paciente le compartió por
 * enlace (`CONTRATO.md` §2).
 *
 * Solo `PHARMACY_STAFF`: el rol que materializa la membresía en un tenant
 * `PHARMACY`. Un paciente, una médica o un admin de clínica reciben 403 del
 * guard de roles. El alcance es el tenant de la farmacia, igual que la
 * bandeja. El registro de acceso queda con ese tenant: es lo que dice **qué
 * farmacia** abrió la receta, porque los usos del enlace no tienen actor.
 * `@AccessLogged` asienta cada intento antes del handler (sin paciente: la
 * ruta solo trae el token, que no es un UUID); el caso de uso asienta la
 * lectura servida con el paciente y el `shareId`. `pino-options.ts` redacta
 * la ruta en el log.
 *
 * `no-store`: que el paciente revoque tiene que verse en la próxima apertura.
 */
@ApiTags('pharmacy-prescription-shares')
@ApiBearerAuth()
@Controller('pharmacy/prescription-shares')
export class PharmacyPrescriptionSharesController {
  /**
   * @param openShare - Caso de uso de apertura de la receta compartida.
   */
  constructor(private readonly openShare: OpenPrescriptionShareUseCase) {}

  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @AccessLogged({ resourceType: 'PRESCRIPTION_SHARE' })
  @Roles('PHARMACY_STAFF')
  @ApiOperation({
    summary: 'Abrir una receta compartida desde la farmacia (FAR-02)',
    description:
      'Registra la apertura. Los ítems vigentes de la receta, cruzados por fármaco con los productos de las farmacias del tenant y su disponibilidad por sede. Del paciente, solo iniciales y los últimos 3 dígitos del documento.',
  })
  @ApiOkResponse({ type: PharmacyPrescriptionShareDto })
  @ApiForbiddenResponse({ description: 'La sesión no es de una farmacia' })
  @ApiNotFoundResponse({
    description: 'El enlace no existe, o el tenant no tiene farmacia',
  })
  @ApiGoneResponse({
    description:
      'Enlace vencido o revocado (`reason` `PRESCRIPTION_SHARE_EXPIRED` o `PRESCRIPTION_SHARE_REVOKED`)',
  })
  open(
    @Param('token') token: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() sourceIp?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<PharmacyPrescriptionShareDto> {
    return this.openShare.execute(token, actor.id, {
      sourceIp: sourceIp ?? null,
      userAgent: userAgent ?? null,
    });
  }
}
