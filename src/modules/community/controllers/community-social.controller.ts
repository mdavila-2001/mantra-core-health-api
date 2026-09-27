import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { isUUID } from 'class-validator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CommunitySocialService,
  CommunityChatAutoReplyService,
  CommunitySocialReadService,
} from '../services';
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
  ChatAutoReplyDto,
  PublicProfileDetailDto,
  UpsertChatAutoReplyDto,
  PostPageDto,
  PostDetailDto,
  CommentThreadPageDto,
  ReactionSummaryDto,
  FollowPageDto,
  BookmarkPageDto,
  BlockPageDto,
  UpsertOwnPublicProfileDto,
  OwnPublicProfileDto,
  ProfileStatsDto,
  UnfollowQueryDto,
  UnbookmarkQueryDto,
  UnblockQueryDto,
  SocialRemovalResponseDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Tope de publicaciones por lectura en lote (TX-27). */
const MAX_POSTS_BATCH = 50;

/**
 * Endpoints sociales del módulo Community: perfiles públicos, posts, comentarios,
 * reacciones, bookmarks, follows y bloqueos. Capa fina que delega en el servicio.
 */
@ApiTags('community-social')
@ApiBearerAuth()
@Controller('community')
export class CommunitySocialController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras del grafo social.
   * @param readService - Lecturas del grafo social.
   * @param autoReplyService - La respuesta automática por inactividad (F4.7).
   */
  constructor(
    private readonly service: CommunitySocialService,
    private readonly readService: CommunitySocialReadService,
    private readonly autoReplyService: CommunityChatAutoReplyService,
  ) {}

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

  /**
   * La vitrina pública propia, o `null` si todavía no creó ninguna.
   *
   * Sin `@Roles`: cualquier sesión autenticada puede pedir la suya, porque el
   * sujeto lo resuelve el servidor y no hay forma de pedir la de otro.
   *
   * Va declarado **antes** que `profiles/:profileId`: Nest resuelve las rutas
   * por orden de declaración y un parámetro capturaría `me`.
   */
  @Get('profiles/me')
  @ApiOperation({ summary: 'Consultar la vitrina pública propia' })
  getOwnProfile(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPublicProfileDto | null> {
    return this.service.getOwnProfile(actor);
  }

  /**
   * Crea o actualiza la vitrina pública propia. Idempotente: la pantalla que la
   * edita no necesita saber si ya existía.
   */
  @Put('profiles/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crear o actualizar la vitrina pública propia' })
  upsertOwnProfile(
    @Body() dto: UpsertOwnPublicProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OwnPublicProfileDto> {
    return this.service.upsertOwnProfile(dto, actor);
  }

  /**
   * «Tu perfil esta semana» (`ORG-PUB-005`).
   *
   * Va declarado **antes** que `profiles/:profileId`, igual que
   * `profiles/me`: Nest resuelve por orden de declaración y un parámetro
   * capturaría `me`.
   *
   * Sin `@Roles`: el sujeto lo resuelve el servidor desde la sesión, así que
   * no hay forma de pedir las estadísticas de otro. Es la misma regla que
   * `GET profiles/me`.
   */
  @Get('profiles/me/stats')
  @ApiOperation({
    summary: 'Estadísticas de la vitrina pública propia',
    description:
      'Visitas y apariciones en búsquedas de los últimos 7 días. Son visitas, ' +
      'no visitantes únicos: no se guarda ningún rastro del visitante.',
  })
  ownProfileStats(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProfileStatsDto> {
    return this.service.getOwnProfileStats(actor);
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

  // --- Caras inversas (UC-19-04/05/14) ---
  //
  // Van por query y no por el id de la fila porque la pantalla que las ofrece
  // sabe *a quién* dejó de seguir o *qué* dejó de guardar, no el uuid del
  // vínculo: pedirle ese uuid la obligaría a una lectura extra sólo para poder
  // deshacer lo que acaba de hacer.

  /** UC-19-05, cara inversa. */
  @Delete('follows')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dejar de seguir un objeto social' })
  unfollow(
    @Query() query: UnfollowQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SocialRemovalResponseDto> {
    return this.service.unfollow(query, actor);
  }

  /** UC-19-04, cara inversa. */
  @Delete('bookmarks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar un marcador' })
  unbookmark(
    @Query() query: UnbookmarkQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SocialRemovalResponseDto> {
    return this.service.unbookmark(query, actor);
  }

  /** UC-19-14, cara inversa. */
  @Delete('blocks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Levantar un bloqueo' })
  unblock(
    @Query() query: UnblockQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SocialRemovalResponseDto> {
    return this.service.unblock(query, actor);
  }

  // --- Lecturas (UC-19-01..07, cara de lectura) ---
  //
  // Sin `@Roles`: alcanza con una sesión. Las que exponen contenido privado
  // —marcadores y bloqueos— comprueban la propiedad del perfil en el servicio,
  // que es donde hay base para comprobarla.

  /**
   * La misma ficha, por el slug del directorio público (carril P2).
   *
   * **Va declarada antes que `profiles/:profileId`**, y no es un detalle de
   * estilo: el router prueba en orden, y aunque el parámetro lleva
   * `ParseUUIDPipe` —que rechazaría `by-slug`— dejar que la ruta específica
   * quede después de la genérica es la forma de que un cambio futuro del pipe
   * la apague sin que nadie se entere.
   */
  @Get('profiles/by-slug/:slug')
  @ApiOperation({ summary: 'Ficha de un perfil público por su slug' })
  getProfileBySlug(
    @Param('slug') slug: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicProfileDetailDto> {
    return this.readService.getProfileBySlug(slug, actor);
  }

  /**
   * F4.7 · La respuesta automática por inactividad de un perfil.
   *
   * **Va declarada antes que `profiles/:profileId`**, por el mismo motivo que
   * `by-slug`: el router prueba en orden.
   *
   * `null` cuando nunca se configuró — que no es lo mismo que estar apagada, y
   * la pantalla los dibuja distinto.
   */
  @Get('profiles/:profileId/auto-reply')
  @ApiOperation({ summary: 'Respuesta automática por inactividad del perfil' })
  getAutoReply(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChatAutoReplyDto | null> {
    return this.autoReplyService.get(profileId, actor);
  }

  /**
   * F4.7 · Configura la respuesta automática del perfil.
   *
   * `PUT` y no `PATCH`: hay **una sola fila por perfil** y se manda entera, así
   * que quien configura no tiene que saber si ya existía. Sólo el titular del
   * perfil — lo comprueba el servicio, que es donde hay base para comprobarlo.
   */
  @Put('profiles/:profileId/auto-reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar la respuesta automática del perfil' })
  upsertAutoReply(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: UpsertChatAutoReplyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChatAutoReplyDto> {
    return this.autoReplyService.upsert(profileId, dto, actor);
  }

  /** Ficha del perfil, con sellos de verificación y prestigio. */
  @Get('profiles/:profileId')
  @ApiOperation({ summary: 'Ficha de un perfil público' })
  getProfile(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicProfileDetailDto> {
    return this.readService.getProfile(profileId, actor);
  }

  /** Muro del perfil, filtrado por lo que el lector puede ver. */
  @Get('profiles/:profileId/posts')
  @ApiOperation({ summary: 'Publicaciones de un perfil' })
  listProfilePosts(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PostPageDto> {
    return this.readService.listProfilePosts(profileId, actor, {
      actorProfileId,
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /**
   * Lectura en lote (TX-27): las publicaciones de `ids` (uuid separados por
   * coma, hasta 50) con el mismo detalle que `posts/:postId`. Las que no
   * existen o no son visibles no aparecen.
   */
  @Get('posts')
  @ApiOperation({
    summary: 'Publicaciones por ids, con media, hashtags y menciones',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    description: 'Uuid separados por coma (hasta 50)',
  })
  getPosts(
    @Query('ids') ids: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<PostDetailDto[]> {
    const parsed = [
      ...new Set((ids ?? '').split(',').map((id) => id.trim())),
    ].filter((id) => id !== '');
    if (
      parsed.length === 0 ||
      parsed.length > MAX_POSTS_BATCH ||
      !parsed.every((id) => isUUID(id))
    ) {
      throw new BadRequestException(
        `ids debe traer entre 1 y ${MAX_POSTS_BATCH} uuid separados por coma`,
      );
    }
    return this.readService.getPostsBatch(parsed, actor, actorProfileId);
  }

  /** Publicación con sus adjuntos, etiquetas y menciones. */
  @Get('posts/:postId')
  @ApiOperation({ summary: 'Publicación con media, hashtags y menciones' })
  getPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<PostDetailDto> {
    return this.readService.getPost(postId, actor, actorProfileId);
  }

  /** Hilo de comentarios de una publicación. */
  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Comentarios de una publicación (hilo anidado)' })
  listPostComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<CommentThreadPageDto> {
    return this.readService.listPostComments(postId, actor, {
      actorProfileId,
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /**
   * FND-01: el contenido de un adjunto de comentario, para quien tiene sesión
   * y puede ver el post del que cuelga — no sólo para quien lo subió.
   *
   * Declarada con un segmento fijo (`media`) antes que nada bajo `comments/`
   * capture `:id`: hoy no hay otra ruta `comments/:algo` en este controlador,
   * pero es la misma cautela que ya deja escrita `listLinks` en
   * `CommonFilesController` para `links` contra `:id/content`.
   */
  @Get('comments/media/:fileId/content')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Descargar el adjunto de un comentario (imagen, sticker o GIF)',
  })
  async getCommentMediaContent(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<void> {
    const contenido = await this.readService.getCommentMedia(
      fileId,
      actor,
      actorProfileId,
    );
    res.setHeader('Content-Type', contenido.mimeType);
    res.send(contenido.buffer);
  }

  /** Resumen de reacciones de una publicación. */
  @Get('posts/:postId/reactions')
  @ApiOperation({
    summary: 'Reacciones de una publicación, agrupadas por tipo',
  })
  getPostReactions(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<ReactionSummaryDto> {
    return this.readService.getPostReactions(postId, actor, actorProfileId);
  }

  /** Seguimientos emitidos por un perfil. Sólo su titular. */
  @Get('follows')
  @ApiOperation({ summary: 'Seguimientos activos de un perfil' })
  listFollows(
    @Query('followerProfileId', ParseUUIDPipe) followerProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FollowPageDto> {
    return this.readService.listFollows(followerProfileId, actor, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /** Marcadores del propio perfil. */
  @Get('bookmarks')
  @ApiOperation({ summary: 'Marcadores guardados por un perfil' })
  listBookmarks(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('collectionName') collectionName?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<BookmarkPageDto> {
    return this.readService.listBookmarks(profileId, actor, {
      collectionName,
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /** Bloqueos emitidos por el propio perfil. */
  @Get('blocks')
  @ApiOperation({ summary: 'Bloqueos emitidos por un perfil' })
  listBlocks(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<BlockPageDto> {
    return this.readService.listBlocks(profileId, actor, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }
}
