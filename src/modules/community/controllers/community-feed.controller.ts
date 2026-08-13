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
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityFeedService } from '../services';
import {
  RebuildFeedDto,
  FeedRebuildResponseDto,
  FeedPendingResponseDto,
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
}
