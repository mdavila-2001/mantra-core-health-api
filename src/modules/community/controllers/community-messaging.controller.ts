import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { CommunityMessagingService } from '../services';
import {
  CreateConversationDto,
  SendMessageDto,
  MarkReadDto,
  IdResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
} from '../dto';

/** Endpoints de mensajería social (conversaciones, mensajes directos, recibos). */
@ApiTags('community-messaging')
@ApiBearerAuth()
@Controller('community/conversations')
export class CommunityMessagingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: CommunityMessagingService) {}

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
}
