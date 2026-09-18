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
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PrescriptionPdfService } from '../services';

/**
 * PDF oficial de una receta médica (B.3). Sin `ClinicalRecordAccessGuard`:
 * ese guard evalúa `request.params.patientProfileId`, que esta ruta no tiene
 * (`:id` es la receta), así que sería un no-op — mismo criterio que
 * `ChartEncountersController` con el PDF del encuentro. La autorización la
 * hace el servicio: el propio prescriptor pasa siempre, y quien no lo es
 * pasa por `ClinicalReadService.assertPuedeLeerHistoria`.
 */
@ApiTags('clinical-prescriptions')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
@Controller('clinical/prescriptions')
export class ClinicalPrescriptionsController {
  constructor(
    private readonly prescriptionPdfService: PrescriptionPdfService,
  ) {}

  /**
   * 404 si la receta no existe, 403 si el actor no puede leerla. Nunca 422
   * por estado: un borrador o una receta invalidada igual se descargan, con
   * marca de agua — es lo que un profesional necesita para revisar lo que
   * escribió, y lo que un paciente necesita para saber qué dejó de valer.
   *
   * `no-store`: la caché del navegador no debe conservar un documento
   * clínico después de cerrar sesión.
   */
  @Get(':id/pdf')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el PDF oficial de una receta',
    description:
      'Autoriza al prescriptor y a quien puede leer la historia del paciente dueño de la receta.',
  })
  @ApiOkResponse({
    description:
      'PDF de la receta (oficial si está emitida; con marca de agua si no)',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiForbiddenResponse({
    description: 'El actor no puede leer esta receta',
  })
  @ApiNotFoundResponse({ description: 'La receta no existe' })
  async getPrescriptionPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'private, no-store');
    const { buffer, fileName } = await this.prescriptionPdfService.render(
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
