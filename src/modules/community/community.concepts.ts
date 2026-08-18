import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Community (19). Cubren estados de ciclo de vida, tipos
 * polimórficos (contenido reaccionable/comentable/moderable), tipos de reacción,
 * razones de reporte, decisiones de moderación y dimensiones de review. Toda
 * columna `*_concept_id` NOT NULL de los inserts del módulo resuelve a uno de
 * estos ids o a `CONCEPTS.STATE_ACTIVE`/`STATE_PENDING` transversales.
 *
 * El prefijo `community` espacia las claves para no colisionar con otros módulos.
 */
export const { seeds: COMMUNITY_CONCEPT_SEEDS, ids: COMM } =
  defineModuleConcepts('community', {
    // --- Public profiles ---
    PROFILE_TARGET_USER: {
      code: 'PROFILE_TARGET_USER',
      display: 'User public profile',
    },
    PROFILE_TARGET_PRACTITIONER: {
      code: 'PROFILE_TARGET_PRACTITIONER',
      display: 'Practitioner public profile',
    },
    PROFILE_TARGET_ORGANIZATION: {
      code: 'PROFILE_TARGET_ORGANIZATION',
      display: 'Organization public profile',
    },
    // Los tres de arriba cubrían la red social; el buscador público (V65) tiene
    // cinco verticales, así que farmacia, laboratorio y aseguradora también
    // necesitan poder tener vitrina propia.
    PROFILE_TARGET_PHARMACY: {
      code: 'PROFILE_TARGET_PHARMACY',
      display: 'Pharmacy public profile',
    },
    PROFILE_TARGET_DIAGNOSTIC_UNIT: {
      code: 'PROFILE_TARGET_DIAGNOSTIC_UNIT',
      display: 'Diagnostic unit public profile',
    },
    PROFILE_TARGET_INSURER: {
      code: 'PROFILE_TARGET_INSURER',
      display: 'Insurer public profile',
    },
    PROFILE_VISIBILITY_PUBLIC: {
      code: 'PROFILE_VISIBILITY_PUBLIC',
      display: 'Profile listed on the public directory',
    },
    PROFILE_VISIBILITY_PRIVATE: {
      code: 'PROFILE_VISIBILITY_PRIVATE',
      display: 'Profile visible only to authenticated sessions',
    },

    // --- Posts ---
    POST_TYPE_TEXT: { code: 'POST_TYPE_TEXT', display: 'Text post' },
    POST_TYPE_POLL: { code: 'POST_TYPE_POLL', display: 'Poll post' },
    SCREENING_PASSED: {
      code: 'HEALTH_SCREENING_PASSED',
      display: 'Health data screening passed',
    },
    POST_VISIBILITY_PUBLIC: {
      code: 'POST_VISIBILITY_PUBLIC',
      display: 'Public post',
    },
    POST_VISIBILITY_FOLLOWERS: {
      code: 'POST_VISIBILITY_FOLLOWERS',
      display: 'Followers-only post',
    },
    POST_VISIBILITY_PRIVATE: {
      code: 'POST_VISIBILITY_PRIVATE',
      display: 'Author-only post',
    },
    MEDIA_ROLE_IMAGE: { code: 'MEDIA_ROLE_IMAGE', display: 'Image media' },
    MEDIA_ROLE_VIDEO: { code: 'MEDIA_ROLE_VIDEO', display: 'Video media' },
    MEDIA_ROLE_DOCUMENT: {
      code: 'MEDIA_ROLE_DOCUMENT',
      display: 'Document media',
    },

    // --- Moderation lifecycle applied to content (posts/comments/reviews) ---
    MODERATION_PENDING: {
      code: 'MODERATION_PENDING',
      display: 'Moderation pending',
    },
    MODERATION_APPROVED: {
      code: 'MODERATION_APPROVED',
      display: 'Moderation approved',
    },
    MODERATION_REMOVED: {
      code: 'MODERATION_REMOVED',
      display: 'Content removed',
    },
    MODERATION_RESTRICTED: {
      code: 'MODERATION_RESTRICTED',
      display: 'Content restricted',
    },
    PUBLICATION_PUBLISHED: {
      code: 'PUBLICATION_PUBLISHED',
      display: 'Published',
    },
    PUBLICATION_RESTRICTED: {
      code: 'PUBLICATION_RESTRICTED',
      display: 'Restricted publication',
    },
    PUBLICATION_REMOVED: {
      code: 'PUBLICATION_REMOVED',
      display: 'Removed publication',
    },

    // --- Polymorphic content/object types ---
    CONTENT_TYPE_POST: { code: 'CONTENT_TYPE_POST', display: 'Post content' },
    CONTENT_TYPE_COMMENT: {
      code: 'CONTENT_TYPE_COMMENT',
      display: 'Comment content',
    },
    CONTENT_TYPE_REVIEW: {
      code: 'CONTENT_TYPE_REVIEW',
      display: 'Review content',
    },
    CONTENT_TYPE_PROFILE: {
      code: 'CONTENT_TYPE_PROFILE',
      display: 'Profile content',
    },
    /**
     * El grupo como cosa comentable (P7).
     *
     * El muro de un grupo son `comments` colgados del grupo, no `social_posts`:
     * `social_posts` no tiene `group_id` en el modelo y este carril no crea
     * esquema. Ver `CommunityGroupWallService` para el razonamiento completo.
     */
    CONTENT_TYPE_GROUP: {
      code: 'CONTENT_TYPE_GROUP',
      display: 'Group content',
    },
    CONTENT_TYPE_MESSAGE: {
      code: 'CONTENT_TYPE_MESSAGE',
      display: 'Message content',
    },

    // --- Comments ---
    MENTION_STATUS_ACTIVE: {
      code: 'MENTION_STATUS_ACTIVE',
      display: 'Mention active',
    },

    // --- Reaction types ---
    REACTION_LIKE: { code: 'REACTION_LIKE', display: 'Like' },
    REACTION_LOVE: { code: 'REACTION_LOVE', display: 'Love' },
    REACTION_INSIGHTFUL: { code: 'REACTION_INSIGHTFUL', display: 'Insightful' },
    REACTION_CELEBRATE: { code: 'REACTION_CELEBRATE', display: 'Celebrate' },
    REACTION_SUPPORT: { code: 'REACTION_SUPPORT', display: 'Support' },

    // --- Follows ---
    FOLLOWABLE_PROFILE: {
      code: 'FOLLOWABLE_PROFILE',
      display: 'Followable profile',
    },
    FOLLOWABLE_TOPIC: { code: 'FOLLOWABLE_TOPIC', display: 'Followable topic' },
    FOLLOWABLE_HASHTAG: {
      code: 'FOLLOWABLE_HASHTAG',
      display: 'Followable hashtag',
    },
    FOLLOWABLE_GROUP: { code: 'FOLLOWABLE_GROUP', display: 'Followable group' },
    FOLLOW_REMOVED: { code: 'FOLLOW_REMOVED', display: 'Follow removed' },
    NOTIFICATION_LEVEL_ALL: {
      code: 'NOTIFICATION_LEVEL_ALL',
      display: 'Notify on all activity',
    },
    NOTIFICATION_LEVEL_HIGHLIGHTS: {
      code: 'NOTIFICATION_LEVEL_HIGHLIGHTS',
      display: 'Notify highlights only',
    },
    NOTIFICATION_LEVEL_NONE: {
      code: 'NOTIFICATION_LEVEL_NONE',
      display: 'Muted',
    },

    // --- Conversations & messaging ---
    CONVERSATION_DIRECT: {
      code: 'CONVERSATION_DIRECT',
      display: 'Direct conversation',
    },
    CONVERSATION_GROUP: {
      code: 'CONVERSATION_GROUP',
      display: 'Group conversation',
    },
    PARTICIPANT_ROLE_MEMBER: {
      code: 'PARTICIPANT_ROLE_MEMBER',
      display: 'Conversation member',
    },
    PARTICIPANT_ROLE_OWNER: {
      code: 'PARTICIPANT_ROLE_OWNER',
      display: 'Conversation owner',
    },
    MESSAGE_CONTENT_TEXT: {
      code: 'MESSAGE_CONTENT_TEXT',
      display: 'Text message',
    },
    MESSAGE_CONTENT_MEDIA: {
      code: 'MESSAGE_CONTENT_MEDIA',
      display: 'Media message',
    },
    MESSAGE_SENT: { code: 'MESSAGE_SENT', display: 'Message sent' },
    RECEIPT_DELIVERED: {
      code: 'RECEIPT_DELIVERED',
      display: 'Delivered receipt',
    },
    RECEIPT_READ: { code: 'RECEIPT_READ', display: 'Read receipt' },

    // --- Content reports ---
    REPORT_TARGET_POST: {
      code: 'REPORT_TARGET_POST',
      display: 'Reported post',
    },
    REPORT_TARGET_COMMENT: {
      code: 'REPORT_TARGET_COMMENT',
      display: 'Reported comment',
    },
    REPORT_TARGET_PROFILE: {
      code: 'REPORT_TARGET_PROFILE',
      display: 'Reported profile',
    },
    REPORT_TARGET_MESSAGE: {
      code: 'REPORT_TARGET_MESSAGE',
      display: 'Reported message',
    },
    REPORT_TARGET_REVIEW: {
      code: 'REPORT_TARGET_REVIEW',
      display: 'Reported review',
    },
    REPORT_REASON_SPAM: { code: 'REPORT_REASON_SPAM', display: 'Spam' },
    REPORT_REASON_ABUSE: {
      code: 'REPORT_REASON_ABUSE',
      display: 'Abuse or harassment',
    },
    REPORT_REASON_MISINFORMATION: {
      code: 'REPORT_REASON_MISINFORMATION',
      display: 'Misinformation',
    },
    REPORT_REASON_PHI: {
      code: 'REPORT_REASON_PHI',
      display: 'Exposed health data',
    },
    REPORT_REASON_OTHER: {
      code: 'REPORT_REASON_OTHER',
      display: 'Other reason',
    },
    REPORT_OPEN: { code: 'REPORT_OPEN', display: 'Report open' },
    REPORT_RESOLVED: { code: 'REPORT_RESOLVED', display: 'Report resolved' },

    // --- Moderation queue ---
    QUEUE_SOURCE_USER_REPORT: {
      code: 'QUEUE_SOURCE_USER_REPORT',
      display: 'Queued from user report',
    },
    QUEUE_SOURCE_APPEAL: {
      code: 'QUEUE_SOURCE_APPEAL',
      display: 'Queued from appeal',
    },
    QUEUE_SOURCE_ML: {
      code: 'QUEUE_SOURCE_ML',
      display: 'Queued from ML signal',
    },
    QUEUE_PRIORITY_LOW: { code: 'QUEUE_PRIORITY_LOW', display: 'Low priority' },
    QUEUE_PRIORITY_NORMAL: {
      code: 'QUEUE_PRIORITY_NORMAL',
      display: 'Normal priority',
    },
    QUEUE_PRIORITY_HIGH: {
      code: 'QUEUE_PRIORITY_HIGH',
      display: 'High priority',
    },
    QUEUE_QUEUED: { code: 'QUEUE_QUEUED', display: 'Queued' },
    QUEUE_IN_REVIEW: { code: 'QUEUE_IN_REVIEW', display: 'In review' },
    QUEUE_RESOLVED: { code: 'QUEUE_RESOLVED', display: 'Resolved' },

    // --- Moderation decisions ---
    DECISION_REMOVED: { code: 'DECISION_REMOVED', display: 'Removed' },
    DECISION_RESTRICTED: { code: 'DECISION_RESTRICTED', display: 'Restricted' },
    DECISION_WARNED: { code: 'DECISION_WARNED', display: 'Warned' },
    DECISION_DISMISSED: { code: 'DECISION_DISMISSED', display: 'Dismissed' },
    POLICY_COMMUNITY_GUIDELINES: {
      code: 'POLICY_COMMUNITY_GUIDELINES',
      display: 'Community guidelines',
    },
    ACTION_CONTENT_REMOVED: {
      code: 'ACTION_CONTENT_REMOVED',
      display: 'Content removed',
    },
    ACTION_CONTENT_RESTRICTED: {
      code: 'ACTION_CONTENT_RESTRICTED',
      display: 'Content restricted',
    },
    ACTION_WARNING_ISSUED: {
      code: 'ACTION_WARNING_ISSUED',
      display: 'Warning issued',
    },
    ACTION_NONE: { code: 'ACTION_NONE', display: 'No action' },

    // --- Moderation strikes ---
    STRIKE_SEVERITY_LOW: {
      code: 'STRIKE_SEVERITY_LOW',
      display: 'Low severity strike',
    },
    STRIKE_SEVERITY_MEDIUM: {
      code: 'STRIKE_SEVERITY_MEDIUM',
      display: 'Medium severity strike',
    },
    STRIKE_SEVERITY_HIGH: {
      code: 'STRIKE_SEVERITY_HIGH',
      display: 'High severity strike',
    },
    STRIKE_ACTIVE: { code: 'STRIKE_ACTIVE', display: 'Strike active' },

    // --- Moderation appeals ---
    APPEAL_OPEN: { code: 'APPEAL_OPEN', display: 'Appeal open' },
    APPEAL_UPHELD: { code: 'APPEAL_UPHELD', display: 'Appeal upheld' },
    APPEAL_OVERTURNED: {
      code: 'APPEAL_OVERTURNED',
      display: 'Appeal overturned',
    },
    APPEAL_PARTIAL: {
      code: 'APPEAL_PARTIAL',
      display: 'Appeal partially upheld',
    },

    // --- Service reviews ---
    REVIEW_VERIFIED: { code: 'REVIEW_VERIFIED', display: 'Review verified' },
    REVIEW_UNVERIFIED: {
      code: 'REVIEW_UNVERIFIED',
      display: 'Review unverified',
    },
    REVIEW_DISPLAY_REAL_NAME: {
      code: 'REVIEW_DISPLAY_REAL_NAME',
      display: 'Show reviewer name',
    },
    REVIEW_DISPLAY_ANONYMOUS: {
      code: 'REVIEW_DISPLAY_ANONYMOUS',
      display: 'Anonymous reviewer',
    },
    REVIEW_DIMENSION_COMMUNICATION: {
      code: 'REVIEW_DIMENSION_COMMUNICATION',
      display: 'Communication',
    },
    REVIEW_DIMENSION_PUNCTUALITY: {
      code: 'REVIEW_DIMENSION_PUNCTUALITY',
      display: 'Punctuality',
    },
    REVIEW_DIMENSION_CLEANLINESS: {
      code: 'REVIEW_DIMENSION_CLEANLINESS',
      display: 'Cleanliness',
    },
    REVIEW_DIMENSION_OUTCOME: {
      code: 'REVIEW_DIMENSION_OUTCOME',
      display: 'Outcome',
    },

    // --- Polls ---
    POLL_OPEN: { code: 'POLL_OPEN', display: 'Poll open' },
    POLL_CLOSED: { code: 'POLL_CLOSED', display: 'Poll closed' },

    // --- Groups ---
    GROUP_VISIBILITY_PUBLIC: {
      code: 'GROUP_VISIBILITY_PUBLIC',
      display: 'Public group',
    },
    GROUP_VISIBILITY_PRIVATE: {
      code: 'GROUP_VISIBILITY_PRIVATE',
      display: 'Private group',
    },
    GROUP_VISIBILITY_SECRET: {
      code: 'GROUP_VISIBILITY_SECRET',
      display: 'Secret group',
    },
    GROUP_TYPE_GENERAL: {
      code: 'GROUP_TYPE_GENERAL',
      display: 'General group',
    },
    GROUP_TYPE_SUPPORT: {
      code: 'GROUP_TYPE_SUPPORT',
      display: 'Support group',
    },
    GROUP_ROLE_MEMBER: { code: 'GROUP_ROLE_MEMBER', display: 'Group member' },
    GROUP_ROLE_OWNER: { code: 'GROUP_ROLE_OWNER', display: 'Group owner' },
    /**
     * Modera y aprueba altas sin ser el dueño (P7).
     *
     * Un grupo privado necesita más de una persona que apruebe: si sólo el
     * dueño puede hacerlo, la cola de pendientes se detiene el día que se toma
     * vacaciones. `ADMIN` hace todo lo del dueño salvo existir sin él;
     * `MODERATOR` sólo interviene sobre el contenido del muro.
     */
    GROUP_ROLE_ADMIN: { code: 'GROUP_ROLE_ADMIN', display: 'Group admin' },
    GROUP_ROLE_MODERATOR: {
      code: 'GROUP_ROLE_MODERATOR',
      display: 'Group moderator',
    },
    GROUP_JOIN_ACTIVE: {
      code: 'GROUP_JOIN_ACTIVE',
      display: 'Membership active',
    },
    GROUP_JOIN_PENDING: {
      code: 'GROUP_JOIN_PENDING',
      display: 'Membership pending',
    },
    /**
     * Estados terminales de una membresía (P7).
     *
     * La fila no se borra: `LEFT` y `REMOVED` se distinguen porque volver a
     * entrar a un grupo del que uno se fue es un alta común, y volver a entrar
     * a uno del que lo expulsaron no debería serlo. Guardar el desenlace es lo
     * que deja esa regla escribible más adelante sin inventar una tabla de
     * historial.
     */
    GROUP_JOIN_REJECTED: {
      code: 'GROUP_JOIN_REJECTED',
      display: 'Membership rejected',
    },
    GROUP_JOIN_LEFT: {
      code: 'GROUP_JOIN_LEFT',
      display: 'Membership left',
    },
    GROUP_JOIN_REMOVED: {
      code: 'GROUP_JOIN_REMOVED',
      display: 'Membership removed by an admin',
    },

    // --- Blocks ---
    BLOCK_REASON_HARASSMENT: {
      code: 'BLOCK_REASON_HARASSMENT',
      display: 'Harassment',
    },
    BLOCK_REASON_SPAM: { code: 'BLOCK_REASON_SPAM', display: 'Spam' },
    BLOCK_REASON_OTHER: { code: 'BLOCK_REASON_OTHER', display: 'Other reason' },

    // --- Feed items ---
    FEED_ITEM_POST: { code: 'FEED_ITEM_POST', display: 'Feed post item' },
    FEED_SOURCE_POST: { code: 'FEED_SOURCE_POST', display: 'Feed source post' },
    FEED_ORIGIN_FOLLOWING: {
      code: 'FEED_ORIGIN_FOLLOWING',
      display: 'From following',
    },
    FEED_ORIGIN_GROUP: { code: 'FEED_ORIGIN_GROUP', display: 'From group' },
    FEED_ORIGIN_TOPIC: { code: 'FEED_ORIGIN_TOPIC', display: 'From topic' },
    FEED_ORIGIN_SUGGESTED: {
      code: 'FEED_ORIGIN_SUGGESTED',
      display: 'Suggested',
    },
    FEED_ORIGIN_PROMOTED: { code: 'FEED_ORIGIN_PROMOTED', display: 'Promoted' },
  });

/** Reaction enum → concept id (UC-19-03). */
export const REACTION_CONCEPT_BY_CODE: Record<string, string> = {
  LIKE: COMM.REACTION_LIKE,
  LOVE: COMM.REACTION_LOVE,
  INSIGHTFUL: COMM.REACTION_INSIGHTFUL,
  CELEBRATE: COMM.REACTION_CELEBRATE,
  SUPPORT: COMM.REACTION_SUPPORT,
};

/**
 * Concept id → código de reacción. Es la inversa de {@link REACTION_CONCEPT_BY_CODE}.
 *
 * **Por qué hace falta.** El módulo se escribe con la palabra (`LIKE`) y se leía
 * sólo con el uuid del concepto. Una interfaz que recibe el uuid de «con qué
 * reaccionaste» no puede marcar el botón correspondiente sin resolver
 * terminología en cada render — y el DoD del módulo dice que ninguna respuesta
 * expone un uuid interno que la interfaz no pueda resolver a etiqueta legible.
 * Se deriva del mapa directo para que no puedan desincronizarse.
 */
export const REACTION_CODE_BY_CONCEPT: Record<string, string> =
  Object.fromEntries(
    Object.entries(REACTION_CONCEPT_BY_CODE).map(([code, concept]) => [
      concept,
      code,
    ]),
  );

/** Reactable/commentable/bookmarkable object type enum → concept id. */
export const SOCIAL_OBJECT_CONCEPT_BY_CODE: Record<string, string> = {
  POST: COMM.CONTENT_TYPE_POST,
  COMMENT: COMM.CONTENT_TYPE_COMMENT,
  REVIEW: COMM.CONTENT_TYPE_REVIEW,
};

/**
 * Visibilidad declarada de un post → concept id.
 *
 * Una fila con `visibility_concept_id` nulo se lee como pública: son los posts
 * anteriores a que el módulo declarara estos conceptos, y degradarlos a privados
 * los haría desaparecer de los muros donde ya se publicaron.
 */
export const POST_VISIBILITY_CONCEPT_BY_CODE: Record<string, string> = {
  PUBLIC: COMM.POST_VISIBILITY_PUBLIC,
  FOLLOWERS: COMM.POST_VISIBILITY_FOLLOWERS,
  PRIVATE: COMM.POST_VISIBILITY_PRIVATE,
};

/**
 * Visibilidad declarada de un perfil público → concept id.
 *
 * **La regla es la inversa que en los posts, y a propósito.** Un post con
 * `visibility_concept_id` nulo se lee como público porque ya se publicó en un
 * muro y esconderlo ahora rompería lo que sus lectores ya vieron. Un perfil con
 * la columna nula se lee como **privado**.
 *
 * El motivo es la superficie donde cae cada default. Lo de los posts se decide
 * dentro de la sesión, entre gente que ya se ve. El directorio público de P2 es
 * anónimo y **atraviesa todos los tenants**: `@Public()` levanta la exigencia de
 * contexto de tenant. Si el nulo contara como público, cada perfil creado antes
 * de que existiera este concepto —todos los de hoy— quedaría publicado en
 * internet sin que su titular lo pidiera nunca.
 *
 * Aparecer en el directorio es opt-in explícito. No se hereda de un nulo.
 */
export const PROFILE_VISIBILITY_CONCEPT_BY_CODE: Record<string, string> = {
  PUBLIC: COMM.PROFILE_VISIBILITY_PUBLIC,
  PRIVATE: COMM.PROFILE_VISIBILITY_PRIVATE,
};

/** Followable object type enum → concept id (UC-19-05). */
export const FOLLOWABLE_CONCEPT_BY_CODE: Record<string, string> = {
  PROFILE: COMM.FOLLOWABLE_PROFILE,
  TOPIC: COMM.FOLLOWABLE_TOPIC,
  HASHTAG: COMM.FOLLOWABLE_HASHTAG,
  GROUP: COMM.FOLLOWABLE_GROUP,
};

/**
 * Rol dentro de un grupo → concept id (P7).
 *
 * `OWNER` no está en el mapa a propósito: la propiedad de un grupo se otorga al
 * crearlo, no por un `PATCH` de rol. Dejarlo entrar por acá permitiría que un
 * administrador se coronara dueño de un grupo ajeno.
 */
export const GROUP_ROLE_CONCEPT_BY_CODE: Record<string, string> = {
  MEMBER: COMM.GROUP_ROLE_MEMBER,
  MODERATOR: COMM.GROUP_ROLE_MODERATOR,
  ADMIN: COMM.GROUP_ROLE_ADMIN,
};

/** Report target type enum → concept id (UC-19-08). */
export const REPORT_TARGET_CONCEPT_BY_CODE: Record<string, string> = {
  POST: COMM.REPORT_TARGET_POST,
  COMMENT: COMM.REPORT_TARGET_COMMENT,
  PROFILE: COMM.REPORT_TARGET_PROFILE,
  MESSAGE: COMM.REPORT_TARGET_MESSAGE,
  REVIEW: COMM.REPORT_TARGET_REVIEW,
};

/** Report reason enum → concept id (UC-19-08). */
export const REPORT_REASON_CONCEPT_BY_CODE: Record<string, string> = {
  SPAM: COMM.REPORT_REASON_SPAM,
  ABUSE: COMM.REPORT_REASON_ABUSE,
  MISINFORMATION: COMM.REPORT_REASON_MISINFORMATION,
  PHI: COMM.REPORT_REASON_PHI,
  OTHER: COMM.REPORT_REASON_OTHER,
};

/** Moderation decision enum → { decision, action } concept ids (UC-19-09). */
export const MODERATION_DECISION_BY_CODE: Record<
  string,
  {
    /**
     * Valor de decision mantenido por la instancia.
     */
    decision: string;
    /**
     * Valor de action mantenido por la instancia.
     */
    action: string;
    /**
     * Valor de moderation mantenido por la instancia.
     */
    moderation?: string;
    /**
     * Valor de publication mantenido por la instancia.
     */
    publication?: string;
  }
> = {
  REMOVED: {
    decision: COMM.DECISION_REMOVED,
    action: COMM.ACTION_CONTENT_REMOVED,
    moderation: COMM.MODERATION_REMOVED,
    publication: COMM.PUBLICATION_REMOVED,
  },
  RESTRICTED: {
    decision: COMM.DECISION_RESTRICTED,
    action: COMM.ACTION_CONTENT_RESTRICTED,
    moderation: COMM.MODERATION_RESTRICTED,
    publication: COMM.PUBLICATION_RESTRICTED,
  },
  WARNED: {
    decision: COMM.DECISION_WARNED,
    action: COMM.ACTION_WARNING_ISSUED,
  },
  DISMISSED: {
    decision: COMM.DECISION_DISMISSED,
    action: COMM.ACTION_NONE,
  },
};

/** Appeal resolution enum → concept id (UC-19-10). */
export const APPEAL_RESOLUTION_BY_CODE: Record<string, string> = {
  UPHELD: COMM.APPEAL_UPHELD,
  OVERTURNED: COMM.APPEAL_OVERTURNED,
  PARTIAL: COMM.APPEAL_PARTIAL,
};

/**
 * Estado de apelación enum → concept id, para **filtrar** lecturas.
 *
 * Se distingue de `APPEAL_RESOLUTION_BY_CODE` en que incluye `OPEN`: una
 * apelación abierta no tiene resolución, y es justamente la que un moderador
 * busca cuando entra a trabajar.
 */
export const APPEAL_STATUS_BY_CODE: Record<string, string> = {
  OPEN: COMM.APPEAL_OPEN,
  ...APPEAL_RESOLUTION_BY_CODE,
};

/** Estado de la cola de moderación enum → concept id (UC-19-09, lectura). */
export const QUEUE_STATUS_BY_CODE: Record<string, string> = {
  QUEUED: COMM.QUEUE_QUEUED,
  IN_REVIEW: COMM.QUEUE_IN_REVIEW,
  RESOLVED: COMM.QUEUE_RESOLVED,
};

/** Prioridad de la cola enum → concept id (UC-19-09, lectura). */
export const QUEUE_PRIORITY_BY_CODE: Record<string, string> = {
  LOW: COMM.QUEUE_PRIORITY_LOW,
  NORMAL: COMM.QUEUE_PRIORITY_NORMAL,
  HIGH: COMM.QUEUE_PRIORITY_HIGH,
};

/**
 * Tipo de contenido moderable enum → concept id.
 *
 * Es el mismo mapa que la escritura de reportes derivaba del target; se declara
 * acá para que la lectura filtre por los mismos conceptos con los que se escribe
 * y no por una segunda tabla equivalente.
 */
export const CONTENT_TYPE_BY_CODE: Record<string, string> = {
  POST: COMM.CONTENT_TYPE_POST,
  COMMENT: COMM.CONTENT_TYPE_COMMENT,
  PROFILE: COMM.CONTENT_TYPE_PROFILE,
  MESSAGE: COMM.CONTENT_TYPE_MESSAGE,
  REVIEW: COMM.CONTENT_TYPE_REVIEW,
};

/** Review dimension enum → concept id (UC-19-11). */
export const REVIEW_DIMENSION_BY_CODE: Record<string, string> = {
  COMMUNICATION: COMM.REVIEW_DIMENSION_COMMUNICATION,
  PUNCTUALITY: COMM.REVIEW_DIMENSION_PUNCTUALITY,
  CLEANLINESS: COMM.REVIEW_DIMENSION_CLEANLINESS,
  OUTCOME: COMM.REVIEW_DIMENSION_OUTCOME,
};

/** Strike severity enum → { severity concept, points } (UC-19-09). */
export const STRIKE_SEVERITY_BY_CODE: Record<
  string,
  {
    /**
     * Valor de concept mantenido por la instancia.
     */
    concept: string; /**
     * Valor de points mantenido por la instancia.
     */
    points: number;
  }
> = {
  LOW: { concept: COMM.STRIKE_SEVERITY_LOW, points: 1 },
  MEDIUM: { concept: COMM.STRIKE_SEVERITY_MEDIUM, points: 3 },
  HIGH: { concept: COMM.STRIKE_SEVERITY_HIGH, points: 5 },
};
