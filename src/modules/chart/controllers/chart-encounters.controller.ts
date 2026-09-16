import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { EncounterPdfService } from '../services';

/**
 * PDF oficial del encuentro clínico (C.4). Sin `ClinicalRecordAccessGuard`
 * ese guard evalúa `request.params.patientProfileId`, que esta ruta no
 * tiene (`:id` es el encuentro), así que sería un no-op; la autorización la
 * hace el servicio contra `patientProfileId` del encuentro ya resuelto.
 */
@ApiTags('chart-encounters')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('charts/encounters')
export class ChartEncountersController {
  constructor(private readonly encounterPdfService: EncounterPdfService) {}

  /**
   * 404 si el encuentro no existe, 403 si el actor no puede leer
   * la historia del paciente, 422 si el encuentro todavía no está cerrado
   * (sin sello no hay documento oficial).
   *
   * `no-store`: la caché del navegador no debe conservar un documento clínico
   * después de cerrar sesión.
   */
  @Get(':id/pdf')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el PDF oficial de un encuentro cerrado',
    description:
      'Autoriza a quien puede leer la historia del paciente dueño del encuentro. Requiere que el encuentro esté cerrado (con sello).',
  })
  @ApiOkResponse({
    description: 'PDF oficial del encuentro',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiForbiddenResponse({
    description: 'El actor no puede leer la historia de este paciente',
  })
  @ApiNotFoundResponse({ description: 'El encuentro no existe' })
  @ApiResponse({
    status: 422,
    description: 'El encuentro no está cerrado',
  })
  async getEncounterPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'private, no-store');
    const { buffer, fileName } = await this.encounterPdfService.render(
      id,
      actor,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }
}
