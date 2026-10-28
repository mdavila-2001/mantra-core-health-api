import { Body, Controller, Delete, Get, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  AccessLogged,
  Audited,
  CurrentUser,
  type AuthenticatedUser,
} from '../../../../common';
import { PrimaryPractitionerService } from '../../application/services/primary-practitioner.service';
import {
  ListPrimaryPatientsQueryDto,
  OwnPrimaryPractitionerDto,
  PrimaryPatientsPageDto,
  SetPrimaryPractitionerDto,
} from '../dto/primary-practitioner.dto';

/**
 * El médico de cabecera, de los dos lados (v4.2.65).
 *
 * Todas las rutas son `me`: el paciente y el profesional salen de la sesión,
 * nunca de la URL, así que nadie puede elegir por otro ni leer la lista de
 * otro profesional. **Sin `@Roles`**, como el resto de las rutas `me` del
 * módulo: el filtro real es tener perfil de paciente o profesional, que el
 * servicio comprueba y responde con 404 / 422.
 */
@ApiTags('profiles-primary-practitioner')
@ApiBearerAuth()
@Controller('profiles')
export class PrimaryPractitionerController {
  constructor(private readonly primary: PrimaryPractitionerService) {}

  @Get('patients/me/primary-practitioner')
  @AccessLogged({ resourceType: 'PRIMARY_PRACTITIONER', patient: 'actor' })
  @ApiOperation({ summary: 'Consultar el propio médico de cabecera' })
  @ApiOkResponse({ type: OwnPrimaryPractitionerDto })
  getOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPrimaryPractitionerDto> {
    return this.primary.getOwn(actor);
  }

  @Audited({
    action: 'PRIMARY_PRACTITIONER_SET',
    entity: 'patient_primary_practitioner',
  })
  @Put('patients/me/primary-practitioner')
  @ApiOperation({
    summary: 'Elegir o cambiar el propio médico de cabecera',
    description:
      'Cierra la elección vigente (si la hay) y abre otra. Elegir al que ya ' +
      'es el vigente no cambia nada. No concede acceso clínico.',
  })
  @ApiOkResponse({ type: OwnPrimaryPractitionerDto })
  setOwn(
    @Body() dto: SetPrimaryPractitionerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPrimaryPractitionerDto> {
    return this.primary.setOwn(dto.practitionerProfileId, actor);
  }

  @Audited({
    action: 'PRIMARY_PRACTITIONER_REMOVED',
    entity: 'patient_primary_practitioner',
  })
  @Delete('patients/me/primary-practitioner')
  @ApiOperation({ summary: 'Quitar el propio médico de cabecera' })
  @ApiOkResponse({ type: OwnPrimaryPractitionerDto })
  removeOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPrimaryPractitionerDto> {
    return this.primary.removeOwn(actor);
  }

  @Get('practitioners/me/primary-patients')
  @AccessLogged({ resourceType: 'PRIMARY_PATIENT_LIST' })
  @ApiOperation({
    summary: 'Listar los pacientes que me eligieron como médico de cabecera',
    description:
      'Nombre, código de paciente y desde cuándo: ningún dato del expediente.',
  })
  @ApiOkResponse({ type: PrimaryPatientsPageDto })
  listOwnPatients(
    @Query() query: ListPrimaryPatientsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrimaryPatientsPageDto> {
    return this.primary.listOwnPatients(query, actor);
  }
}
