import { Controller, Get, Header, Headers, Ip, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { PrescriptionSharesService } from '../services/prescription-shares.service';
import { PublicPrescriptionShareDto } from '../dto/prescription-shares.dto';

/**
 * El mismo límite por IP que el verify público de la receta
 * (`clinical-prescriptions-public.controller.ts`): holgado para quien abre el
 * enlace, estrecho para quien prueba tokens.
 */
export const PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT = {
  default: { limit: 60, ttl: 60_000 },
};

/**
 * Vista sin sesión del enlace compartido de una receta (S-4, D-2): si es
 * válida, quién la emitió y cuándo. **Nada del paciente ni de los fármacos.**
 *
 * Cada apertura queda en `shared_access_link_uses` con la IP y el agente del
 * cliente (S-4); ver `PrescriptionSharesService.readPublic`.
 *
 * `no-store` gana sobre el `Cache-Control` público genérico: revocar tiene
 * que verse en la próxima apertura. El token viaja en la ruta y
 * `pino-options.ts` lo redacta en el log.
 */
@ApiTags('clinical-prescription-shares-public')
@Throttle(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT)
@Controller()
export class PrescriptionSharesPublicController {
  constructor(private readonly service: PrescriptionSharesService) {}

  @Public()
  @Get('public/prescription-shares/:token')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Comprobar un enlace de receta compartida',
    description:
      'Sin autenticación y sin datos del paciente ni de los fármacos: estado, emisión, nombre y matrícula del prescriptor.',
  })
  @ApiOkResponse({ type: PublicPrescriptionShareDto })
  @ApiNotFoundResponse({ description: 'El enlace no existe' })
  read(
    @Param('token') token: string,
    @Ip() sourceIp?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<PublicPrescriptionShareDto> {
    return this.service.readPublic(token, { sourceIp, userAgent });
  }
}
