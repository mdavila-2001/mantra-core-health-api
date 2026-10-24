import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalReadService } from '../services';
import { ClinicalRecordAccessGuard } from '../guards';
import type { PatientClinicalSummaryResponseDto } from '../dto';

/**
 * Lectura del registro clínico (`/clinical/patients`). Capa fina: valida
 * parámetros y delega en `ClinicalReadService`.
 *
 * ## Quién puede leer, y por qué el paciente también
 *
 * Es PHI y lo consulta quien atiende — y **la persona de la que es**. Sin
 * `PATIENT` en la lista, el archivo clínico del paciente (corrección #11, cierre
 * del P0) no podía existir: la pantalla que le muestra su propia atención no
 * tenía de dónde leerla, y esa es justamente la última pieza del recorrido que
 * el cliente pidió ver funcionando.
 *
 * ## El controlador no ramifica (FT-07-R08 / CAN-AUTH-001)
 *
 * `ClinicalRecordAccessGuard` delega la decisión entera en
 * `ClinicalReadService.assertPuedeLeerHistoria`: SUPERADMIN pasa; el paciente
 * lee sólo la propia (`assertOwnRecord`); quien atiende pasa con un turno de
 * HOY con esa persona, o —sin turno— con una relación asistencial/acceso
 * clínico vigente que el propio paciente autorizó (PDP de `authz`,
 * `POST /authz/care-relationships/request` + `.../respond`). Antes el rol solo
 * ya bastaba para leer el expediente de cualquier paciente adivinando su UUID.
 */
@ApiTags('clinical-read')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
@UseGuards(ClinicalRecordAccessGuard)
@Controller('clinical/patients')
export class ClinicalReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Servicio de lectura del registro clínico.
   */
  constructor(private readonly readService: ClinicalReadService) {}

  /**
   * UC-39-20: historial clínico del paciente en una sola llamada.
   *
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope por bloque (por defecto 50).
   * @returns Condiciones, alergias, medicación, observaciones y encuentros.
   */
  @Get(':patientProfileId/summary')
  @ApiOperation({
    summary:
      'UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope aplicado a cada bloque (por defecto 50)',
  })
  getPatientSummary(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientClinicalSummaryResponseDto> {
    // N-04: el actor viaja al servicio para que la lectura deje su asiento.
    return this.readService.getPatientSummary(
      patientProfileId,
      limit ?? 50,
      actor,
    );
  }
}
