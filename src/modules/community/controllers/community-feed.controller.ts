import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityFeedService } from '../services';
import {
  RebuildFeedDto,
  FeedRebuildResponseDto,
  FeedPendingResponseDto,
  FeedRankingPendingResponseDto,
  ApplyFeedRankingDto,
  FeedRankingApplyResponseDto,
  FEED_RANKING_MAX_BATCH,
} from '../dto';

/** Antigüedad máxima, en horas, de los posts que entran al lote de fan-out. */
const PENDING_WINDOW_HOURS = 24;
/** Tope de posts por lote. */
const PENDING_POSTS_LIMIT = 50;
/** Tope de seguidores que se reparten por post en una pasada. */
const FOLLOWERS_PER_POST = 5_000;

/**
 * Endpoints internos del fan-out de feed (UC-19-15). No expuestos al usuario
 * final.
 *
 * Los dos aceptan `SYSTEM` **y** `SECURITY_ADMIN`: el worker autentica con rol
 * `SYSTEM` (`SystemApiClient`), y con sólo `SECURITY_ADMIN` recibía 403 y el
 * fan-out no llegaba a ejecutarse nunca. Se conserva `SECURITY_ADMIN` para el
 * disparo manual, que es como lo ejerce el smoke.
 */
@ApiTags('community-feed')
@ApiBearerAuth()
@Controller('internal/community/feed')
export class CommunityFeedController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: CommunityFeedService) {}

  /** UC-19-15. */
  @Audited({
    action: 'COMMUNITY_FEED_REBUILT',
    entity: 'feed_item',
  })
  @Post('rebuild')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar feed (fan-out y ranking)' })
  rebuild(
    @Body() dto: RebuildFeedDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FeedRebuildResponseDto> {
    return this.service.rebuild(dto, actor);
  }

  /**
   * Lote de publicaciones pendientes de repartir, con sus destinatarios.
   *
   * Es el paso previo de `rebuild`, que necesita la lista de seguidores ya
   * resuelta y no la puede deducir sola.
   */
  @Get('pending')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Publicaciones publicadas sin fan-out' })
  pending(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FeedPendingResponseDto> {
    return this.service.pendingFanout({
      withinHours: PENDING_WINDOW_HOURS,
      limit: limit ?? PENDING_POSTS_LIMIT,
      followersPerPost: FOLLOWERS_PER_POST,
    });
  }

  /**
   * Lote de ítems de feed pendientes de recalcular su rank_score (UC-19-16).
   *
   * Descubre-y-actúa como `pending`/`rebuild`: este endpoint junta las
   * señales crudas (recencia, interacción) y `ranking/apply` persiste el
   * puntaje que el worker calculó con ellas.
   */
  @Get('ranking/pending')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Items de feed pendientes de puntuar' })
  rankingPending(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FeedRankingPendingResponseDto> {
    return this.service.pendingRanking(
      Math.min(limit ?? FEED_RANKING_MAX_BATCH, FEED_RANKING_MAX_BATCH),
    );
  }

  /** Aplica los rank_score recalculados por el worker (UC-19-16). */
  @NotAudited(
    'Plomería del worker: rank_score es un dato derivado y recalculable (recencia e interacción), sin datos personales; lo vuelve a escribir cada pasada de RankingScoreJob.',
  )
  @Post('ranking/apply')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Aplicar rank_score recalculado' })
  rankingApply(
    @Body() dto: ApplyFeedRankingDto,
  ): Promise<FeedRankingApplyResponseDto> {
    return this.service.applyRanking(dto);
  }
}
