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
} from './controllers';
import {
  CommunitySocialService,
  CommunityMessagingService,
  CommunityModerationService,
  CommunityReviewsService,
  CommunityGroupsService,
  CommunityPollsService,
  CommunityFeedService,
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
    CommunityFeedbackRepository,
    CommunityPrestigeRepository,
    // Servicios
    CommunitySocialService,
    CommunityMessagingService,
    CommunityModerationService,
    CommunityReviewsService,
    CommunityGroupsService,
    CommunityPollsService,
    CommunityFeedService,
  ],
})
export class CommunityModule {}
