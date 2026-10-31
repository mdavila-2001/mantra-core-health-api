import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import { CommunitySupportInboxService } from '../services/community-support-inbox.service';
import {
  ConversationAssignmentDto,
  ConversationAssignmentResultDto,
  CreateInternalNoteDto,
  CreateReplyTemplateDto,
  InternalNoteDto,
  InternalNotesResponseDto,
  ReplyTemplateViewDto,
  ReplyTemplatesResponseDto,
  SupportConversationDto,
  SupportConversationQueryDto,
  SupportInboxQueryDto,
  SupportInboxResponseDto,
  SupportReplyTemplatesQueryDto,
  UpdateReplyTemplateDto,
} from '../dto';

/**
 * Bandeja de conversaciones del equipo de apoyo. La persona de apoyo ve y atiende
 * solo las conversaciones de los doctores en cuyo nombre puede responder, en la
 * organización que la vinculó (lo decide la política, no el cuerpo). Las rutas
 * `me/*` y las de conversación no tienen tenant activo: la organización sale de
 * la conversación o de su vínculo.
 */
@ApiTags('community-support-inbox')
@ApiBearerAuth()
@Controller()
export class CommunitySupportInboxController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param inbox - Bandeja del equipo de apoyo.
   */
  constructor(private readonly inbox: CommunitySupportInboxService) {}

  /** Mi bandeja. */
  @AccessLogged({ resourceType: 'SUPPORT_INBOX' })
  @Get('me/support-inbox')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Bandeja de conversaciones del equipo de apoyo' })
  list(
    @Query() query: SupportInboxQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportInboxResponseDto> {
    return this.inbox.listInbox(query, actor);
  }

  /** Una conversación abierta para el equipo (404 si no tiene acceso). */
  @AccessLogged({
    resourceType: 'SUPPORT_INBOX_CONVERSATION',
    resourceId: 'param:conversationId',
  })
  @Get('me/support-inbox/:conversationId')
  @TenantAgnostic()
  @ApiOperation({
    summary: 'Una conversación de la bandeja, con la autora real y las notas',
  })
  conversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: SupportConversationQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportConversationDto> {
    return this.inbox.getConversation(conversationId, query, actor);
  }

  /** Tomar, asignar o cambiar el estado de una conversación. */
  @Audited({
    action: 'CONVERSATION_ASSIGNMENT_CHANGED',
    entity: 'conversation',
    entityId: 'param:conversationId',
  })
  @Post('community/conversations/:conversationId/assignment')
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tomar, asignar o cambiar el estado de una conversación',
  })
  assignment(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: ConversationAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConversationAssignmentResultDto> {
    return this.inbox.applyAssignment(conversationId, dto, actor);
  }

  /** Notas internas de la conversación (nunca las ve el paciente). */
  @Get('community/conversations/:conversationId/internal-notes')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Notas internas de una conversación' })
  notes(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InternalNotesResponseDto> {
    return this.inbox.listNotes(conversationId, actor);
  }

  /** Agrega una nota interna. */
  @Audited({
    action: 'CONVERSATION_NOTE_ADDED',
    entity: 'conversation',
    entityId: 'param:conversationId',
  })
  @Post('community/conversations/:conversationId/internal-notes')
  @TenantAgnostic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar una nota interna a una conversación' })
  addNote(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateInternalNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InternalNoteDto> {
    return this.inbox.addNote(conversationId, dto, actor);
  }

  /** Respuestas preparadas que la persona puede usar en una organización. */
  @Get('me/support-reply-templates')
  @TenantAgnostic()
  @ApiOperation({ summary: 'Respuestas preparadas del equipo de apoyo' })
  myTemplates(
    @Query() query: SupportReplyTemplatesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReplyTemplatesResponseDto> {
    return this.inbox.templatesForPerson(query.tenantId, actor);
  }

  /** Respuestas preparadas de la organización. */
  @Get('org/reply-templates')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Respuestas preparadas de la organización' })
  orgTemplates(): Promise<ReplyTemplatesResponseDto> {
    return this.inbox.templatesOfTenant();
  }

  /** Crea una respuesta preparada. */
  @Audited({
    action: 'REPLY_TEMPLATE_CREATED',
    entity: 'reply_template',
    entityId: 'result.id',
  })
  @Post('org/reply-templates')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una respuesta preparada' })
  createTemplate(
    @Body() dto: CreateReplyTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReplyTemplateViewDto> {
    return this.inbox.createTemplate(dto, actor);
  }

  /** Cambia, retira o reactiva una respuesta preparada. */
  @Audited({
    action: 'REPLY_TEMPLATE_UPDATED',
    entity: 'reply_template',
    entityId: 'param:id',
  })
  @Patch('org/reply-templates/:id')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Cambiar, retirar o reactivar una respuesta preparada',
  })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReplyTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReplyTemplateViewDto> {
    return this.inbox.updateTemplate(id, dto, actor);
  }
}
