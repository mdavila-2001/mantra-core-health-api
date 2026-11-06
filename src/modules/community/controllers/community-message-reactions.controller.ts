import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { DirectMessageDto, ReactToMessageDto } from '../dto';
import { CommunityMessageReactionsService } from '../services/community-message-reactions.service';

/**
 * Reactions to direct messages. Same rules as the rest of the messaging
 * routes: no global role, the profile must belong to the actor and take part
 * in the conversation (404 otherwise).
 */
@ApiTags('community-messaging')
@ApiBearerAuth()
@Controller('community/conversations')
export class CommunityMessageReactionsController {
  constructor(private readonly service: CommunityMessageReactionsService) {}

  /** Sets, replaces (another emoji) or removes (`emoji: null`) a reaction. */
  @Audited({
    action: 'DIRECT_MESSAGE_REACTED',
    entity: 'direct_message',
    entityId: 'param:messageId',
  })
  @Put(':conversationId/messages/:messageId/reaction')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reaccionar a un mensaje (una reacción por perfil)',
  })
  react(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: ReactToMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DirectMessageDto> {
    return this.service.react(conversationId, messageId, dto, actor);
  }
}
