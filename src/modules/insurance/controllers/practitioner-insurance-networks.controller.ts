import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PractitionerInsuranceNetworksService } from '../services/practitioner-insurance-networks.service';
import { PractitionerInsuranceNetworkPageDto } from '../dto/practitioner-insurance-network.dto';

/**
 * Con qué aseguradoras trabaja un profesional
 * (`/practitioners/:profileId/insurance-networks`).
 *
 * Cuelga de `/practitioners` por lo mismo que sus sedes: la pregunta es «¿con
 * qué seguros atiende este médico?». Es el mismo dato que una aseguradora
 * publica en su cartilla, así que lo lee cualquier sesión con los roles de
 * `GET /practitioners/:id/sites`, y no es tenant-scoped a la aseguradora: el
 * médico no pertenece al tenant de quien lo sumó a su red.
 */
@ApiTags('insurance')
@ApiBearerAuth()
@Controller('practitioners')
export class PractitionerInsuranceNetworksController {
  constructor(
    private readonly networks: PractitionerInsuranceNetworksService,
  ) {}

  @Get(':profileId/insurance-networks')
  @Roles(
    'SECURITY_ADMIN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
    'PRACTITIONER',
    'CLINICIAN',
    'PATIENT',
  )
  @ApiOperation({
    summary: 'Aseguradoras con las que trabaja el profesional',
    description:
      'Una fila por membresía vigente en una red de prestadores, por la práctica donde atiende o individual. Vacía significa que ninguna aseguradora lo tiene en su red.',
  })
  async list(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PractitionerInsuranceNetworkPageDto> {
    const items = await this.networks.listForPractitioner(profileId);
    return { items, count: items.length };
  }
}
