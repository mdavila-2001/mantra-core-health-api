import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { NotAudited, Public, TenantAgnostic } from '../../../../common';
import { TelemetryClientErrorsService } from '../../application/services/telemetry-client-errors.service';
import {
  CaptureClientErrorsDto,
  ClientErrorsResponseDto,
} from '../dto/client-error.dto';

/** 60 lotes por minuto por IP (el cubo del throttler global es la IP). */
const CLIENT_ERRORS_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * `POST /telemetry/client-errors`: errores del portal web y de la app móvil.
 * Pública (un error de la pantalla de acceso no tiene sesión), limitada y sin
 * auditoría; con token válido el servidor añade al actor, sin él guarda el
 * error sin persona.
 */
@ApiTags('telemetry-client-errors')
@Throttle(CLIENT_ERRORS_RATE_LIMIT)
@Controller('telemetry')
export class TelemetryClientErrorsController {
  constructor(private readonly service: TelemetryClientErrorsService) {}

  @NotAudited(
    'Pública y de alto volumen: no hay actor garantizado (audit_log.user_id es NOT NULL) y cada fila ya es el registro de lo ocurrido en telemetry.client_error_events.',
  )
  @Post('client-errors')
  @Public()
  @TenantAgnostic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registra un lote de errores del cliente (saneados en el servidor)',
  })
  @ApiOkResponse({ type: ClientErrorsResponseDto })
  capture(@Body() dto: CaptureClientErrorsDto, @Req() request: Request) {
    return this.service.ingest(dto, request);
  }
}
