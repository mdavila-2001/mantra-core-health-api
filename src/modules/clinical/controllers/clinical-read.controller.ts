import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
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
import type { PatientClinicalSummaryResponseDto } from '../dto';

/**
 * Roles que leen la historia de **otra** persona: los que atienden.
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín; excluirlo
 * acá le negaría en el controlador lo que el guard ya le concedió.
 */
const ROLES_QUE_ATIENDEN: readonly string[] = [
  'CLINICIAN',
  'PRACTITIONER',
  'SUPERADMIN',
];

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
 * ## El aislamiento es del servidor, no de la pantalla
 *
 * Un paciente lee **su** historia y ninguna otra: {@link asegurarTitularidad}
 * compara el perfil del token con el que se pide y responde 403 ante cualquier
 * otro. No alcanza con que la interfaz mande siempre el propio identificador —el
 * endpoint es público para cualquiera con sesión— y el bypass de verificación de
 * DEV **no toca esto**: bypass de verificación no es bypass de aislamiento.
 */
@ApiTags('clinical-read')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
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
  async getPatientSummary(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientClinicalSummaryResponseDto> {
    // Quien atiende pasa sin más: leer la historia de a quien atiende **es** su
    // trabajo, y a quién puede atender lo decide la asignación de roles, no
    // este endpoint. Al resto se le exige ser el titular.
    if (!actor.roles.some((rol) => ROLES_QUE_ATIENDEN.includes(rol))) {
      await this.readService.assertOwnRecord(patientProfileId, actor);
    }
    return this.readService.getPatientSummary(patientProfileId, limit ?? 50);
  }
}
