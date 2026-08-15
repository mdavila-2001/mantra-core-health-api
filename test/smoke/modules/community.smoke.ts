import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Community (19). Encadena recursos con `ctx.vars`: crea perfiles
 * públicos (anchor del grafo social), publica un post, le adjunta una encuesta y
 * vota; comenta, reacciona, guarda, sigue; crea un grupo y se une; abre una
 * conversación, envía y marca leído; publica una review verificada; reporta el
 * post, resuelve la moderación con strike y apela; bloquea a un tercero; y ejecuta
 * el fan-out del feed.
 *
 * Cross-módulo por DTO: `reviewerPatientProfileId` usa `ctx.vars.patientProfileId`
 * si un módulo previo lo pobló (no tiene FK), y `reporterUserId`/`decidedByUserId`
 * derivan de `ctx.adminUserId` en el servidor.
 *
 * Ids expuestos: `vars.communityProfileA/B/C`, `vars.communityPostId`,
 * `vars.communityQueueId`, `vars.communityDecisionId`.
 */
export const COMMUNITY_SMOKE: SmokeCase[] = [
  // ---- Bootstrap: perfiles públicos (anchor social) -------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/public-profiles',
    name: 'happy: perfil A (autor)',
    method: 'post',
    path: () => '/community/public-profiles',
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.adminUserId,
      slug: `prof-a-${c.u}`,
      displayName: 'Perfil A',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityProfileA = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/public-profiles',
    name: 'happy: perfil B',
    method: 'post',
    path: () => '/community/public-profiles',
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.adminUserId,
      slug: `prof-b-${c.u}`,
      displayName: 'Perfil B',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityProfileB = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/public-profiles',
    name: 'happy: perfil C (bloqueado)',
    method: 'post',
    path: () => '/community/public-profiles',
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.adminUserId,
      slug: `prof-c-${c.u}`,
      displayName: 'Perfil C',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityProfileC = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/public-profiles',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/community/public-profiles',
    auth: false,
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.adminUserId,
      slug: 'x',
      displayName: 'x',
    }),
    expectedStatus: 401,
  },

  // ---- UC-19-01: publicar post ----------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/posts',
    name: 'happy: publicar post',
    method: 'post',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}/posts`,
    body: () => ({
      bodyText: 'Hola comunidad',
      hashtags: ['salud', 'bienestar'],
      mentions: [],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityPostId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/posts',
    name: 'límite: perfil inexistente',
    method: 'post',
    path: () => `/community/profiles/${UUID_ABSENT}/posts`,
    body: () => ({ bodyText: 'x' }),
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/posts',
    name: 'límite: validación (bodyText faltante)',
    method: 'post',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}/posts`,
    body: () => ({}),
    expectedStatus: 400,
  },

  // ---- Bootstrap encuesta + UC-19-12: votar ---------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/posts/{postId}/polls',
    name: 'happy: crear encuesta',
    method: 'post',
    path: (c) => `/community/posts/${c.vars.communityPostId}/polls`,
    body: () => ({
      question: '¿Preferencia?',
      options: ['A', 'B'],
      allowsMultiple: false,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityPollId = String(b.id);
      c.vars.communityPollOptionId = String((b.optionIds as string[])[0]);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/polls/{pollId}/votes',
    name: 'happy: votar',
    method: 'post',
    path: (c) => `/community/polls/${c.vars.communityPollId}/votes`,
    body: (c) => ({
      pollOptionId: c.vars.communityPollOptionId,
      voterProfileId: c.vars.communityProfileB,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/polls/{pollId}/votes',
    name: 'límite: encuesta inexistente',
    method: 'post',
    path: () => `/community/polls/${UUID_ABSENT}/votes`,
    body: (c) => ({
      pollOptionId: c.vars.communityPollOptionId,
      voterProfileId: c.vars.communityProfileB,
    }),
    expectedStatus: 404,
  },

  // ---- UC-19-02: comentar ----------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/comments',
    name: 'happy: comentar',
    method: 'post',
    path: () => '/community/comments',
    body: (c) => ({
      authorProfileId: c.vars.communityProfileB,
      commentableType: 'POST',
      commentableRefId: c.vars.communityPostId,
      bodyText: 'Buen post',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityCommentId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/comments',
    name: 'límite: autor inexistente',
    method: 'post',
    path: (c) => '/community/comments',
    body: (c) => ({
      authorProfileId: UUID_ABSENT,
      commentableType: 'POST',
      commentableRefId: c.vars.communityPostId,
      bodyText: 'x',
    }),
    expectedStatus: 404,
  },

  // ---- UC-19-03: reaccionar (PUT upsert) ------------------------------------
  {
    module: 'Community',
    endpoint: 'PUT /community/reactions',
    name: 'happy: reaccionar',
    method: 'put',
    path: () => '/community/reactions',
    body: (c) => ({
      actorProfileId: c.vars.communityProfileB,
      reactableType: 'POST',
      reactableRefId: c.vars.communityPostId,
      reactionType: 'LIKE',
    }),
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'PUT /community/reactions',
    name: 'happy: cambiar tipo (idempotente por actor/objeto)',
    method: 'put',
    path: () => '/community/reactions',
    body: (c) => ({
      actorProfileId: c.vars.communityProfileB,
      reactableType: 'POST',
      reactableRefId: c.vars.communityPostId,
      reactionType: 'LOVE',
    }),
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'PUT /community/reactions',
    name: 'límite: sin auth',
    method: 'put',
    path: () => '/community/reactions',
    auth: false,
    body: (c) => ({
      actorProfileId: c.vars.communityProfileB,
      reactableType: 'POST',
      reactableRefId: c.vars.communityPostId,
      reactionType: 'LIKE',
    }),
    expectedStatus: 401,
  },

  // ---- UC-19-04: bookmark ----------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/bookmarks',
    name: 'happy: guardar bookmark',
    method: 'post',
    path: () => '/community/bookmarks',
    body: (c) => ({
      profileId: c.vars.communityProfileB,
      bookmarkableType: 'POST',
      bookmarkableRefId: c.vars.communityPostId,
      collectionName: 'read-later',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/bookmarks',
    name: 'límite: duplicado (409)',
    method: 'post',
    path: () => '/community/bookmarks',
    body: (c) => ({
      profileId: c.vars.communityProfileB,
      bookmarkableType: 'POST',
      bookmarkableRefId: c.vars.communityPostId,
    }),
    expectedStatus: 409,
  },

  // ---- UC-19-05: seguir ------------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/follows',
    name: 'happy: seguir perfil',
    method: 'post',
    path: () => '/community/follows',
    body: (c) => ({
      followerProfileId: c.vars.communityProfileB,
      followableType: 'PROFILE',
      followableRefId: c.vars.communityProfileA,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/follows',
    name: 'límite: auto-follow (422)',
    method: 'post',
    path: () => '/community/follows',
    body: (c) => ({
      followerProfileId: c.vars.communityProfileB,
      followableType: 'PROFILE',
      followableRefId: c.vars.communityProfileB,
    }),
    expectedStatus: 422,
  },

  // ---- Bootstrap grupo + UC-19-13: unirse -----------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/groups',
    name: 'happy: crear grupo',
    method: 'post',
    path: () => '/community/groups',
    body: (c) => ({
      slug: `grp-${c.u}`,
      name: 'Grupo Salud',
      visibility: 'PUBLIC',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityGroupId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/groups/{groupId}/members',
    name: 'happy: unirse a grupo',
    method: 'post',
    path: (c) => `/community/groups/${c.vars.communityGroupId}/members`,
    body: (c) => ({ memberProfileId: c.vars.communityProfileB }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/groups/{groupId}/members',
    name: 'límite: grupo inexistente',
    method: 'post',
    path: () => `/community/groups/${UUID_ABSENT}/members`,
    body: (c) => ({ memberProfileId: c.vars.communityProfileB }),
    expectedStatus: 404,
  },

  // ---- Bootstrap conversación + UC-19-06/07 ---------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/conversations',
    name: 'happy: crear conversación',
    method: 'post',
    path: () => '/community/conversations',
    body: (c) => ({
      participantProfileIds: [
        c.vars.communityProfileA,
        c.vars.communityProfileB,
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityConversationId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/conversations/{conversationId}/messages',
    name: 'happy: enviar mensaje',
    method: 'post',
    path: (c) =>
      `/community/conversations/${c.vars.communityConversationId}/messages`,
    body: (c) => ({
      senderProfileId: c.vars.communityProfileA,
      bodyText: 'Hola',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityMessageId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/conversations/{conversationId}/messages',
    name: 'límite: conversación inexistente',
    method: 'post',
    path: (c) => `/community/conversations/${UUID_ABSENT}/messages`,
    body: (c) => ({ senderProfileId: c.vars.communityProfileA, bodyText: 'x' }),
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/conversations/{conversationId}/read',
    name: 'happy: marcar leído',
    method: 'post',
    path: (c) =>
      `/community/conversations/${c.vars.communityConversationId}/read`,
    body: (c) => ({ recipientProfileId: c.vars.communityProfileB }),
    expectedStatus: 200,
  },

  // ---- UC-19-11: review verificada ------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/reviews',
    name: 'happy: publicar review',
    method: 'post',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}/reviews`,
    body: (c) => ({
      reviewerPatientProfileId:
        c.vars.patientProfileId ?? c.vars.communityProfileB,
      overallRating: 5,
      reviewText: 'Excelente atención',
      dimensions: [{ dimension: 'COMMUNICATION', score: 5 }],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/reviews',
    name: 'límite: perfil inexistente',
    method: 'post',
    path: (c) => `/community/profiles/${UUID_ABSENT}/reviews`,
    body: (c) => ({
      reviewerPatientProfileId: c.vars.communityProfileB,
      overallRating: 4,
    }),
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/profiles/{profileId}/reviews',
    name: 'límite: rating fuera de rango (400)',
    method: 'post',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}/reviews`,
    body: (c) => ({
      reviewerPatientProfileId: c.vars.communityProfileB,
      overallRating: 9,
    }),
    expectedStatus: 400,
  },

  // ---- UC-19-08: reportar ----------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/reports',
    name: 'happy: reportar post',
    method: 'post',
    path: () => '/community/reports',
    body: (c) => ({
      targetType: 'POST',
      targetId: c.vars.communityPostId,
      reason: 'SPAM',
      detailText: 'Contenido sospechoso',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityReportId = String(b.id);
      c.vars.communityQueueId = String(b.moderationQueueId);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/reports',
    name: 'límite: motivo inválido (400)',
    method: 'post',
    path: (c) => '/community/reports',
    body: (c) => ({
      targetType: 'POST',
      targetId: c.vars.communityPostId,
      reason: 'NOPE',
    }),
    expectedStatus: 400,
  },

  // ---- UC-19-09: decisión de moderación -------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/queue/{queueId}/decision',
    name: 'happy: resolver con strike',
    method: 'post',
    path: (c) =>
      `/community/moderation/queue/${c.vars.communityQueueId}/decision`,
    body: (c) => ({
      decision: 'REMOVED',
      rationaleText: 'Viola normas',
      subjectProfileId: c.vars.communityProfileA,
      strikeSeverity: 'MEDIUM',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.communityDecisionId = String(b.id);
    },
  },
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/queue/{queueId}/decision',
    name: 'límite: cola inexistente',
    method: 'post',
    path: () => `/community/moderation/queue/${UUID_ABSENT}/decision`,
    body: () => ({ decision: 'WARNED' }),
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/queue/{queueId}/decision',
    name: 'límite: sin rol (403)',
    method: 'post',
    path: (c) =>
      `/community/moderation/queue/${c.vars.communityQueueId}/decision`,
    auth: false,
    body: () => ({ decision: 'WARNED' }),
    expectedStatus: 401,
  },

  // ---- UC-19-10: apelar ------------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/decisions/{decisionId}/appeal',
    name: 'happy: apelar',
    method: 'post',
    path: (c) =>
      `/community/moderation/decisions/${c.vars.communityDecisionId}/appeal`,
    body: (c) => ({
      appellantProfileId: c.vars.communityProfileA,
      reasonText: 'Fue un error',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/decisions/{decisionId}/appeal',
    name: 'límite: decisión inexistente',
    method: 'post',
    path: (c) => `/community/moderation/decisions/${UUID_ABSENT}/appeal`,
    body: (c) => ({
      appellantProfileId: c.vars.communityProfileA,
      reasonText: 'x',
    }),
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/moderation/decisions/{decisionId}/appeal',
    name: 'límite: apelación duplicada (409)',
    method: 'post',
    path: (c) =>
      `/community/moderation/decisions/${c.vars.communityDecisionId}/appeal`,
    body: (c) => ({
      appellantProfileId: c.vars.communityProfileA,
      reasonText: 'otra vez',
    }),
    expectedStatus: 409,
  },

  // ---- UC-19-14: bloquear ----------------------------------------------------
  {
    module: 'Community',
    endpoint: 'POST /community/blocks',
    name: 'happy: bloquear',
    method: 'post',
    path: () => '/community/blocks',
    body: (c) => ({
      blockerProfileId: c.vars.communityProfileA,
      blockedProfileId: c.vars.communityProfileC,
      reason: 'SPAM',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /community/blocks',
    name: 'límite: auto-bloqueo (422)',
    method: 'post',
    path: () => '/community/blocks',
    body: (c) => ({
      blockerProfileId: c.vars.communityProfileA,
      blockedProfileId: c.vars.communityProfileA,
    }),
    expectedStatus: 422,
  },

  // ---- UC-19-15: fan-out del feed (worker interno) --------------------------
  {
    module: 'Community',
    endpoint: 'POST /internal/community/feed/rebuild',
    name: 'happy: fan-out del feed',
    method: 'post',
    path: () => '/internal/community/feed/rebuild',
    body: (c) => ({
      sourceRefId: c.vars.communityPostId,
      followerProfileIds: [c.vars.communityProfileB],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Community',
    endpoint: 'POST /internal/community/feed/rebuild',
    name: 'límite: sin auth',
    method: 'post',
    path: (c) => '/internal/community/feed/rebuild',
    auth: false,
    body: (c) => ({
      sourceRefId: c.vars.communityPostId,
      followerProfileIds: [c.vars.communityProfileB],
    }),
    expectedStatus: 401,
  },
  {
    module: 'Community',
    endpoint: 'GET /internal/community/feed/pending',
    name: 'happy: lote pendiente de fan-out',
    method: 'get',
    path: () => '/internal/community/feed/pending',
    expectedStatus: 200,
    capture: (b) => {
      if (!Array.isArray(b.items))
        throw new Error('el lote pendiente no trae items');
    },
  },

  // ---- Lecturas del grafo social (F1.1) ------------------------------------
  {
    module: 'Community',
    endpoint: 'GET /community/profiles/{profileId}',
    name: 'happy: ficha del perfil con sellos y prestigio',
    method: 'get',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}`,
    expectedStatus: 200,
    capture: (b) => {
      if (!Array.isArray(b.badges))
        throw new Error('la ficha no trae los sellos embebidos');
      if (!('prestige' in b))
        throw new Error('la ficha no trae el prestigio embebido');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/profiles/{profileId}',
    name: 'límite: perfil inexistente',
    method: 'get',
    path: () => `/community/profiles/${UUID_ABSENT}`,
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/profiles/{profileId}/posts',
    name: 'happy: muro del perfil autor',
    method: 'get',
    path: (c) =>
      `/community/profiles/${c.vars.communityProfileA}/posts?actorProfileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = b.items as Array<{ id: string }>;
      if (!items.some((post) => post.id === c.vars.communityPostId))
        throw new Error('el muro no trae el post publicado en este recorrido');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/profiles/{profileId}/posts',
    name: 'límite: cursor corrupto',
    method: 'get',
    path: (c) =>
      `/community/profiles/${c.vars.communityProfileA}/posts?cursor=no-es-un-cursor`,
    expectedStatus: 400,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/posts/{postId}',
    name: 'happy: detalle del post con media, hashtags y menciones',
    method: 'get',
    path: (c) => `/community/posts/${c.vars.communityPostId}`,
    expectedStatus: 200,
    capture: (b) => {
      for (const key of ['media', 'hashtags', 'mentions'])
        if (!Array.isArray(b[key]))
          throw new Error(`el detalle del post no trae ${key}`);
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/posts/{postId}',
    name: 'límite: post inexistente',
    method: 'get',
    path: () => `/community/posts/${UUID_ABSENT}`,
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/posts/{postId}',
    name: 'límite: sin auth',
    method: 'get',
    path: (c) => `/community/posts/${c.vars.communityPostId}`,
    auth: false,
    expectedStatus: 401,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/posts/{postId}/comments',
    name: 'happy: hilo de comentarios',
    method: 'get',
    path: (c) => `/community/posts/${c.vars.communityPostId}/comments`,
    expectedStatus: 200,
    capture: (b) => {
      if (!Array.isArray(b.items))
        throw new Error('el hilo no trae comentarios');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/posts/{postId}/reactions',
    name: 'happy: resumen de reacciones con la del actor',
    method: 'get',
    path: (c) =>
      `/community/posts/${c.vars.communityPostId}/reactions?actorProfileId=${c.vars.communityProfileB}`,
    expectedStatus: 200,
    capture: (b) => {
      if (typeof b.total !== 'number')
        throw new Error('el resumen de reacciones no trae total');
      if (!('actorReactionTypeConceptId' in b))
        throw new Error('se pidió con actor y no informa la reacción propia');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/follows',
    name: 'happy: seguimientos del perfil B',
    method: 'get',
    path: (c) =>
      `/community/follows?followerProfileId=${c.vars.communityProfileB}`,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/bookmarks',
    name: 'happy: marcadores del propio perfil',
    method: 'get',
    path: (c) => `/community/bookmarks?profileId=${c.vars.communityProfileB}`,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/blocks',
    name: 'happy: bloqueos emitidos por el perfil A',
    method: 'get',
    path: (c) => `/community/blocks?profileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
  },

  // ---- Lecturas de reviews, grupos, encuestas, feed y notificaciones -------
  {
    module: 'Community',
    endpoint: 'GET /community/profiles/{profileId}/reviews',
    name: 'happy: reviews publicadas — sin datos del encuentro clínico',
    method: 'get',
    path: (c) => `/community/profiles/${c.vars.communityProfileA}/reviews`,
    expectedStatus: 200,
    capture: (b) => {
      // La regla más cara del módulo: publicar el encuentro o el perfil del
      // paciente convertiría la ficha del profesional en una lista de quién se
      // atendió con él.
      const serializado = JSON.stringify(b);
      for (const prohibido of [
        'verifiedEncounterId',
        'reviewerPatientProfileId',
      ])
        if (serializado.includes(prohibido))
          throw new Error(`la review expone ${prohibido}`);
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/groups',
    name: 'happy: grupos de la organización',
    method: 'get',
    path: (c) => `/community/groups?tenantId=${c.tenantId}`,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/groups',
    name: 'límite: sin tenantId',
    method: 'get',
    path: () => '/community/groups',
    expectedStatus: 400,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/groups/{groupId}/members',
    name: 'happy: integrantes del grupo',
    method: 'get',
    path: (c) => `/community/groups/${c.vars.communityGroupId}/members`,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/polls/{pollId}',
    name: 'happy: encuesta con recuentos y voto propio',
    method: 'get',
    path: (c) =>
      `/community/polls/${c.vars.communityPollId}?actorProfileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
    capture: (b) => {
      if (!Array.isArray(b.options))
        throw new Error('la encuesta no trae opciones');
      if (!Array.isArray(b.actorVotedOptionIds))
        throw new Error('se pidió con actor y no informa el voto propio');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/conversations',
    name: 'happy: bandeja del propio perfil',
    method: 'get',
    path: (c) =>
      `/community/conversations?profileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
    capture: (b) => {
      const items = b.items as Array<{ unreadCount: number }>;
      if (items.length > 0 && typeof items[0].unreadCount !== 'number')
        throw new Error('la bandeja no trae el conteo de no leídos');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/conversations/{id}/messages',
    name: 'happy: mensajes de la conversación',
    method: 'get',
    path: (c) =>
      `/community/conversations/${c.vars.communityConversationId}/messages?profileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /community/feed',
    name: 'happy: el timeline trae el post repartido por el fan-out',
    method: 'get',
    path: (c) => `/community/feed?profileId=${c.vars.communityProfileB}`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = b.items as Array<{ sourceRefId: string }>;
      if (!items.some((item) => item.sourceRefId === c.vars.communityPostId))
        throw new Error(
          'el feed del seguidor no trae el post que el fan-out repartió',
        );
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /community/notifications',
    name: 'happy: bandeja de notificaciones con no leídos',
    method: 'get',
    path: (c) =>
      `/community/notifications?profileId=${c.vars.communityProfileA}`,
    expectedStatus: 200,
    capture: (b) => {
      if (typeof b.unreadCount !== 'number')
        throw new Error('la bandeja no trae unreadCount');
    },
  },
  // ---- Superficie pública (P2): sin token, sin tenant --------------------
  //
  // `auth: false` no es decorativo: si alguna de estas rutas perdiera su
  // `@Public()`, el guard global respondería 401 y el caso fallaría acá en vez
  // de en producción.
  {
    module: 'Community',
    endpoint: 'GET /public/search',
    name: 'happy: el buscador público responde sin sesión',
    method: 'get',
    path: () => '/public/search?limit=5',
    auth: false,
    expectedStatus: 200,
    // Esta comprobación es la que protege el ORDEN DE REGISTRO de los
    // controladores. `read_models` sirve `@Get(':slug')` bajo el mismo prefijo
    // `public`, y una ruta con parámetro captura cualquier segmento: si
    // `ReadModelsModule` quedara antes que `CommunityModule` en la lista de
    // imports de `app.module.ts` —al ordenarla alfabéticamente, por ejemplo—,
    // `/public/search` devolvería la proyección de un slug llamado «search»
    // con un 200, y nadie lo notaría. La envoltura del contrato no coincide,
    // así que el caso falla.
    capture: (b) => {
      if (!Array.isArray(b.items))
        throw new Error(
          '/public/search no devolvió la envoltura del contrato: ' +
            'probable captura por la ruta /public/:slug de read_models ' +
            '(revisar el orden de CommunityModule y ReadModelsModule)',
        );
      if (!('nextCursor' in b) || !('generatedAt' in b))
        throw new Error('la envoltura pública no trae nextCursor/generatedAt');
    },
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/practitioners',
    name: 'happy: vertical de profesionales sin sesión',
    method: 'get',
    path: () => '/public/search/practitioners?q=cardio&limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/organizations',
    name: 'happy: vertical de organizaciones sin sesión',
    method: 'get',
    path: () => '/public/search/organizations?limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/diagnostic-units',
    name: 'happy: vertical de laboratorios sin sesión',
    method: 'get',
    path: () => '/public/search/diagnostic-units?limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/insurers',
    name: 'happy: vertical de aseguradoras sin sesión',
    method: 'get',
    path: () => '/public/search/insurers?limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/pharmacies',
    name: 'happy: vertical de farmacias sin sesión',
    method: 'get',
    path: () => '/public/search/pharmacies?limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/search/medications',
    name: 'happy: vertical de medicamentos sin sesión',
    method: 'get',
    path: () => '/public/search/medications?limit=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/nearby',
    name: 'happy: cercanía con coordenadas de Santa Cruz',
    method: 'get',
    path: () => '/public/nearby?lat=-17.7833&lng=-63.1821&radiusKm=5',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'Community',
    endpoint: 'GET /public/nearby',
    name: 'límite: sin coordenadas responde 400, no una página vacía',
    method: 'get',
    path: () => '/public/nearby',
    auth: false,
    expectedStatus: 400,
  },
  {
    module: 'Community',
    endpoint: 'GET /p/:slug',
    name: 'límite: un slug inexistente responde 404 sin revelar nada',
    method: 'get',
    path: (c) => `/p/no-existe-${c.u}`,
    auth: false,
    expectedStatus: 404,
  },
  {
    module: 'Community',
    endpoint: 'GET /p/:slug',
    name: 'límite: un perfil no publicado responde el mismo 404',
    method: 'get',
    // El perfil A existe y está activo, pero nace sin
    // `visibility_concept_id`, y el nulo no es público: aparecer en el
    // directorio es opt-in. Tiene que dar el MISMO 404 que uno inexistente.
    path: (c) => `/p/prof-a-${c.u}`,
    auth: false,
    expectedStatus: 404,
  },
];
