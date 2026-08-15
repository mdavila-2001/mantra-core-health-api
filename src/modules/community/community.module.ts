import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  CommunitySocialController,
  CommunityMessagingController,
  CommunityModerationController,
  CommunityReviewsController,
  CommunityGroupsController,
  CommunityPollsController,
  CommunityFeedController,
  CommunityTimelineController,
} from './controllers';
import {
  CommunitySocialService,
  CommunityMessagingService,
  CommunityModerationService,
  CommunityReviewsService,
  CommunityGroupsService,
  CommunityPollsService,
  CommunityFeedService,
  PublicProfileProjectionService,
  CommunityRatingsService,
  CommunityVisibilityService,
  CommunitySocialReadService,
  CommunityTimelineReadService,
  CommunityMessagingReadService,
  CommunityGroupsReadService,
  CommunityPollsReadService,
  CommunityReviewsReadService,
} from './services';
import {
  PublicProfilesRepository,
  PostsRepository,
  CommentsRepository,
  ReactionsRepository,
  BookmarksRepository,
  FollowsRepository,
  BlocksRepository,
  ConversationsRepository,
  ModerationRepository,
  ReviewsRepository,
  PollsRepository,
  GroupsRepository,
  FeedRepository,
  NotificationsRepository,
  CommunityFeedbackRepository,
  CommunityPrestigeRepository,
} from './repositories';

/**
 * Módulo Community (19): perfiles públicos, grafo social (posts, comentarios,
 * reacciones, bookmarks, follows, bloqueos), mensajería directa, moderación
 * (reportes, decisiones, apelaciones), reviews verificadas, encuestas, grupos y
 * fan-out de feed. Auth vía guard global (`AuthModule`).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    CommunitySocialController,
    CommunityMessagingController,
    CommunityModerationController,
    CommunityReviewsController,
    CommunityGroupsController,
    CommunityPollsController,
    CommunityFeedController,
    CommunityTimelineController,
  ],
  providers: [
    // Repositorios
    PublicProfilesRepository,
    PostsRepository,
    CommentsRepository,
    ReactionsRepository,
    BookmarksRepository,
    FollowsRepository,
    BlocksRepository,
    ConversationsRepository,
    ModerationRepository,
    ReviewsRepository,
    PollsRepository,
    GroupsRepository,
    FeedRepository,
    NotificationsRepository,
    CommunityFeedbackRepository,
    CommunityPrestigeRepository,
    // Servicios de escritura
    CommunitySocialService,
    CommunityMessagingService,
    CommunityModerationService,
    CommunityReviewsService,
    CommunityGroupsService,
    CommunityPollsService,
    CommunityFeedService,
    PublicProfileProjectionService,
    CommunityRatingsService,
    // Servicios de lectura (la visibilidad la comparten todos)
    CommunityVisibilityService,
    CommunitySocialReadService,
    CommunityTimelineReadService,
    CommunityMessagingReadService,
    CommunityGroupsReadService,
    CommunityPollsReadService,
    CommunityReviewsReadService,
  ],
  // La proyección la consume `diagnostic_units` al publicar un perfil; la nota,
  // su buscador de centros. Las dos salen de acá y no de un `find` ajeno: la
  // regla de qué reseña cuenta es de este módulo.
  exports: [PublicProfileProjectionService, CommunityRatingsService],
})
export class CommunityModule {}
