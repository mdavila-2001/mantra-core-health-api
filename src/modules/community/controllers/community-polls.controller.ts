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
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { CommunityPollsService, CommunityPollsReadService } from '../services';
import {
  CreatePollDto,
  CreateVoteDto,
  PollResponseDto,
  VoteResponseDto,
  PollDetailDto,
} from '../dto';

/** Endpoints de encuestas: creación sobre un post y voto. */
@ApiTags('community-polls')
@ApiBearerAuth()
@Controller('community')
export class CommunityPollsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de encuestas.
   * @param readService - Lecturas de encuestas.
   */
  constructor(
    private readonly service: CommunityPollsService,
    private readonly readService: CommunityPollsReadService,
  ) {}

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

  /** UC-19-17 (cara de lectura). Encuesta con recuentos y el voto del actor. */
  @Get('polls/:pollId')
  @ApiOperation({ summary: 'Encuesta con opciones, recuentos y voto propio' })
  getPoll(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<PollDetailDto> {
    return this.readService.getPoll(pollId, actor, actorProfileId);
  }
}
