import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { SurveysServiceAssignmentsService } from '../services';
import {
  ImportServiceSurveyDto,
  ServiceSurveyAssignmentsDto,
  ServiceSurveyRowDto,
  StandardSurveyCatalogDto,
} from '../dto';

/**
 * Encuestas estandarizadas por servicio: el catálogo y qué plantilla usa cada
 * servicio del profesional.
 *
 * Reemplaza, para el front, la creación libre (`POST /surveys/templates`, que
 * sigue existiendo para no romper consumidores): el profesional sólo importa
 * del catálogo.
 */
@ApiTags('surveys-service-assignments')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('surveys')
export class SurveysServiceAssignmentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Catálogo e importación por servicio.
   */
  constructor(private readonly service: SurveysServiceAssignmentsService) {}

  /**
   * El catálogo estándar de encuestas por tipo de servicio.
   *
   * No es `GET /surveys/catalog`: esa ruta ya lista las encuestas base y las
   * propias del profesional (`SurveysCatalogController`) y tiene consumidores.
   */
  @Get('standard-catalog')
  @ApiOperation({ summary: 'Ver el catálogo estándar de encuestas' })
  @ApiOkResponse({ type: StandardSurveyCatalogDto })
  getCatalog(): StandardSurveyCatalogDto {
    return this.service.getCatalog();
  }

  /** La cita médica (fija) y los servicios del profesional con su encuesta. */
  @Get('service-assignments')
  @ApiOperation({ summary: 'Ver la encuesta de cada uno de mis servicios' })
  @ApiOkResponse({ type: ServiceSurveyAssignmentsDto })
  listServiceAssignments(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceSurveyAssignmentsDto> {
    return this.service.listServiceAssignments(actor);
  }

  /** Importa una plantilla del catálogo al servicio, reemplazando la anterior. */
  @Audited({
    action: 'SURVEY_SERVICE_ASSIGNMENT_IMPORTED',
    // El recurso tocado es la encuesta del servicio: se identifica por el
    // servicio (el auditor no lee campos anidados de la respuesta).
    entity: 'survey_assignment',
    entityId: 'param:serviceId',
  })
  @Put('service-assignments/:serviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asociar a un servicio una encuesta del catálogo estándar',
  })
  @ApiOkResponse({ type: ServiceSurveyRowDto })
  @ApiForbiddenResponse({
    description: 'SURVEY_SERVICE_NOT_OWNED: el servicio no es suyo.',
  })
  @ApiNotFoundResponse({
    description:
      'SURVEY_CATALOG_CODE_UNKNOWN: el código no está en el catálogo.',
  })
  importServiceSurvey(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: ImportServiceSurveyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceSurveyRowDto> {
    return this.service.importServiceSurvey(serviceId, dto, actor);
  }

  /** Quita la encuesta del servicio: vuelve a la base de servicio del sistema. */
  @Audited({
    action: 'SURVEY_SERVICE_ASSIGNMENT_REMOVED',
    entity: 'survey_assignment',
    entityId: 'param:serviceId',
  })
  @Delete('service-assignments/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Quitar la encuesta de un servicio',
  })
  @ApiNoContentResponse({
    description: 'El servicio vuelve a la encuesta base de servicio.',
  })
  @ApiForbiddenResponse({
    description: 'SURVEY_SERVICE_NOT_OWNED: el servicio no es suyo.',
  })
  removeServiceSurvey(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.removeServiceSurvey(serviceId, actor);
  }
}
