import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ParseOptionalLimitPipe, Roles } from '../../../common';
import { ClinicalReadService } from '../services';
import type { PatientClinicalSummaryResponseDto } from '../dto';

/**
 * Lectura del registro clínico (`/clinical/patients`). Capa fina: valida
 * parámetros y delega en `ClinicalReadService`.
 *
 * Mismos roles que la escritura del módulo: es PHI y lo consulta quien atiende.
 */
@ApiTags('clinical-read')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
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
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientClinicalSummaryResponseDto> {
    return this.readService.getPatientSummary(patientProfileId, limit ?? 50);
  }
}
