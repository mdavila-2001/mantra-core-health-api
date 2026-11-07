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
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { FaqsService } from '../services';
import {
  CreateFaqDto,
  FaqEntryDto,
  FaqListResponseDto,
  ReorderFaqsDto,
  UpdateFaqDto,
} from '../dto';

/**
 * The practitioner's FAQ on `/forms/faqs`. Thin layer over `FaqsService`; the
 * owner is the session's practitioner profile and another's entry is a 404.
 */
@ApiTags('forms-faqs')
@ApiBearerAuth()
@Controller('forms/faqs')
export class FormsFaqsController {
  constructor(private readonly service: FaqsService) {}

  @Get()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar mis preguntas frecuentes, en orden' })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<FaqListResponseDto> {
    return this.service.list(actor);
  }

  @Audited({
    action: 'FAQ_ENTRY_CREATED',
    entity: 'faq_entry',
    entityId: 'result.id',
  })
  @Post()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar una pregunta frecuente al final' })
  create(
    @Body() dto: CreateFaqDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FaqEntryDto> {
    return this.service.create(dto, actor);
  }

  /** Declared before the `:id` routes so `order` is never read as an id. */
  @Audited({ action: 'FAQ_ENTRIES_REORDERED', entity: 'faq_entry' })
  @Put('order')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reordenar mis preguntas frecuentes (lista completa)',
  })
  reorder(
    @Body() dto: ReorderFaqsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FaqListResponseDto> {
    return this.service.reorder(dto, actor);
  }

  @Audited({
    action: 'FAQ_ENTRY_UPDATED',
    entity: 'faq_entry',
    entityId: 'param:id',
  })
  @Patch(':id')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar una pregunta frecuente propia' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaqDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FaqEntryDto> {
    return this.service.update(id, dto, actor);
  }

  @Audited({
    action: 'FAQ_ENTRY_DELETED',
    entity: 'faq_entry',
    entityId: 'param:id',
  })
  @Delete(':id')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar una pregunta frecuente propia' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.remove(id, actor);
  }
}
