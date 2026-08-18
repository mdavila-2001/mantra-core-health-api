import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { CommonModule } from '../common/common.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ClinicalModule } from '../clinical/clinical.module';
import {
  CommunitySocialController,
  CommunityMessagingController,
  CommunityModerationController,
  CommunityReviewsController,
  CommunityGroupsController,
  CommunityTopicsController,
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
  CommunityGroupWallService,
  CommunityGroupAccessService,
  CommunityGroupNotificationsService,
  CommunityPollsService,
  CommunityFeedService,
  PublicProfileProjectionService,
  CommunityRatingsService,
  CommunityVisibilityService,
  CommunityEngagementService,
  CommunitySocialReadService,
  CommunityTimelineReadService,
  CommunityMessagingReadService,
  CommunityGroupsReadService,
  CommunityPollsReadService,
  CommunityReviewsReadService,
  CommunityModerationReadService,
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
// La reseña verificada comprueba que hubo atención real leyendo el encuentro
// clínico. Es un repositorio sin estado que recibe el `EntityManager` por
// parámetro, así que proveerlo acá no duplica nada ni crea dos fuentes de
// verdad — el mismo criterio con el que `scheduling` provee
// `AppointmentsRepository`—, y evita importar el módulo clínico entero.
//
// FALTABA: `CommunityReviewsService` lo inyecta desde el commit 4293c63f y
// nadie lo proveía, así que **la aplicación entera no arrancaba**
// (`UnknownDependenciesException` en `CommunityModule`). Detectado desde el
// carril P8 al levantar la API para su evidencia funcional; queda anotado en
// `reports/P8.md` para el responsable de community.
import { EncountersRepository } from '../clinical/repositories';

/**
 * Módulo Community (19): perfiles públicos, grafo social (posts, comentarios,
 * reacciones, bookmarks, follows, bloqueos), mensajería directa, moderación
 * (reportes, decisiones, apelaciones), reviews verificadas, encuestas, grupos y
 * fan-out de feed. Auth vía guard global (`AuthModule`).
 */
@Module({
  // `CommonModule` entra por el subsistema de archivos: adjuntar media a un post
  // exige comprobar el archivo contra `common.files`, no confiar en el uuid que
  // manda el cliente.
  //
  // `MessagingModule` entra por el contrato de notificaciones de P1: community
  // decide a quién avisar de lo que pasa en un grupo; messaging entrega.
  //
  // `ClinicalModule` por `EncountersRepository`: `CommunityReviewsService` exige
  // atención real antes de aceptar una reseña. No hay ciclo — `clinical` no
  // importa nada de `community` — y es el mismo patrón que ya usa
  // `procedures_perioperative`.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommonModule,
    ClinicalModule,
    MessagingModule,
  ],
  controllers: [
    CommunitySocialController,
    CommunityMessagingController,
    CommunityModerationController,
    CommunityReviewsController,
    CommunityGroupsController,
    CommunityTopicsController,
    CommunityPollsController,
    CommunityFeedController,
    CommunityTimelineController,
    // Va en esta lista y no en read_models a propósito; el orden de registro
    // frente a PublicProjectionsController lo protege community-public.smoke.ts.
    CommunityPublicController,
  ],
  providers: [
    // Repositorios
    EncountersRepository,
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
    CommunityGroupWallService,
    CommunityGroupNotificationsService,
    CommunityPollsService,
    CommunityFeedService,
    PublicProfileProjectionService,
    CommunityRatingsService,
    // Servicios de lectura (la visibilidad la comparten todos)
    CommunityVisibilityService,
    CommunityEngagementService,
    CommunityGroupAccessService,
    CommunitySocialReadService,
    CommunityTimelineReadService,
    CommunityMessagingReadService,
    CommunityGroupsReadService,
    CommunityPollsReadService,
    CommunityReviewsReadService,
    CommunityModerationReadService,
    CommunityPublicService,
  ],
  // La proyección la consume `diagnostic_units` al publicar un perfil; la nota,
  // su buscador de centros. Las dos salen de acá y no de un `find` ajeno: la
  // regla de qué reseña cuenta es de este módulo.
  exports: [PublicProfileProjectionService, CommunityRatingsService],
})
export class CommunityModule {}
