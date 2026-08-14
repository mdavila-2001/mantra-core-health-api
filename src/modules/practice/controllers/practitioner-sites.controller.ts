import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, requireTenantId } from '../../../common';
import { PractitionerSitesService } from '../services';
import { PractitionerSitesResponseDto } from '../dto';

/**
 * Dónde atiende un profesional (`/practitioners/:profileId/sites`).
 *
 * ## Por qué cuelga de `/practitioners` y no de `/practices`
 *
 * La pregunta que responde es «¿dónde atiende este médico?», no «¿qué sedes
 * tiene esta organización?». Colgarla de la práctica obligaría a saber primero
 * en qué práctica trabaja, que es justo lo que se está preguntando.
 *
 * ## Los roles son los de quien pregunta, no los de quien administra
 *
 * `GET /practices/:id/sites` es una lectura administrativa y sus roles lo
 * reflejan. Ésta la consultan la agenda y el portal: si `PATIENT` no puede
 * leerla, un paciente ve la hora de su turno y no la dirección, que es
 * exactamente el hueco que este endpoint viene a tapar.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practitioners')
export class PractitionerSitesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param sitesService - Resolución de sedes de un profesional.
   */
  constructor(private readonly sitesService: PractitionerSitesService) {}

  /** UC-14-15. */
  @Get(':profileId/sites')
  @Roles(
    'SECURITY_ADMIN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
    'PRACTITIONER',
    'CLINICIAN',
    'PATIENT',
  )
  @ApiOperation({
    summary: 'Consultorios donde atiende el profesional',
    description:
      'Sale de sus asignaciones de rol vigentes con sede. Una lista vacía significa que no tiene ninguna, no que el profesional no exista.',
  })
  async listSites(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PractitionerSitesResponseDto> {
    const items = await this.sitesService.listSitesOfPractitioner(
      profileId,
      requireTenantId(),
    );
    return { items, count: items.length };
  }
}
