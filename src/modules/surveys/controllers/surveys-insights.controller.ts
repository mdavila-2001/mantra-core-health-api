import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SurveysInsightsService } from '../services';
import { InsightsQueryDto, SurveyInsightsDto } from '../dto';

/**
 * Resumen general de las encuestas del profesional, sobre `/surveys/insights`.
 *
 * Es una lectura **agregada**: no devuelve respuestas individuales ni nada que
 * identifique al paciente o a la atención. Quién es el profesional sale de la
 * sesión, no de un parámetro, así que nadie puede pedir el resumen de otro.
 */
@ApiTags('surveys-insights')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('surveys/insights')
export class SurveysInsightsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param insightsService - Cálculo del resumen agregado.
   */
  constructor(private readonly insightsService: SurveysInsightsService) {}

  /** El resumen del profesional de la sesión. */
  @Get()
  @ApiOperation({
    summary: 'Resumen general de mis encuestas (agregado, sin pacientes)',
    description:
      'Totales, tasa de respuesta, NPS, promedio y distribución por pregunta, tendencia, alertas de seguridad y comentarios abiertos (texto y día). Incluye las encuestas propias y las de sistema emitidas por las atenciones del profesional.',
  })
  getInsights(
    @Query() query: InsightsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SurveyInsightsDto> {
    return this.insightsService.getInsights(query, actor);
  }
}
