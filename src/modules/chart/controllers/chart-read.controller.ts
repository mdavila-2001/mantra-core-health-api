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
import { ParseOptionalLimitPipe, Roles } from '../../../common';
import { ChartReadService } from '../services';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import type { PatientChartResponseDto } from '../dto';

/**
 * Lectura del expediente clínico (`/charts/patients`). Capa fina: valida
 * parámetros y delega en `ChartReadService`.
 *
 * Mismos roles que la escritura del módulo: el expediente es PHI y lo consulta
 * quien lo redacta. El acceso por relación asistencial concreta
 * (`authz.care_relationships`/`clinical_access_grants`) o por cita registrada
 * lo impone `ClinicalRecordAccessGuard` (FT-07-R08) — antes ningún endpoint
 * clínico lo hacía y el rol solo ya bastaba para leer cualquier expediente.
 */
@ApiTags('chart-read')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@UseGuards(ClinicalRecordAccessGuard)
@Controller('charts/patients')
export class ChartReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Servicio de lectura del expediente.
   */
  constructor(private readonly readService: ChartReadService) {}

  /**
   * UC-40-14: expediente del paciente en una sola llamada.
   *
   * @param patientProfileId - Paciente cuyo expediente se lee.
   * @param limit - Tope por bloque (por defecto 50).
   * @returns Notas, planes de cuidados y documentos del paciente.
   */
  @Get(':patientProfileId/chart')
  @ApiOperation({
    summary:
      'UC-40-14: expediente del paciente (notas, planes de cuidados y documentos)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope aplicado a cada bloque (por defecto 50)',
  })
  getPatientChart(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientChartResponseDto> {
    return this.readService.getPatientChart(patientProfileId, limit ?? 50);
  }
}
