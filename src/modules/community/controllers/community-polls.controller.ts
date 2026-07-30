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
import { CommunityPollsService } from '../services';
import {
  CreatePollDto,
  CreateVoteDto,
  PollResponseDto,
  VoteResponseDto,
} from '../dto';

/** Endpoints de encuestas: creación sobre un post y voto. */
@ApiTags('community-polls')
@ApiBearerAuth()
@Controller('community')
export class CommunityPollsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: CommunityPollsService) {}

  /** Bootstrap: crea una encuesta con sus opciones sobre un post. */
  @Post('posts/:postId/polls')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una encuesta con opciones sobre un post' })
  createPoll(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreatePollDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PollResponseDto> {
    return this.service.createPoll(postId, dto, actor);
  }

  /** UC-19-12. */
  @Post('polls/:pollId/votes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Votar en una encuesta' })
  vote(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Body() dto: CreateVoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VoteResponseDto> {
    return this.service.vote(pollId, dto, actor);
  }
}
