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
    GROUP_JOIN_ACTIVE: {
      code: 'GROUP_JOIN_ACTIVE',
      display: 'Membership active',
    },
    GROUP_JOIN_PENDING: {
      code: 'GROUP_JOIN_PENDING',
      display: 'Membership pending',
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

/** Followable object type enum → concept id (UC-19-05). */
export const FOLLOWABLE_CONCEPT_BY_CODE: Record<string, string> = {
  PROFILE: COMM.FOLLOWABLE_PROFILE,
  TOPIC: COMM.FOLLOWABLE_TOPIC,
  HASHTAG: COMM.FOLLOWABLE_HASHTAG,
  GROUP: COMM.FOLLOWABLE_GROUP,
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
