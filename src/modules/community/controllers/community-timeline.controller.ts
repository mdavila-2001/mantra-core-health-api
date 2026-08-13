import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityTimelineReadService } from '../services';
import type { FeedPageDto, NotificationPageDto } from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/**
 * Timeline y bandeja de notificaciones del propio perfil.
 *
 * Vive en un controlador propio y no en `CommunityFeedController` porque aquel
 * cuelga de `internal/community/feed` y es del worker: mezclar la lectura de la
 * persona con el disparo del fan-out en el mismo prefijo obligaría a que las
 * dos compartan rol, y no lo comparten.
 */
@ApiTags('community-timeline')
@ApiBearerAuth()
@Controller('community')
export class CommunityTimelineController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Lecturas del timeline y las notificaciones.
   */
  constructor(private readonly readService: CommunityTimelineReadService) {}

  /** UC-19-13 (cara de lectura). Timeline del propio perfil. */
  @Get('feed')
  @ApiOperation({ summary: 'Timeline de un perfil' })
  getFeed(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FeedPageDto> {
    return this.readService.getFeed(profileId, actor, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /** Bandeja de notificaciones del propio perfil, con el total sin leer. */
  @Get('notifications')
  @ApiOperation({ summary: 'Notificaciones sociales de un perfil' })
  listNotifications(
    @Query('profileId', ParseUUIDPipe) profileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<NotificationPageDto> {
    return this.readService.listNotifications(profileId, actor, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }
}
