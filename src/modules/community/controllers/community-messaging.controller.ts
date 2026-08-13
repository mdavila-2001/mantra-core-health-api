import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

  // --- Lecturas (UC-19-14, cara de lectura) ---

  /** Bandeja del propio perfil, con vista previa y no leídos. */
  @Get()
  @ApiOperation({ summary: 'Conversaciones activas de un perfil' })
  listConversations(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ConversationPageDto> {
    return this.readService.listConversations(
      profileId,
      actor,
      limit ?? DEFAULT_PAGE_LIMIT,
    );
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
}
