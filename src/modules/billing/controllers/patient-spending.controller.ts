import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  AccessLogged,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientSpendingQueryDto,
  PatientSpendingResponseDto,
} from '../dto/patient-spending.dto';
import { PatientSpendingService } from '../services/patient-spending.service';

/**
 * «Mis gastos» del paciente (P44).
 *
 * ## Por qué cuelga de `/patient-spending` y no de `/billing`
 *
 * Es el prefijo que el frontend ya declara en sus proxies
 * (`proxy.conf.json`, `deploy/api-locations.conf`) y en su cliente; el proxy
 * empareja por primer segmento y `/billing` ya es de las rutas de operación.
 *
 * ## No hay identificador de paciente en la ruta
 *
 * El titular sale del token. Sin parámetro de persona no hay nada que comparar
 * ni que olvidar comparar (BOLA): sólo se pueden leer los gastos propios.
 */
@ApiTags('patient-spending')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('patient-spending')
export class PatientSpendingController {
  /**
   * @param spending - Lectura de los gastos del titular.
   */
  constructor(private readonly spending: PatientSpendingService) {}

  /**
   * Los gastos de salud del titular en un rango de fechas.
   *
   * @param actor - El titular (del token).
   * @param query - `from`/`to` (`YYYY-MM-DD`, inclusive) y `limit` opcional.
   */
  @Get('me')
  @AccessLogged({ resourceType: 'PATIENT_SPENDING', patient: 'actor' })
  @ApiOperation({
    summary: 'Mis gastos de salud',
    description:
      'Un movimiento por factura emitida al titular entre `from` y `to` ' +
      '(inclusive, nunca después de hoy), del más reciente al más antiguo. ' +
      'Importes en texto decimal exacto, con `paidAmount = grossAmount − ' +
      'coveredAmount − discountAmount`. El titular sale del token.',
  })
  @ApiOkResponse({ type: PatientSpendingResponseDto })
  @ApiBadRequestResponse({
    description:
      '`from`/`to` faltan, no son `YYYY-MM-DD` válidos, están invertidos o ' +
      'abarcan más de tres años; o `limit` fuera de 1..1000.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'La cuenta no tiene perfil de paciente.',
  })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: PatientSpendingQueryDto,
  ): Promise<PatientSpendingResponseDto> {
    return this.spending.listMine(actor, query);
  }
}
