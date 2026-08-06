import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ClinicalSummaryService } from '../services';
import { ClinicalSummaryQueryDto, ClinicalSummaryResponseDto } from '../dto';

/** Lectura del resumen clínico del paciente. */
@ApiTags('clinical-summary')
@ApiBearerAuth()
@Controller('clinical/patients')
export class ClinicalSummaryController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param summaryService - Valor de summary service requerido por la operación.
   */
  constructor(private readonly summaryService: ClinicalSummaryService) {}

  /** Problemas, alergias y medicación del paciente. */
  @Get(':patientProfileId/summary')
  @Roles('PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Consultar el resumen clínico de un paciente',
    description:
      'Problemas, alergias y medicación vigentes. Con `includeInactive=true` añade lo resuelto.',
  })
  getSummary(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @Query() query: ClinicalSummaryQueryDto,
  ): Promise<ClinicalSummaryResponseDto> {
    return this.summaryService.getSummary(patientProfileId, query);
  }
}
