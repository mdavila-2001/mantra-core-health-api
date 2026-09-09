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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import {
  CommunityMessagingService,
  CommunityMessagingReadService,
} from '../services';
import {
  CreateConversationDto,
  SendMessageDto,
  MarkReadDto,
  IdResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
  ConversationPageDto,
  DirectMessagePageDto,
  UpdateParticipantDto,
  EditMessageDto,
  PinMessageDto,
  ParticipantPreferencesDto,
  DirectMessageDto,
  DeletedMessageResponseDto,
  PinnedMessageResponseDto,
  ConversationPresenceDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Endpoints de mensajería social (conversaciones, mensajes directos, recibos). */
@ApiTags('community-messaging')
@ApiBearerAuth()
@Controller('community/conversations')
export class CommunityMessagingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de la mensajería.
   * @param readService - Lecturas de la mensajería.
   */
  constructor(
    private readonly service: CommunityMessagingService,
    private readonly readService: CommunityMessagingReadService,
  ) {}

  /** Bootstrap: crea una conversación con participantes. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una conversación con participantes' })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.createConversation(dto, actor);
  }

  /** UC-19-06. */
  @Post(':conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar un mensaje directo en la conversación' })
  sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    return this.service.sendMessage(conversationId, dto, actor);
  }

  /** F4.5 · Editar el texto de un mensaje propio. */
  @Patch(':conversationId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar el texto de un mensaje propio' })
  editMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: EditMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DirectMessageDto> {
    return this.service.editMessage(conversationId, messageId, dto, actor);
  }

  /** F4.5 · Eliminar un mensaje propio (lógico: queda «Se eliminó este mensaje»). */
  @Delete(':conversationId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un mensaje propio' })
  deleteMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeletedMessageResponseDto> {
    return this.service.deleteMessage(
      conversationId,
      messageId,
      profileId,
      actor,
    );
  }

  /** UC-19-07. */
  @Post(':conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar mensajes como leídos (recibos)' })
  markRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: MarkReadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReadReceiptResponseDto> {
    return this.service.markRead(conversationId, dto, actor);
  }

  /** F4.4 · Favorita, fijada o archivada, de mi lado. */
  @Patch(':conversationId/participant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar la conversación como favorita, fijada o archivada',
  })
  updateParticipant(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: UpdateParticipantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ParticipantPreferencesDto> {
    return this.service.updateParticipant(conversationId, dto, actor);
  }

  /** F4.6 · Fijar un mensaje en la barra superior del hilo. */
  @Post(':conversationId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fijar un mensaje de la conversación' })
  pinMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: PinMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PinnedMessageResponseDto> {
    return this.service.pinMessage(conversationId, dto, actor);
  }

  /** F4.6 · Soltar el mensaje fijado. */
  @Delete(':conversationId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soltar el mensaje fijado de la conversación' })
  unpinMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PinnedMessageResponseDto> {
    return this.service.unpinMessage(conversationId, profileId, actor);
  }

  // --- Lecturas (UC-19-14, cara de lectura) ---

  /**
   * Bandeja del propio perfil, con vista previa y no leídos.
   *
   * F4.3: acepta `cursor` (el `nextCursor` de la página anterior) y `q`
   * (nombre del otro lado o texto del último mensaje).
   */
  @Get()
  @ApiOperation({ summary: 'Conversaciones activas de un perfil' })
  listConversations(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
    @Query('cursor') cursor?: string,
    @Query('q') q?: string,
  ): Promise<ConversationPageDto> {
    return this.readService.listConversations(profileId, actor, {
      limit: limit ?? DEFAULT_PAGE_LIMIT,
      cursor,
      q,
    });
  }

  /** Mensajes de una conversación en la que se participa. */
  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Mensajes de una conversación' })
  listMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<DirectMessagePageDto> {
    return this.readService.listMessages(conversationId, profileId, actor, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /** F4.2 · Quién de los otros está en línea, y si no, cuándo se lo vio. */
  @Get(':conversationId/presence')
  @ApiOperation({ summary: 'Presencia de los demás participantes' })
  conversationPresence(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConversationPresenceDto> {
    return this.readService.conversationPresence(
      conversationId,
      profileId,
      actor,
    );
  }
}
