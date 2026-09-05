import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SurveysTemplatesService, SurveysResponsesService } from '../services';
import {
  AddQuestionDto,
  CreateTemplateDto,
  OkResultDto,
  PublishVersionDto,
  QuestionDto,
  SurveyResponseDto,
  TemplateCreatedDto,
  TemplateDetailDto,
  TemplateSummaryDto,
} from '../dto';

/**
 * Autoría y lectura de encuestas del profesional, sobre `/surveys/templates`.
 *
 * Los roles habilitan el acceso al recurso; **quién puede tocar cada plantilla
 * lo decide el servicio por dueño**, no este decorador: dos profesionales de la
 * misma organización comparten roles y no comparten instrumentos.
 */
@ApiTags('surveys-templates')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('surveys/templates')
export class SurveysTemplatesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param templatesService - Autoría de plantillas y cuestionarios.
   * @param responsesService - Lectura de respuestas recibidas.
   */
  constructor(
    private readonly templatesService: SurveysTemplatesService,
    private readonly responsesService: SurveysResponsesService,
  ) {}

  /** Crea la plantilla y su versión 1 en borrador. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una encuesta para pacientes' })
  createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateCreatedDto> {
    return this.templatesService.createTemplate(dto, actor);
  }

  /** Lista las encuestas del profesional. */
  @Get()
  @ApiOperation({ summary: 'Listar mis encuestas' })
  listTemplates(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateSummaryDto[]> {
    return this.templatesService.listTemplates(actor);
  }

  /** Devuelve la encuesta con el cuestionario de su última versión. */
  @Get(':id')
  @ApiOperation({ summary: 'Ver una encuesta y su cuestionario' })
  getTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateDetailDto> {
    return this.templatesService.getTemplate(id, actor);
  }

  /** Agrega una pregunta a la versión en borrador. */
  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Configurar una pregunta y su tipo de respuesta' })
  addQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddQuestionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuestionDto> {
    return this.templatesService.addQuestion(id, dto, actor);
  }

  /** Abre una versión nueva en borrador, para corregir una plantilla ya publicada (FT-31). */
  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir una versión nueva del cuestionario' })
  createNextVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TemplateCreatedDto> {
    return this.templatesService.createNextVersion(id, actor);
  }

  /** Publica la versión y le fija vigencia. */
  @Post(':id/versions/:versionNumber/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar la encuesta y configurar su vigencia' })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Body() dto: PublishVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.templatesService.publishVersion(id, versionNumber, dto, actor);
  }

  /** Desactiva la encuesta: corta las emisiones nuevas sin borrar nada. */
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar la encuesta' })
  deactivateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.templatesService.deactivateTemplate(id, actor);
  }

  /**
   * Las respuestas recibidas por la encuesta.
   *
   * Cuelga de la plantilla y no de un recurso `/surveys/responses` propio a
   * propósito: la plantilla es la unidad de autorización —su dueño— y así no
   * existe ninguna ruta de respuestas a la que se pueda llegar sin pasar por
   * esa comprobación.
   */
  @Get(':id/responses')
  @ApiOperation({ summary: 'Revisar las respuestas de los pacientes' })
  listResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SurveyResponseDto[]> {
    return this.responsesService.listTemplateResponses(id, actor);
  }
}
