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
  CommunityPublicController,
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
  CommunityVisibilityService,
  CommunitySocialReadService,
  CommunityTimelineReadService,
  CommunityMessagingReadService,
  CommunityGroupsReadService,
  CommunityPollsReadService,
  CommunityReviewsReadService,
  CommunityPublicService,
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
  PublicSearchRepository,
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
    // Va en esta lista y no en read_models a propósito; el orden de registro
    // frente a PublicProjectionsController lo protege community-public.smoke.ts.
    CommunityPublicController,
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
    PublicSearchRepository,
    // Servicios de escritura
    CommunitySocialService,
    CommunityMessagingService,
    CommunityModerationService,
    CommunityReviewsService,
    CommunityGroupsService,
    CommunityPollsService,
    CommunityFeedService,
    PublicProfileProjectionService,
    // Servicios de lectura (la visibilidad la comparten todos)
    CommunityVisibilityService,
    CommunitySocialReadService,
    CommunityTimelineReadService,
    CommunityMessagingReadService,
    CommunityGroupsReadService,
    CommunityPollsReadService,
    CommunityReviewsReadService,
    CommunityPublicService,
  ],
  exports: [PublicProfileProjectionService],
})
export class CommunityModule {}
