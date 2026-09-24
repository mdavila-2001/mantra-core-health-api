import {
  ArgumentMetadata,
  BadRequestException,
  Controller,
  Get,
  Header,
  Injectable,
  Param,
  PipeTransform,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { InsurancePortabilityService } from '../services/insurance-portability.service';
import { PortabilityVerificationResponseDto } from '../dto';

const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };
const SHA256_HEX_PATTERN = /^[0-9a-fA-F]{64}$/;

/**
 * Valida que el parámetro sea un hexadecimal SHA-256 de 64 caracteres y lo
 * normaliza a minúsculas.
 *
 * El sello se persiste en minúsculas (`createHash(...).digest('hex')` en
 * `InsurancePortabilityService.export`), pero el mismo hash llega también
 * tecleado a mano o transcrito de un lector de QR, donde las mayúsculas son
 * tan comunes como las minúsculas (CA-04: «acepta hashes en mayúsculas o
 * minúsculas insensiblemente»). Un formato inválido responde 400 sin llegar
 * a consultar la base — mismo criterio que `ParseUUIDPipe` para los `:id`
 * del resto de la API.
 */
@Injectable()
export class ParseShaHashPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!SHA256_HEX_PATTERN.test(value)) {
      throw new BadRequestException(
        `${metadata.data ?? 'valor'} debe ser un hash SHA-256 hexadecimal de 64 caracteres`,
      );
    }
    return value.toLowerCase();
  }
}

/**
 * Verificación pública de un certificado de portabilidad, bajo
 * `/public/portability` (subtarea 3.3, molde exacto de
 * `ClinicalPrescriptionsPublicController` — B.3).
 *
 * ## Qué resuelve
 *
 * El QR impreso en el certificado apunta acá: la pregunta es «¿este
 * certificado es real, y con qué se emitió?», no «¿qué historial clínico
 * tiene esta persona?». `InsurancePortabilityService.verify` nunca lee ni el
 * nombre del titular ni un solo reclamo — sólo confirma que el manifiesto
 * existe y de qué tipo es.
 *
 * ## Por qué `no-store`
 *
 * Igual que el verify de recetas: `PublicCacheInterceptor` pondría
 * `public, max-age=…` a toda ruta `@Public()`, y acá conviene que la
 * respuesta no quede cacheada — declararlo en el handler gana sobre el
 * interceptor.
 */
@ApiTags('insurance-portability-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class InsurancePortabilityPublicController {
  constructor(private readonly service: InsurancePortabilityService) {}

  @Public()
  @Get('public/portability/verify/:manifestHash')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Verificar la autenticidad de un certificado de portabilidad por su sello',
    description:
      'Sin autenticación y sin PHI: confirma que el certificado existe y con qué se emitió.',
  })
  @ApiOkResponse({ type: PortabilityVerificationResponseDto })
  @ApiNotFoundResponse({
    description: 'No existe un certificado con ese sello',
  })
  verify(
    @Param('manifestHash', ParseShaHashPipe) manifestHash: string,
  ): Promise<PortabilityVerificationResponseDto> {
    return this.service.verify(manifestHash);
  }
}
