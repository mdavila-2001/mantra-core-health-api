import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { MedicationScheduleService } from '../services/medication-schedule.service';

/**
 * Calendario de tomas de una receta (patch v4.2.35).
 *
 * Sin `ClinicalRecordAccessGuard`, por la misma razón que el PDF de la receta
 * (`ClinicalPrescriptionsController`): la ruta lleva el id de la receta, no el
 * del paciente, y el guard sería un no-op. Autoriza el servicio tras cargar la
 * receta (prescriptor, o `assertPuedeLeerHistoria`).
 *
 * La URL sólo lleva el id de la receta: nunca el nombre del fármaco ni ningún
 * dato clínico, que quedarían en historiales y logs de acceso.
 */
@ApiTags('clinical-records')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
@Controller('clinical/medication-requests')
export class ClinicalMedicationScheduleController {
  /** @param scheduleService - Construye el .ics con su autorización. */
  constructor(private readonly scheduleService: MedicationScheduleService) {}

  /**
   * `no-store` por el mismo motivo que el PDF: el navegador no debe conservar
   * un documento clínico después de cerrar sesión.
   */
  @Get(':id/schedule.ics')
  @ApiOperation({
    summary: 'Descargar el cronograma de tomas de una receta (iCalendar)',
    description:
      'RFC 5545, con RRULE cuando la frecuencia es regular. El resumen de cada toma es genérico: ' +
      'no nombra el fármaco. Autoriza al prescriptor y a quien puede leer la historia del paciente.',
  })
  @ApiQuery({
    name: 'tz',
    required: false,
    description:
      'Zona IANA a usar si la receta no declara la suya (por defecto America/La_Paz)',
  })
  @ApiOkResponse({
    description: 'Calendario de tomas',
    content: { 'text/calendar': { schema: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'tz no es una zona IANA' })
  @ApiForbiddenResponse({ description: 'El actor no puede leer esta receta' })
  @ApiNotFoundResponse({ description: 'La receta no existe' })
  @ApiUnprocessableEntityResponse({
    description:
      'La receta no tiene tomas programadas (según necesidad, duración 0 o sin posología estructurada)',
  })
  async getScheduleIcs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tz') tz: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const { content, fileName } = await this.scheduleService.exportIcs(
      id,
      actor,
      tz,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(content);
  }
}
