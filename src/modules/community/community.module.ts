import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { CommonModule } from '../common/common.module';
// Carril P2: enviar un mensaje avisa al destinatario por el canal in-app de P1.
// `MessagingModule` exporta `NotificationsService` justamente para esto, y no
// hay ciclo: `messaging` no sabe nada de `community`.
import { MessagingModule } from '../messaging/messaging.module';
// El vínculo persona ↔ cuenta, para resolver a qué usuario avisarle. Se provee
// el repositorio suelto y no se importa `ProfilesModule`, por lo mismo que hace
// `clinical`: es una clase sin estado que recibe el `EntityManager`.
import { PersonAccountLinksRepository } from '../profiles/repositories';
// El filtro por especialidad del directorio público valida contra el value set
// `VS_MEDICAL_SPECIALTY` con **el mismo servicio** que el alta de profesional.
// Se provee la clase suelta y no se importa `ProfilesModule` por el mismo
// motivo que `PersonAccountLinksRepository`, y además porque no se podría:
// `ProfilesModule` importa `DirectoryModule`, que importa este módulo. La clase
// no tiene estado —no cachea, y su propio TSDoc explica por qué— así que una
// segunda instancia responde exactamente lo mismo que la de `profiles`.
import { MedicalSpecialtyCatalogService } from '../profiles/services/medical-specialty-catalog.service';
// De acá sale `ValueSetsRepository`, que es de donde el servicio de arriba lee
// los 36 conceptos, y `CatalogConceptsRepository`, que da el rótulo con el que
// el índice de búsqueda guarda la especialidad. `terminology` no importa ningún
// módulo de dominio, así que no hay ciclo.
import { TerminologyModule } from '../terminology/terminology.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { SearchPlatformModule } from '../search_platform/search_platform.module';
import { RedisRuntimeModule } from '../redis_runtime/redis_runtime.module';
import { WsJwtGuard } from '../../common';
import {
  CommunitySocialController,
  CommunityMessagingController,
  CommunityModerationController,
  CommunityReviewsController,
  PatientReviewsController,
  CommunityGroupsController,
  CommunityTopicsController,
  CommunityPollsController,
  CommunityFeedController,
  CommunityTimelineController,
  CommunityPublicController,
  CommunitySearchIndexController,
  CommunityVerificationController,
} from './controllers';
import {
  CommunitySocialService,
  CommunityChatAutoReplyService,
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
  CommunityMessageNotificationsService,
  CommunityPresenceService,
  CommunityGroupsReadService,
  CommunityPollsReadService,
  CommunityReviewsReadService,
  CommunityModerationReadService,
  CommunityPublicService,
  CommunitySearchIndexService,
  CommunityVerificationService,
  CommunityProfileStatsService,
} from './services';
import { CommunityMessagingGateway } from './gateways';
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
  VerifiedBadgesRepository,
} from './repositories';

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
  // `SearchPlatformModule` por P10: el buscador público consulta OpenSearch y
  // degrada a SQL si no responde. No hay ciclo — `search_platform` es
  // infraestructura y no importa ningún módulo de dominio.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommonModule,
    ClinicalModule,
    SearchPlatformModule,
    // `RedisRuntimeModule` por P13: las estadísticas del perfil son un contador
    // por perfil y día, que es lo que Redis hace bien y lo que evita guardar el
    // rastro de cada visitante anónimo para poder contarlo.
    RedisRuntimeModule,
    MessagingModule,
    TerminologyModule,
  ],
  controllers: [
    CommunitySocialController,
    CommunityMessagingController,
    CommunityModerationController,
    CommunityReviewsController,
    // Cuelga de `/patients/me` y no de `/community/profiles`: el paciente
    // identifica lo que califica por su atención, no por el uuid de la
    // vitrina — que la ficha pública no publica.
    PatientReviewsController,
    CommunityGroupsController,
    CommunityTopicsController,
    CommunityPollsController,
    CommunityFeedController,
    CommunityTimelineController,
    // Va en esta lista y no en read_models a propósito; el orden de registro
    // frente a PublicProjectionsController lo protege community-public.smoke.ts.
    CommunityPublicController,
    CommunitySearchIndexController,
    CommunityVerificationController,
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
    VerifiedBadgesRepository,
    PersonAccountLinksRepository,
    // La regla de «qué uuid es una especialidad médica», compartida con el alta
    // de profesional. Ver la nota del import.
    MedicalSpecialtyCatalogService,
    // Auth del gateway WS — `WsJwtGuard` no es un `APP_GUARD` (los gateways no
    // pasan por el pipeline HTTP de guards), así que hay que proveerlo acá
    // explícitamente para que `CommunityMessagingGateway` pueda inyectarlo.
    WsJwtGuard,
    // Servicios de escritura
    CommunitySocialService,
    CommunityChatAutoReplyService,
    CommunityMessagingService,
    CommunityMessagingGateway,
    CommunityMessageNotificationsService,
    // F4.2 · presencia del chat sobre el Redis compartido del módulo.
    CommunityPresenceService,
    CommunityModerationService,
    CommunityReviewsService,
    CommunityGroupsService,
    CommunityGroupWallService,
    CommunityGroupNotificationsService,
    CommunityPollsService,
    CommunityFeedService,
    PublicProfileProjectionService,
    CommunityRatingsService,
    CommunitySearchIndexService,
    CommunityVerificationService,
    CommunityProfileStatsService,
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
  // `CommunityVerificationService` se exporta para el puente de P13: es
  // `identity_assurance` quien decide que una matrícula quedó verificada, y
  // community quien sabe qué significa eso para el sello del perfil. No hay
  // ciclo — community no importa identity_assurance —, y es el mismo patrón
  // con el que ese módulo ya usa `profiles` y `directory` para sus efectos.
  exports: [
    PublicProfileProjectionService,
    CommunityRatingsService,
    CommunityVerificationService,
    // TAREA-15 (P8 → SupportAdmin): `scheduling` reusa la mensajería directa
    // tal cual la usa «Escribir al doctor», en vez de inventar un tercer
    // sistema de chat. No hay ciclo — `community` no importa `scheduling`.
    CommunityChatAutoReplyService,
    CommunityMessagingService,
  ],
})
export class CommunityModule {}
