import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CommunitySocialService } from '../services';
import {
  CreatePublicProfileDto,
  CreatePostDto,
  CreateCommentDto,
  ReactionDto,
  CreateBookmarkDto,
  CreateFollowDto,
  CreateBlockDto,
  PublicProfileResponseDto,
  PostResponseDto,
  CommentResponseDto,
  ReactionResponseDto,
  IdResponseDto,
} from '../dto';

/**
 * Endpoints sociales del módulo Community: perfiles públicos, posts, comentarios,
 * reacciones, bookmarks, follows y bloqueos. Capa fina que delega en el servicio.
 */
@ApiTags('community-social')
@ApiBearerAuth()
@Controller('community')
export class CommunitySocialController {
  constructor(private readonly service: CommunitySocialService) {}

  /** Bootstrap: crea el perfil público (nodo raíz social). */
  @Post('public-profiles')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un perfil público (bootstrap del grafo social)',
  })
  createProfile(
    @Body() dto: CreatePublicProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicProfileResponseDto> {
    return this.service.createProfile(dto, actor);
  }

  /** UC-19-01. */
  @Post('profiles/:profileId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar un post con hashtags, media y menciones' })
  publishPost(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: CreatePostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    return this.service.publishPost(profileId, dto, actor);
  }

  /** UC-19-02. */
  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comentar (hilo anidado) con contadores' })
  createComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CommentResponseDto> {
    return this.service.createComment(dto, actor);
  }

  /** UC-19-03. */
  @Put('reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reaccionar a contenido (upsert una reacción por actor/objeto)',
  })
  react(
    @Body() dto: ReactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReactionResponseDto> {
    return this.service.react(dto, actor);
  }

  /** UC-19-04. */
  @Post('bookmarks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guardar un bookmark en una colección' })
  bookmark(
    @Body() dto: CreateBookmarkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.bookmark(dto, actor);
  }

  /** UC-19-05. */
  @Post('follows')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seguir un objeto social' })
  follow(
    @Body() dto: CreateFollowDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.follow(dto, actor);
  }

  /** UC-19-14. */
  @Post('blocks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bloquear a un usuario' })
  block(
    @Body() dto: CreateBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.block(dto, actor);
  }
}
