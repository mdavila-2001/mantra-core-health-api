import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common';
import { ReportVerificationDto } from '../dto/report-draft-publish.dto';
import { ReportReleaseService } from '../services/report-release.service';

/** Same per-IP limit as the rest of the public surface (P3). */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * Public verification of an official report: the QR of the PDF points here.
 * It answers «is this report real?», never «what was reported about whom?»:
 * no patient data. `no-store`, so the answer is never served stale.
 */
@ApiTags('diagnostics-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller()
export class DiagnosticsReportVerifyPublicController {
  constructor(private readonly release: ReportReleaseService) {}

  @Public()
  @Get('public/diagnostic-reports/:versionId/verify')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Verificar la autenticidad de un informe diagnóstico',
    description:
      'Sin autenticación y sin PHI: estado, fecha de emisión, emisor, estudio y SHA-256.',
  })
  @ApiOkResponse({ type: ReportVerificationDto })
  @ApiNotFoundResponse({ description: 'El informe no existe o no es oficial' })
  verify(
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ): Promise<ReportVerificationDto> {
    return this.release.verify(versionId);
  }
}
