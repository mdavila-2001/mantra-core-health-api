import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { QuestionScriptsService } from '../services';
import {
  CreateQuestionScriptDto,
  QuestionScriptDto,
  QuestionScriptListResponseDto,
  UpdateQuestionScriptDto,
} from '../dto';

/**
 * The practitioner's question scripts on `/forms/question-scripts`. Thin layer
 * over `QuestionScriptsService`; the owner is always the session's
 * practitioner profile and another practitioner's script answers 404.
 */
@ApiTags('forms-question-scripts')
@ApiBearerAuth()
@Controller('forms/question-scripts')
export class FormsQuestionScriptsController {
  constructor(private readonly service: QuestionScriptsService) {}

  @Get()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar mis guiones de preguntas activos' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuestionScriptListResponseDto> {
    return this.service.list(actor);
  }

  @Audited({
    action: 'QUESTION_SCRIPT_CREATED',
    entity: 'question_script',
    entityId: 'result.id',
  })
  @Post()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un guion de preguntas' })
  create(
    @Body() dto: CreateQuestionScriptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuestionScriptDto> {
    return this.service.create(dto, actor);
  }

  @Get(':id')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Leer un guion de preguntas propio' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuestionScriptDto> {
    return this.service.get(id, actor);
  }

  @Audited({
    action: 'QUESTION_SCRIPT_UPDATED',
    entity: 'question_script',
    entityId: 'param:id',
  })
  @Patch(':id')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Editar un guion propio (items reemplaza la lista; 409 si version no coincide)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionScriptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuestionScriptDto> {
    return this.service.update(id, dto, actor);
  }

  @Audited({
    action: 'QUESTION_SCRIPT_ARCHIVED',
    entity: 'question_script',
    entityId: 'param:id',
  })
  @Delete(':id')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archivar un guion propio' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.archive(id, actor);
  }
}
