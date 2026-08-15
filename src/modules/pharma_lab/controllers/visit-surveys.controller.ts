import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CreateVisitSurveyDto,
  CreatedResourceDto,
  SubmitSurveyResponseDto,
  TransitionResultDto,
} from '../dto';
import type {
  VisitSurveyQuestions,
  VisitSurveyResponses,
  VisitSurveys,
} from '../entities';
import { VisitSurveysService, type SurveyResults } from '../services';

/**
 * Encuestas posteriores a la visita (UC-17-27, UC-17-28).
 * Capa fina que delega en `VisitSurveysService`.
 */
@ApiTags('pharma-lab-visit-surveys')
@ApiBearerAuth()
@Controller('visit-surveys')
export class VisitSurveysController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de las encuestas.
   */
  constructor(private readonly service: VisitSurveysService) {}

  /** UC-17-27. */
  @Post('labs/:pharmaLabId')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Configurar una encuesta posterior a la visita' })
  create(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreateVisitSurveyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createSurvey(pharmaLabId, dto, actor);
  }

  /** Encuestas configuradas por el laboratorio. */
  @Get('labs/:pharmaLabId')
  @Roles('PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar las encuestas del laboratorio' })
  list(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<VisitSurveys[]> {
    return this.service.listSurveys(pharmaLabId);
  }

  /** Cierre de una encuesta. */
  @Post('labs/:pharmaLabId/:surveyId/close')
  @Roles('PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Cerrar una encuesta' })
  close(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.closeSurvey(pharmaLabId, surveyId, actor);
  }

  /** Resultados agregados (spec 5544-5547). */
  @Get('labs/:pharmaLabId/:surveyId/results')
  @Roles('PHARMA_LAB_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Resultados agregados de la encuesta',
    description:
      'Indicadores por pregunta. Las respuestas individuales se mantienen privadas.',
  })
  results(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
  ): Promise<SurveyResults> {
    return this.service.getResults(pharmaLabId, surveyId);
  }

  /** Encuestas pendientes del doctor autenticado. */
  @Get('pending')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar las encuestas pendientes de responder' })
  listPending(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VisitSurveyResponses[]> {
    return this.service.listPendingForDoctor(actor);
  }

  /** Cuestionario de un envío concreto. */
  @Get('responses/:responseId')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Consultar el cuestionario a responder' })
  getQuestionnaire(
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /** El envío. */
    response: VisitSurveyResponses;
    /** La encuesta. */
    survey: VisitSurveys;
    /** Preguntas en orden. */
    questions: VisitSurveyQuestions[];
  }> {
    return this.service.getQuestionnaire(responseId, actor);
  }

  /** UC-17-28. */
  @Post('responses/:responseId')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Responder la encuesta de la visita' })
  submit(
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @Body() dto: SubmitSurveyResponseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.submitResponse(responseId, dto, actor);
  }
}
