import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { InsurancePortabilityService } from '../services/insurance-portability.service';
import {
  PortabilityExportResultDto,
  RequestPortabilityExportDto,
} from '../dto';

/** Emitir un certificado no es gratis (agrega todo el historial): más estricto que el resto de la superficie autenticada. */
const EXPORT_RATE_LIMIT = { default: { limit: 6, ttl: 60_000 } };

/**
 * Portabilidad de póliza e historial de siniestralidad a 1 clic — subtarea
 * 3.3. El registro de procesos del stakeholder (MÓDULO ASEGURADORA · 6.3,
 * ítem 5) pide que, ante un cambio de aseguradora, la app entregue toda la
 * siniestralidad del titular en un solo trámite.
 *
 * **Sin `@Roles`**: la autorización depende de QUIÉN es el titular del
 * `patientProfileId`, no de un rol fijo — mismo criterio que
 * `InsuranceAnalyticsController`. La autoriza `InsurancePortabilityService`
 * (`ProfileOwnershipService.assertOwnsPatientProfile`), y un rechazo queda
 * registrado en `audit.audit_log` (AC-03-03-D).
 */
@ApiTags('insurance-portability')
@ApiBearerAuth()
@Controller('insurance/portability')
export class InsurancePortabilityController {
  constructor(private readonly service: InsurancePortabilityService) {}

  /** Arma, sella y persiste el certificado del titular. */
  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(EXPORT_RATE_LIMIT)
  @ApiOperation({
    summary:
      'Exportar el historial de póliza y siniestralidad del titular a 1 clic',
  })
  @ApiCreatedResponse({ type: PortabilityExportResultDto })
  @ApiForbiddenResponse({
    description: 'El actor no es el titular del perfil ni plataforma.',
  })
  @ApiNotFoundResponse({
    description: 'El paciente o la aseguradora declarada no existen.',
  })
  export(
    @Body() dto: RequestPortabilityExportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PortabilityExportResultDto> {
    return this.service.export(dto, actor);
  }

  /** El certificado oficial en PDF, con su código QR de verificación. */
  @Get('certificates/:certificateId/pdf')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el certificado de portabilidad en PDF',
  })
  @ApiOkResponse({
    description: 'PDF del certificado, con QR de verificación y sello SHA-256',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiForbiddenResponse({
    description: 'El actor no es el titular del certificado',
  })
  @ApiNotFoundResponse({ description: 'El certificado no existe' })
  async downloadPdf(
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    const { buffer, fileName } = await this.service.renderPdf(
      certificateId,
      actor,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }

  /** El certificado en JSON interoperable, tal como se selló. */
  @Get('certificates/:certificateId/json')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el certificado de portabilidad en JSON interoperable',
  })
  @ApiOkResponse({
    description: 'JSON del certificado, exactamente como se selló',
    content: {
      'application/json': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiForbiddenResponse({
    description: 'El actor no es el titular del certificado',
  })
  @ApiNotFoundResponse({ description: 'El certificado no existe' })
  async downloadJson(
    @Param('certificateId', ParseUUIDPipe) certificateId: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    const { buffer, fileName } = await this.service.downloadJson(
      certificateId,
      actor,
    );
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }
}
