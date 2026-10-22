import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { PrescriptionPdfService } from '../services';
import { PrescriptionVerificationResponseDto } from '../dto';

/**
 * Mismo límite por IP que el resto de la superficie pública (P3): holgado
 * para una persona escaneando el QR de su receta, estrecho para un raspador.
 */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * Verificación pública de una receta, bajo `/public/prescriptions` (B.3).
 *
 * ## Qué resuelve
 *
 * El QR impreso en el PDF oficial apunta a esta ruta: la pregunta que
 * responde es «¿esta receta es real, y sigue vigente?», no «¿qué le
 * recetaron a quién?». `PrescriptionPdfService.verify` nunca lee ni el
 * nombre del paciente ni el del medicamento.
 *
 * ## Por qué `no-store` y no el `Cache-Control` genérico de lo público
 *
 * `PublicCacheInterceptor` (P3) pone `public, max-age=…` a toda ruta
 * `@Public()` — pensado para un directorio que cambia poco. Acá invalidar
 * (firmar, emitir, anular una receta) tiene que verse de inmediato: el
 * interceptor respeta un `Cache-Control` que el propio handler ya fijó, así
 * que declararlo acá gana.
 */
@ApiTags('clinical-prescriptions-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class ClinicalPrescriptionsPublicController {
  constructor(
    private readonly prescriptionPdfService: PrescriptionPdfService,
  ) {}

  @Public()
  @Get('public/prescriptions/:id/verify')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Verificar la autenticidad de una receta por su sello',
    description:
      'Sin autenticación y sin PHI: recalcula el sello SHA-256 y devuelve el estado y la matrícula del prescriptor.',
  })
  @ApiOkResponse({ type: PrescriptionVerificationResponseDto })
  @ApiNotFoundResponse({ description: 'La receta no existe' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PrescriptionVerificationResponseDto> {
    return this.prescriptionPdfService.verify(id);
  }
}
