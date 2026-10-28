<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `community`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 103 (91 con decisiones propias, 12 sin ellas)
- Inventario de endpoints del módulo: [community](../endpoints/community.md)

## Proceso: Módulo Community (19)

- **Código:** `community` · **Agrupación:** MIXTO · **Operaciones:** 103
- **Actores:** Cualquier sesión válida · PATIENT · Público (sin sesión) · SEARCH_ADMIN · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/community/README.md`

### Para qué sirve

Perfiles públicos, grafo social, mensajería directa, moderación (confianza y seguridad), reviews verificadas, encuestas, grupos y fan-out de feed. Implementa los 15 casos de uso `UC-19-01..15` más endpoints de bootstrap para los recursos padre que ningún UC crea (perfil público, conversación, encuesta, grupo).

_Fuente: `src/modules/community/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-19-01` | Publica post con hashtags, media y menciones | POST /community/profiles/{profileId}/posts | Cualquier sesión válida | ALTO | 10 |
| `UC-19-02` | Comenta (hilo anidado) con contadores | POST /community/comments | Cualquier sesión válida | ALTO | 8 |
| `UC-19-03` | Reacciona (upsert una reacción por actor/objeto) | PUT /community/reactions | Cualquier sesión válida | ALTO | 4 |
| `UC-19-04` | Guarda bookmark en colección | POST /community/bookmarks | Cualquier sesión válida | ALTO | 3 |
| `UC-19-05` | Sigue objeto social (perfil/tópico/hashtag/grupo) | POST /community/follows | Cualquier sesión válida | ALTO | 4 |
| `UC-19-06` | Envía mensaje directo | POST /community/conversations/{conversationId}/messages | Cualquier sesión válida | ALTO | 23 |
| `UC-19-07` | Marca mensajes como leídos (recibos) | POST /community/conversations/{conversationId}/read | Cualquier sesión válida | ALTO | 6 |
| `UC-19-08` | Reporta contenido y encola moderación | POST /community/reports | Cualquier sesión válida | ALTO | 3 |
| `UC-19-09` | Resuelve moderación (decisión + strike) | POST /community/moderation/queue/{queueId}/decision | SECURITY_ADMIN | MEDIO | 6 |
| `UC-19-10` | Apela una decisión | POST /community/moderation/decisions/{decisionId}/appeal | Cualquier sesión válida | ALTO | 7 |
| `UC-19-11` | Publica review verificada de servicio | POST /community/profiles/{profileId}/reviews | Cualquier sesión válida | ALTO | 6 |
| `UC-19-12` | Vota en encuesta | POST /community/polls/{pollId}/votes | Cualquier sesión válida | ALTO | 10 |
| `UC-19-13` | Se une a grupo/comunidad | POST /community/groups/{groupId}/members | Cualquier sesión válida | ALTO | 9 |
| `UC-19-14` | Bloquea a un usuario | POST /community/blocks | Cualquier sesión válida | ALTO | 6 |
| `UC-19-15` | Lote de posts publicados sin repartir, con sus seguidores | GET /internal/community/feed/pending | SYSTEM · SECURITY_ADMIN | BAJO | 3 |
|  |  | POST /internal/community/feed/rebuild | SYSTEM · SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:CommunityFeedController` | Operaciones de CommunityFeedController que el README no asigna a un caso de uso | POST /internal/community/feed/ranking/apply | SYSTEM · SECURITY_ADMIN | MEDIO | 1 |
|  |  | GET /internal/community/feed/ranking/pending | SYSTEM · SECURITY_ADMIN | BAJO | 4 |
| `ctrl:CommunityGroupsController` | Operaciones de CommunityGroupsController que el README no asigna a un caso de uso | GET /community/groups | Cualquier sesión válida | BAJO | 5 |
|  |  | POST /community/groups | Cualquier sesión válida | ALTO | 9 |
|  |  | GET /community/groups/{groupId} | Cualquier sesión válida | BAJO | 6 |
|  |  | GET /community/groups/{groupId}/members | Cualquier sesión válida | BAJO | 6 |
|  |  | DELETE /community/groups/{groupId}/members/{member} | Cualquier sesión válida | ALTO | 8 |
|  |  | PATCH /community/groups/{groupId}/members/{member} | Cualquier sesión válida | ALTO | 12 |
|  |  | GET /community/groups/{groupId}/posts | Cualquier sesión válida | BAJO | 7 |
|  |  | POST /community/groups/{groupId}/posts | Cualquier sesión válida | ALTO | 15 |
| `ctrl:CommunityMessagingController` | Operaciones de CommunityMessagingController que el README no asigna a un caso de uso | GET /community/conversations | Cualquier sesión válida | BAJO | 4 |
|  |  | POST /community/conversations | Cualquier sesión válida | ALTO | 6 |
|  |  | GET /community/conversations/{conversationId}/attachments/{fileId}/content | Cualquier sesión válida | BAJO | 6 |
|  |  | GET /community/conversations/{conversationId}/messages | Cualquier sesión válida | BAJO | 5 |
|  |  | DELETE /community/conversations/{conversationId}/messages/{messageId} | Cualquier sesión válida | ALTO | 6 |
|  |  | PATCH /community/conversations/{conversationId}/messages/{messageId} | Cualquier sesión válida | ALTO | 4 |
|  |  | PATCH /community/conversations/{conversationId}/participant | Cualquier sesión válida | BAJO | 2 |
|  |  | DELETE /community/conversations/{conversationId}/pin | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /community/conversations/{conversationId}/pin | Cualquier sesión válida | ALTO | 5 |
|  |  | GET /community/conversations/{conversationId}/presence | Cualquier sesión válida | BAJO | 2 |
|  |  | POST /community/conversations/contacts/search | Cualquier sesión válida | BAJO | 2 |
| `ctrl:CommunityModerationController` | Operaciones de CommunityModerationController que el README no asigna a un caso de uso | GET /community/moderation/appeals | SECURITY_ADMIN | BAJO | 2 |
|  |  | POST /community/moderation/appeals/{appealId}/resolve | SECURITY_ADMIN | MEDIO | 5 |
|  |  | GET /community/moderation/decisions | SECURITY_ADMIN | BAJO | 1 |
|  |  | GET /community/moderation/decisions/mine | Cualquier sesión válida | BAJO | 4 |
|  |  | GET /community/moderation/queue | SECURITY_ADMIN | BAJO | 2 |
| `ctrl:CommunityPollsController` | Operaciones de CommunityPollsController que el README no asigna a un caso de uso | GET /community/polls/{pollId} | Cualquier sesión válida | BAJO | 7 |
|  |  | POST /community/posts/{postId}/polls | Cualquier sesión válida | ALTO | 4 |
| `ctrl:CommunityPublicController` | Operaciones de CommunityPublicController que el README no asigna a un caso de uso | DESCONOCIDO / | Cualquier sesión válida | BAJO | 0 |
|  |  | DESCONOCIDO / | Cualquier sesión válida | BAJO | 0 |
|  |  | DESCONOCIDO / | Cualquier sesión válida | BAJO | 0 |
|  |  | DESCONOCIDO / | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /f/{slug} | Público (sin sesión) | BAJO | 18 |
|  |  | GET /l/{slug} | Público (sin sesión) | BAJO | 18 |
|  |  | GET /o/{slug} | Público (sin sesión) | BAJO | 18 |
|  |  | GET /p/{slug} | Público (sin sesión) | BAJO | 18 |
|  |  | GET /public/comments/{commentId}/replies | Público (sin sesión) | BAJO | 4 |
|  |  | GET /public/media/{id} | Público (sin sesión) | BAJO | 7 |
|  |  | GET /public/nearby | Público (sin sesión) | BAJO | 7 |
|  |  | GET /public/posts | Público (sin sesión) | BAJO | 5 |
|  |  | GET /public/posts/{postId}/comments | Público (sin sesión) | BAJO | 4 |
|  |  | GET /public/posts/{postId}/reactions | Público (sin sesión) | BAJO | 3 |
|  |  | GET /public/profiles/{prefijo}/{slug} | Público (sin sesión) | BAJO | 18 |
|  |  | GET /public/profiles/{prefijo}/{slug}/reviews | Público (sin sesión) | BAJO | 5 |
|  |  | GET /public/search | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/diagnostic-units | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/insurers | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/medications | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/organizations | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/pharmacies | Público (sin sesión) | BAJO | 12 |
|  |  | GET /public/search/practitioners | Público (sin sesión) | BAJO | 12 |
|  |  | GET /s/{slug} | Público (sin sesión) | BAJO | 18 |
| `ctrl:CommunityReviewsController` | Operaciones de CommunityReviewsController que el README no asigna a un caso de uso | GET /community/profiles/{profileId}/reviews | Cualquier sesión válida | BAJO | 5 |
|  |  | POST /community/profiles/{profileId}/reviews/{reviewId}/responses | Cualquier sesión válida | ALTO | 4 |
| `ctrl:CommunitySearchIndexController` | Operaciones de CommunitySearchIndexController que el README no asigna a un caso de uso | GET /internal/community/search/health | SYSTEM · SECURITY_ADMIN · SEARCH_ADMIN | BAJO | 1 |
|  |  | POST /internal/community/search/reindex | SYSTEM · SECURITY_ADMIN · SEARCH_ADMIN | BAJO | 9 |
| `ctrl:CommunitySocialController` | Operaciones de CommunitySocialController que el README no asigna a un caso de uso | DELETE /community/blocks | Cualquier sesión válida | ALTO | 3 |
|  |  | GET /community/blocks | Cualquier sesión válida | BAJO | 2 |
|  |  | DELETE /community/bookmarks | Cualquier sesión válida | ALTO | 3 |
|  |  | GET /community/bookmarks | Cualquier sesión válida | BAJO | 2 |
|  |  | GET /community/comments/media/{fileId}/content | Cualquier sesión válida | BAJO | 8 |
|  |  | DELETE /community/follows | Cualquier sesión válida | ALTO | 3 |
|  |  | GET /community/follows | Cualquier sesión válida | BAJO | 2 |
|  |  | GET /community/posts/{postId} | Cualquier sesión válida | BAJO | 10 |
|  |  | GET /community/posts/{postId}/comments | Cualquier sesión válida | BAJO | 6 |
|  |  | GET /community/posts/{postId}/reactions | Cualquier sesión válida | BAJO | 5 |
|  |  | GET /community/profiles/{profileId} | Cualquier sesión válida | BAJO | 4 |
|  |  | GET /community/profiles/{profileId}/auto-reply | Cualquier sesión válida | BAJO | 2 |
|  |  | PUT /community/profiles/{profileId}/auto-reply | Cualquier sesión válida | BAJO | 2 |
|  |  | GET /community/profiles/{profileId}/posts | Cualquier sesión válida | BAJO | 6 |
|  |  | GET /community/profiles/by-slug/{slug} | Cualquier sesión válida | BAJO | 4 |
|  |  | GET /community/profiles/me | Cualquier sesión válida | BAJO | 1 |
|  |  | PUT /community/profiles/me | Cualquier sesión válida | ALTO | 4 |
|  |  | GET /community/profiles/me/stats | Cualquier sesión válida | BAJO | 1 |
|  |  | POST /community/public-profiles | SECURITY_ADMIN | MEDIO | 1 |
| `ctrl:CommunityTimelineController` | Operaciones de CommunityTimelineController que el README no asigna a un caso de uso | GET /community/feed | Cualquier sesión válida | BAJO | 7 |
|  |  | GET /community/notifications | Cualquier sesión válida | BAJO | 2 |
| `ctrl:CommunityTopicsController` | Operaciones de CommunityTopicsController que el README no asigna a un caso de uso | GET /community/topics | Cualquier sesión válida | BAJO | 1 |
| `ctrl:CommunityVerificationController` | Operaciones de CommunityVerificationController que el README no asigna a un caso de uso | POST /internal/community/verification/badges | SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /internal/community/verification/badges/{targetId}/revoke | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /internal/community/verification/badges/expire-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 5 |
| `ctrl:PartyRatingsController` | Operaciones de PartyRatingsController que el README no asigna a un caso de uso | GET /community/ratings | Cualquier sesión válida | BAJO | 2 |
|  |  | PUT /community/ratings | Cualquier sesión válida | ALTO | 9 |
|  |  | GET /community/ratings/mine | Cualquier sesión válida | BAJO | 2 |
|  |  | GET /community/ratings/summary | Cualquier sesión válida | BAJO | 2 |
| `ctrl:PatientReviewsController` | Operaciones de PatientReviewsController que el README no asigna a un caso de uso | GET /patients/me/reviewable-care | PATIENT | BAJO | 4 |
|  |  | POST /patients/me/reviews | PATIENT | MEDIO | 6 |

### Diagrama 1 de 5 — etapas `UC-19-01`, `UC-19-02`, `UC-19-03`…

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a31(["SECURITY_ADMIN"]):::actor
  a54(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("common.file_versions")]:::tabla
  t4[("common.files")]:::tabla
  t5[("community.content_hashtags")]:::tabla
  t6[("community.hashtags")]:::tabla
  t9[("community.comment_media")]:::tabla
  t10[("community.comments")]:::tabla
  t13[("community.public_profiles")]:::tabla
  t14[("community.reactions")]:::tabla
  t16[("community.bookmarks")]:::tabla
  t18[("community.social_follows")]:::tabla
  t20[("community.chat_auto_replies")]:::tabla
  t21[("community.conversation_participants")]:::tabla
  t22[("community.conversations")]:::tabla
  t25[("community.direct_messages")]:::tabla
  t26[("community.message_receipts")]:::tabla
  t28[("community.content_reports")]:::tabla
  t29[("community.moderation_queue")]:::tabla
  t32[("community.moderation_decisions")]:::tabla
  t33[("community.moderation_strikes")]:::tabla
  t35[("community.moderation_appeals")]:::tabla
  t38[("clinical.encounter_participants")]:::tabla
  t39[("clinical.encounters")]:::tabla
  t40[("community.review_dimension_scores")]:::tabla
  t41[("community.service_reviews")]:::tabla
  t43[("community.poll_options")]:::tabla
  t44[("community.poll_votes")]:::tabla
  t45[("community.polls")]:::tabla
  t48[("community.group_members")]:::tabla
  t49[("community.groups")]:::tabla
  t52[("community.user_blocks")]:::tabla
  t55[("community.feed_items")]:::tabla
  t56[("community.social_posts")]:::tabla
  t7[("+4 tablas más")]
  subgraph s0["UC-19-01 · Publica post con hashtags, media y menciones"]
    o1["POST /community/profiles/{profileId}/posts"]:::op
  end
  t11[("+2 tablas más")]
  subgraph s1["UC-19-02 · Comenta (hilo anidado) con contadores"]
    o8["POST /community/comments"]:::op
  end
  subgraph s2["UC-19-03 · Reacciona (upsert una reacción por actor/objeto)"]
    o12["PUT /community/reactions"]:::op
  end
  subgraph s3["UC-19-04 · Guarda bookmark en colección"]
    o15["POST /community/bookmarks"]:::op
  end
  subgraph s4["UC-19-05 · Sigue objeto social (perfil/tópico/hashtag/grupo)"]
    o17["POST /community/follows"]:::op
  end
  t23[("+17 tablas más")]
  subgraph s5["UC-19-06 · Envía mensaje directo"]
    o19["POST /community/conversations/{conversationId}/messages"]:::op
  end
  subgraph s6["UC-19-07 · Marca mensajes como leídos (recibos)"]
    o24["POST /community/conversations/{conversationId}/read"]:::op
  end
  subgraph s7["UC-19-08 · Reporta contenido y encola moderación"]
    o27["POST /community/reports"]:::op
  end
  subgraph s8["UC-19-09 · Resuelve moderación (decisión + strike)"]
    o30["POST /community/moderation/queue/{queueId}/decision"]:::op
  end
  t36[("+1 tablas más")]
  subgraph s9["UC-19-10 · Apela una decisión"]
    o34["POST /community/moderation/decisions/{decisionId}/appeal"]:::op
  end
  subgraph s10["UC-19-11 · Publica review verificada de servicio"]
    o37["POST /community/profiles/{profileId}/reviews"]:::op
  end
  t46[("+4 tablas más")]
  subgraph s11["UC-19-12 · Vota en encuesta"]
    o42["POST /community/polls/{pollId}/votes"]:::op
  end
  t50[("+3 tablas más")]
  subgraph s12["UC-19-13 · Se une a grupo/comunidad"]
    o47["POST /community/groups/{groupId}/members"]:::op
  end
  subgraph s13["UC-19-14 · Bloquea a un usuario"]
    o51["POST /community/blocks"]:::op
  end
  subgraph s14["UC-19-15 · Lote de posts publicados sin repartir, con sus seguidores"]
    o53["GET /internal/community/feed/pending"]:::op
    o57["POST /internal/community/feed/rebuild"]:::op
  end
  subgraph s15["ctrl:CommunityFeedController · Operaciones de CommunityFeedController que el RE…"]
    o58["POST /internal/community/feed/ranking/apply"]:::op
    o59["GET /internal/community/feed/ranking/pending"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"CREA"| t5
  o1 -->|"ACTUALIZA"| t6
  o1 -->|"CREA"| t6
  o1 -->|"LEE"| t6
  o1 -.-> t7
  a2 --> o8
  o8 -->|"LEE"| t3
  o8 -->|"LEE"| t4
  o8 -->|"CREA"| t9
  o8 -->|"ACTUALIZA"| t10
  o8 -->|"CREA"| t10
  o8 -->|"LEE"| t10
  o8 -.-> t11
  a2 --> o12
  o12 -->|"LEE"| t13
  o12 -->|"ACTUALIZA"| t14
  o12 -->|"CREA"| t14
  o12 -->|"LEE"| t14
  a2 --> o15
  o15 -->|"CREA"| t16
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t13
  a2 --> o17
  o17 -->|"LEE"| t13
  o17 -->|"ACTUALIZA"| t18
  o17 -->|"CREA"| t18
  o17 -->|"LEE"| t18
  a2 --> o19
  o19 -->|"LEE"| t3
  o19 -->|"LEE"| t4
  o19 -->|"LEE"| t20
  o19 -->|"ACTUALIZA"| t21
  o19 -->|"LEE"| t21
  o19 -->|"ACTUALIZA"| t22
  o19 -.-> t23
  a2 --> o24
  o24 -->|"ACTUALIZA"| t21
  o24 -->|"LEE"| t21
  o24 -->|"LEE"| t22
  o24 -->|"LEE"| t25
  o24 -->|"CREA"| t26
  o24 -->|"LEE"| t13
  a2 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"CREA"| t29
  o27 -->|"LEE"| t29
  a31 --> o30
  o30 -->|"ACTUALIZA"| t28
  o30 -->|"LEE"| t28
  o30 -->|"CREA"| t32
  o30 -->|"ACTUALIZA"| t29
  o30 -->|"LEE"| t29
  o30 -->|"CREA"| t33
  a2 --> o34
  o34 -->|"CREA"| t35
  o34 -->|"LEE"| t35
  o34 -->|"LEE"| t32
  o34 -->|"CREA"| t29
  o34 -->|"LEE"| t29
  o34 -->|"LEE"| t33
  o34 -.-> t36
  a2 --> o37
  o37 -->|"LEE"| t38
  o37 -->|"LEE"| t39
  o37 -->|"LEE"| t13
  o37 -->|"CREA"| t40
  o37 -->|"CREA"| t41
  o37 -->|"LEE"| t41
  a2 --> o42
  o42 -->|"ACTUALIZA"| t43
  o42 -->|"LEE"| t43
  o42 -->|"CREA"| t44
  o42 -->|"LEE"| t44
  o42 -->|"ACTUALIZA"| t45
  o42 -->|"LEE"| t45
  o42 -.-> t46
  a2 --> o47
  o47 -->|"LEE"| t39
  o47 -->|"ACTUALIZA"| t48
  o47 -->|"CREA"| t48
  o47 -->|"LEE"| t48
  o47 -->|"ACTUALIZA"| t49
  o47 -->|"LEE"| t49
  o47 -.-> t50
  a2 --> o51
  o51 -->|"LEE"| t13
  o51 -->|"ACTUALIZA"| t18
  o51 -->|"LEE"| t18
  o51 -->|"ACTUALIZA"| t52
  o51 -->|"CREA"| t52
  o51 -->|"LEE"| t52
  a54 --> o53
  o53 -->|"LEE"| t55
  o53 -->|"LEE"| t18
  o53 -->|"LEE"| t56
  a54 --> o57
  o57 -->|"CREA"| t55
  o57 -->|"LEE"| t55
  a54 --> o58
  o58 -->|"ACTUALIZA"| t55
  a54 --> o59
  o59 -->|"LEE"| t10
  o59 -->|"LEE"| t55
  o59 -->|"LEE"| t14
  o59 -->|"LEE"| t56
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 5 — etapas `ctrl:CommunityGroupsController`, `ctrl:CommunityMessagingController`, `ctrl:CommunityModerationController`…

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a41(["SECURITY_ADMIN"]):::actor
  t3[("clinical.encounters")]:::tabla
  t4[("community.groups")]:::tabla
  t5[("community.public_profiles")]:::tabla
  t6[("community.verified_badges")]:::tabla
  t7[("directory.tenant_memberships")]:::tabla
  t9[("community.group_members")]:::tabla
  t10[("community.topics")]:::tabla
  t19[("community.comments")]:::tabla
  t24[("community.conversation_participants")]:::tabla
  t25[("community.conversations")]:::tabla
  t26[("community.direct_messages")]:::tabla
  t28[("community.user_blocks")]:::tabla
  t30[("common.file_versions")]:::tabla
  t31[("common.files")]:::tabla
  t42[("community.moderation_appeals")]:::tabla
  t43[("community.moderation_decisions")]:::tabla
  t45[("community.moderation_queue")]:::tabla
  t48[("community.moderation_strikes")]:::tabla
  t50[("community.content_reports")]:::tabla
  t52[("community.poll_options")]:::tabla
  t53[("community.poll_votes")]:::tabla
  t54[("community.polls")]:::tabla
  t55[("community.social_follows")]:::tabla
  t56[("community.social_posts")]:::tabla
  t11[("+3 tablas más")]
  t15[("+2 tablas más")]
  t17[("+6 tablas más")]
  t20[("+1 tablas más")]
  t22[("+9 tablas más")]
  subgraph s0["ctrl:CommunityGroupsController · Operaciones de CommunityGroupsController que e…"]
    o1["GET /community/groups"]:::op
    o8["POST /community/groups"]:::op
    o12["GET /community/groups/{groupId}"]:::op
    o13["GET /community/groups/{groupId}/members"]:::op
    o14["DELETE /community/groups/{groupId}/members/{member}"]:::op
    o16["PATCH /community/groups/{groupId}/members/{member}"]:::op
    o18["GET /community/groups/{groupId}/posts"]:::op
    o21["POST /community/groups/{groupId}/posts"]:::op
  end
  subgraph s1["ctrl:CommunityMessagingController · Operaciones de CommunityMessagingController…"]
    o23["GET /community/conversations"]:::op
    o27["POST /community/conversations"]:::op
    o29["GET /community/conversations/{conversationId}/attachments/{fileId}/co…"]:::op
    o32["GET /community/conversations/{conversationId}/messages"]:::op
    o33["DELETE /community/conversations/{conversationId}/messages/{messageId}"]:::op
    o34["PATCH /community/conversations/{conversationId}/messages/{messageId}"]:::op
    o35["PATCH /community/conversations/{conversationId}/participant"]:::op
    o36["DELETE /community/conversations/{conversationId}/pin"]:::op
    o37["POST /community/conversations/{conversationId}/pin"]:::op
    o38["GET /community/conversations/{conversationId}/presence"]:::op
    o39["POST /community/conversations/contacts/search"]:::op
  end
  subgraph s2["ctrl:CommunityModerationController · Operaciones de CommunityModerationControll…"]
    o40["GET /community/moderation/appeals"]:::op
    o44["POST /community/moderation/appeals/{appealId}/resolve"]:::op
    o46["GET /community/moderation/decisions"]:::op
    o47["GET /community/moderation/decisions/mine"]:::op
    o49["GET /community/moderation/queue"]:::op
  end
  t57[("+1 tablas más")]
  subgraph s3["ctrl:CommunityPollsController · Operaciones de CommunityPollsController que el…"]
    o51["GET /community/polls/{pollId}"]:::op
    o58["POST /community/posts/{postId}/polls"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  a2 --> o8
  o8 -->|"LEE"| t3
  o8 -->|"CREA"| t9
  o8 -->|"CREA"| t4
  o8 -->|"LEE"| t4
  o8 -->|"LEE"| t5
  o8 -->|"LEE"| t10
  o8 -.-> t11
  a2 --> o12
  o12 -->|"LEE"| t3
  o12 -->|"LEE"| t9
  o12 -->|"LEE"| t4
  o12 -->|"LEE"| t5
  o12 -->|"LEE"| t6
  o12 -->|"LEE"| t7
  a2 --> o13
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t9
  o13 -->|"LEE"| t4
  o13 -->|"LEE"| t5
  o13 -->|"LEE"| t6
  o13 -->|"LEE"| t7
  a2 --> o14
  o14 -->|"LEE"| t3
  o14 -->|"ACTUALIZA"| t9
  o14 -->|"LEE"| t9
  o14 -->|"ACTUALIZA"| t4
  o14 -->|"LEE"| t4
  o14 -->|"LEE"| t5
  o14 -.-> t15
  a2 --> o16
  o16 -->|"LEE"| t3
  o16 -->|"ACTUALIZA"| t9
  o16 -->|"LEE"| t9
  o16 -->|"LEE"| t4
  o16 -->|"LEE"| t5
  o16 -->|"LEE"| t6
  o16 -.-> t17
  a2 --> o18
  o18 -->|"LEE"| t3
  o18 -->|"LEE"| t19
  o18 -->|"LEE"| t9
  o18 -->|"LEE"| t4
  o18 -->|"LEE"| t5
  o18 -->|"LEE"| t6
  o18 -.-> t20
  a2 --> o21
  o21 -->|"LEE"| t3
  o21 -->|"ACTUALIZA"| t19
  o21 -->|"CREA"| t19
  o21 -->|"LEE"| t19
  o21 -->|"LEE"| t9
  o21 -->|"LEE"| t4
  o21 -.-> t22
  a2 --> o23
  o23 -->|"LEE"| t24
  o23 -->|"LEE"| t25
  o23 -->|"LEE"| t26
  o23 -->|"LEE"| t5
  a2 --> o27
  o27 -->|"CREA"| t24
  o27 -->|"LEE"| t24
  o27 -->|"CREA"| t25
  o27 -->|"LEE"| t25
  o27 -->|"LEE"| t5
  o27 -->|"LEE"| t28
  a2 --> o29
  o29 -->|"LEE"| t30
  o29 -->|"LEE"| t31
  o29 -->|"LEE"| t24
  o29 -->|"LEE"| t26
  o29 -->|"LEE"| t5
  o29 -->|"LEE"| t28
  a2 --> o32
  o32 -->|"LEE"| t24
  o32 -->|"LEE"| t25
  o32 -->|"LEE"| t26
  o32 -->|"LEE"| t5
  o32 -->|"LEE"| t28
  a2 --> o33
  o33 -->|"LEE"| t24
  o33 -->|"ACTUALIZA"| t25
  o33 -->|"LEE"| t25
  o33 -->|"ACTUALIZA"| t26
  o33 -->|"LEE"| t26
  o33 -->|"LEE"| t5
  a2 --> o34
  o34 -->|"LEE"| t24
  o34 -->|"ACTUALIZA"| t26
  o34 -->|"LEE"| t26
  o34 -->|"LEE"| t5
  a2 --> o35
  o35 -->|"LEE"| t24
  o35 -->|"LEE"| t5
  a2 --> o36
  o36 -->|"LEE"| t24
  o36 -->|"ACTUALIZA"| t25
  o36 -->|"LEE"| t25
  o36 -->|"LEE"| t5
  a2 --> o37
  o37 -->|"LEE"| t24
  o37 -->|"ACTUALIZA"| t25
  o37 -->|"LEE"| t25
  o37 -->|"LEE"| t26
  o37 -->|"LEE"| t5
  a2 --> o38
  o38 -->|"LEE"| t24
  o38 -->|"LEE"| t5
  a2 --> o39
  o39 -->|"LEE"| t5
  o39 -->|"LEE"| t28
  a41 --> o40
  o40 -->|"LEE"| t42
  o40 -->|"LEE"| t43
  a41 --> o44
  o44 -->|"ACTUALIZA"| t42
  o44 -->|"LEE"| t42
  o44 -->|"LEE"| t43
  o44 -->|"ACTUALIZA"| t45
  o44 -->|"LEE"| t45
  a41 --> o46
  o46 -->|"LEE"| t43
  a2 --> o47
  o47 -->|"LEE"| t42
  o47 -->|"LEE"| t43
  o47 -->|"LEE"| t48
  o47 -->|"LEE"| t5
  a41 --> o49
  o49 -->|"LEE"| t50
  o49 -->|"LEE"| t45
  a2 --> o51
  o51 -->|"LEE"| t52
  o51 -->|"LEE"| t53
  o51 -->|"LEE"| t54
  o51 -->|"LEE"| t5
  o51 -->|"LEE"| t55
  o51 -->|"LEE"| t56
  o51 -.-> t57
  a2 --> o58
  o58 -->|"CREA"| t52
  o58 -->|"CREA"| t54
  o58 -->|"LEE"| t5
  o58 -->|"LEE"| t56
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 3 de 5 — etapas `ctrl:CommunityPublicController`, `ctrl:CommunityReviewsController`, `ctrl:CommunitySearchIndexController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a7(["Público (sin sesión)"]):::actor
  a62(["SYSTEM · SECURITY_ADMIN · SEARCH_ADMIN"]):::actor
  t8[("common.addresses")]:::tabla
  t9[("community.comments")]:::tabla
  t10[("community.post_media")]:::tabla
  t11[("community.public_profiles")]:::tabla
  t12[("community.reactions")]:::tabla
  t13[("community.service_reviews")]:::tabla
  t22[("community.comment_media")]:::tabla
  t23[("community.social_posts")]:::tabla
  t25[("common.file_versions")]:::tabla
  t26[("common.files")]:::tabla
  t29[("community.verified_badges")]:::tabla
  t30[("scheduling.bookable_slots")]:::tabla
  t31[("scheduling.practitioner_schedules")]:::tabla
  t39[("community.review_dimension_scores")]:::tabla
  t40[("community.review_responses")]:::tabla
  t41[("profiles.persons")]:::tabla
  t43[("profiles.practitioner_specialties")]:::tabla
  t14[("+12 tablas más")]
  t16[("+12 tablas más")]
  t18[("+12 tablas más")]
  t20[("+12 tablas más")]
  t27[("+1 tablas más")]
  t32[("+1 tablas más")]
  t37[("+12 tablas más")]
  t44[("+6 tablas más")]
  t46[("+6 tablas más")]
  t48[("+6 tablas más")]
  t50[("+6 tablas más")]
  t52[("+6 tablas más")]
  t54[("+6 tablas más")]
  t56[("+6 tablas más")]
  t58[("+12 tablas más")]
  subgraph s0["ctrl:CommunityPublicController · Operaciones de CommunityPublicController que e…"]
    o1["DESCONOCIDO /"]:::op
    o3["DESCONOCIDO /"]:::op
    o4["DESCONOCIDO /"]:::op
    o5["DESCONOCIDO /"]:::op
    o6["GET /f/{slug}"]:::op
    o15["GET /l/{slug}"]:::op
    o17["GET /o/{slug}"]:::op
    o19["GET /p/{slug}"]:::op
    o21["GET /public/comments/{commentId}/replies"]:::op
    o24["GET /public/media/{id}"]:::op
    o28["GET /public/nearby"]:::op
    o33["GET /public/posts"]:::op
    o34["GET /public/posts/{postId}/comments"]:::op
    o35["GET /public/posts/{postId}/reactions"]:::op
    o36["GET /public/profiles/{prefijo}/{slug}"]:::op
    o38["GET /public/profiles/{prefijo}/{slug}/reviews"]:::op
    o42["GET /public/search"]:::op
    o45["GET /public/search/diagnostic-units"]:::op
    o47["GET /public/search/insurers"]:::op
    o49["GET /public/search/medications"]:::op
    o51["GET /public/search/organizations"]:::op
    o53["GET /public/search/pharmacies"]:::op
    o55["GET /public/search/practitioners"]:::op
    o57["GET /s/{slug}"]:::op
  end
  subgraph s1["ctrl:CommunityReviewsController · Operaciones de CommunityReviewsController que…"]
    o59["GET /community/profiles/{profileId}/reviews"]:::op
    o60["POST /community/profiles/{profileId}/reviews/{reviewId}/responses"]:::op
  end
  t64[("+3 tablas más")]
  subgraph s2["ctrl:CommunitySearchIndexController · Operaciones de CommunitySearchIndexContro…"]
    o61["GET /internal/community/search/health"]:::op
    o63["POST /internal/community/search/reindex"]:::op
  end
  a2 --> o1
  a2 --> o3
  a2 --> o4
  a2 --> o5
  a7 --> o6
  o6 -->|"LEE"| t8
  o6 -->|"LEE"| t9
  o6 -->|"LEE"| t10
  o6 -->|"LEE"| t11
  o6 -->|"LEE"| t12
  o6 -->|"LEE"| t13
  o6 -.-> t14
  a7 --> o15
  o15 -->|"LEE"| t8
  o15 -->|"LEE"| t9
  o15 -->|"LEE"| t10
  o15 -->|"LEE"| t11
  o15 -->|"LEE"| t12
  o15 -->|"LEE"| t13
  o15 -.-> t16
  a7 --> o17
  o17 -->|"LEE"| t8
  o17 -->|"LEE"| t9
  o17 -->|"LEE"| t10
  o17 -->|"LEE"| t11
  o17 -->|"LEE"| t12
  o17 -->|"LEE"| t13
  o17 -.-> t18
  a7 --> o19
  o19 -->|"LEE"| t8
  o19 -->|"LEE"| t9
  o19 -->|"LEE"| t10
  o19 -->|"LEE"| t11
  o19 -->|"LEE"| t12
  o19 -->|"LEE"| t13
  o19 -.-> t20
  a7 --> o21
  o21 -->|"LEE"| t22
  o21 -->|"LEE"| t9
  o21 -->|"LEE"| t11
  o21 -->|"LEE"| t23
  a7 --> o24
  o24 -->|"LEE"| t25
  o24 -->|"LEE"| t26
  o24 -->|"LEE"| t22
  o24 -->|"LEE"| t9
  o24 -->|"LEE"| t10
  o24 -->|"LEE"| t11
  o24 -.-> t27
  a7 --> o28
  o28 -->|"LEE"| t8
  o28 -->|"LEE"| t11
  o28 -->|"LEE"| t13
  o28 -->|"LEE"| t29
  o28 -->|"LEE"| t30
  o28 -->|"LEE"| t31
  o28 -.-> t32
  a7 --> o33
  o33 -->|"LEE"| t9
  o33 -->|"LEE"| t10
  o33 -->|"LEE"| t11
  o33 -->|"LEE"| t12
  o33 -->|"LEE"| t23
  a7 --> o34
  o34 -->|"LEE"| t22
  o34 -->|"LEE"| t9
  o34 -->|"LEE"| t11
  o34 -->|"LEE"| t23
  a7 --> o35
  o35 -->|"LEE"| t11
  o35 -->|"LEE"| t12
  o35 -->|"LEE"| t23
  a7 --> o36
  o36 -->|"LEE"| t8
  o36 -->|"LEE"| t9
  o36 -->|"LEE"| t10
  o36 -->|"LEE"| t11
  o36 -->|"LEE"| t12
  o36 -->|"LEE"| t13
  o36 -.-> t37
  a7 --> o38
  o38 -->|"LEE"| t11
  o38 -->|"LEE"| t39
  o38 -->|"LEE"| t40
  o38 -->|"LEE"| t13
  o38 -->|"LEE"| t41
  a7 --> o42
  o42 -->|"LEE"| t8
  o42 -->|"LEE"| t11
  o42 -->|"LEE"| t13
  o42 -->|"LEE"| t29
  o42 -->|"LEE"| t43
  o42 -->|"LEE"| t30
  o42 -.-> t44
  a7 --> o45
  o45 -->|"LEE"| t8
  o45 -->|"LEE"| t11
  o45 -->|"LEE"| t13
  o45 -->|"LEE"| t29
  o45 -->|"LEE"| t43
  o45 -->|"LEE"| t30
  o45 -.-> t46
  a7 --> o47
  o47 -->|"LEE"| t8
  o47 -->|"LEE"| t11
  o47 -->|"LEE"| t13
  o47 -->|"LEE"| t29
  o47 -->|"LEE"| t43
  o47 -->|"LEE"| t30
  o47 -.-> t48
  a7 --> o49
  o49 -->|"LEE"| t8
  o49 -->|"LEE"| t11
  o49 -->|"LEE"| t13
  o49 -->|"LEE"| t29
  o49 -->|"LEE"| t43
  o49 -->|"LEE"| t30
  o49 -.-> t50
  a7 --> o51
  o51 -->|"LEE"| t8
  o51 -->|"LEE"| t11
  o51 -->|"LEE"| t13
  o51 -->|"LEE"| t29
  o51 -->|"LEE"| t43
  o51 -->|"LEE"| t30
  o51 -.-> t52
  a7 --> o53
  o53 -->|"LEE"| t8
  o53 -->|"LEE"| t11
  o53 -->|"LEE"| t13
  o53 -->|"LEE"| t29
  o53 -->|"LEE"| t43
  o53 -->|"LEE"| t30
  o53 -.-> t54
  a7 --> o55
  o55 -->|"LEE"| t8
  o55 -->|"LEE"| t11
  o55 -->|"LEE"| t13
  o55 -->|"LEE"| t29
  o55 -->|"LEE"| t43
  o55 -->|"LEE"| t30
  o55 -.-> t56
  a7 --> o57
  o57 -->|"LEE"| t8
  o57 -->|"LEE"| t9
  o57 -->|"LEE"| t10
  o57 -->|"LEE"| t11
  o57 -->|"LEE"| t12
  o57 -->|"LEE"| t13
  o57 -.-> t58
  a2 --> o59
  o59 -->|"LEE"| t11
  o59 -->|"LEE"| t39
  o59 -->|"LEE"| t40
  o59 -->|"LEE"| t13
  o59 -->|"LEE"| t41
  a2 --> o60
  o60 -->|"LEE"| t11
  o60 -->|"CREA"| t40
  o60 -->|"LEE"| t40
  o60 -->|"LEE"| t13
  a62 --> o61
  o61 -->|"LEE"| t11
  a62 --> o63
  o63 -->|"LEE"| t8
  o63 -->|"LEE"| t11
  o63 -->|"LEE"| t13
  o63 -->|"LEE"| t29
  o63 -->|"LEE"| t43
  o63 -->|"LEE"| t30
  o63 -.-> t64
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 4 de 5 — etapas `ctrl:CommunitySocialController`, `ctrl:CommunityTimelineController`, `ctrl:CommunityTopicsController`…

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a40(["SECURITY_ADMIN"]):::actor
  a52(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("community.public_profiles")]:::tabla
  t4[("community.user_blocks")]:::tabla
  t7[("community.bookmarks")]:::tabla
  t10[("common.file_versions")]:::tabla
  t11[("common.files")]:::tabla
  t12[("community.comment_media")]:::tabla
  t13[("community.comments")]:::tabla
  t14[("community.social_follows")]:::tabla
  t19[("community.content_hashtags")]:::tabla
  t20[("community.hashtags")]:::tabla
  t21[("community.mentions")]:::tabla
  t22[("community.post_media")]:::tabla
  t25[("community.social_posts")]:::tabla
  t27[("community.reactions")]:::tabla
  t29[("community.prestige_scores")]:::tabla
  t30[("community.verified_badges")]:::tabla
  t32[("community.chat_auto_replies")]:::tabla
  t42[("community.feed_items")]:::tabla
  t45[("community.social_notifications")]:::tabla
  t47[("community.topics")]:::tabla
  t49[("audit.verified_badges_history")]:::tabla
  t15[("+2 tablas más")]
  t23[("+4 tablas más")]
  subgraph s0["ctrl:CommunitySocialController · Operaciones de CommunitySocialController que e…"]
    o1["DELETE /community/blocks"]:::op
    o5["GET /community/blocks"]:::op
    o6["DELETE /community/bookmarks"]:::op
    o8["GET /community/bookmarks"]:::op
    o9["GET /community/comments/media/{fileId}/content"]:::op
    o16["DELETE /community/follows"]:::op
    o17["GET /community/follows"]:::op
    o18["GET /community/posts/{postId}"]:::op
    o24["GET /community/posts/{postId}/comments"]:::op
    o26["GET /community/posts/{postId}/reactions"]:::op
    o28["GET /community/profiles/{profileId}"]:::op
    o31["GET /community/profiles/{profileId}/auto-reply"]:::op
    o33["PUT /community/profiles/{profileId}/auto-reply"]:::op
    o34["GET /community/profiles/{profileId}/posts"]:::op
    o35["GET /community/profiles/by-slug/{slug}"]:::op
    o36["GET /community/profiles/me"]:::op
    o37["PUT /community/profiles/me"]:::op
    o38["GET /community/profiles/me/stats"]:::op
    o39["POST /community/public-profiles"]:::op
  end
  t43[("+1 tablas más")]
  subgraph s1["ctrl:CommunityTimelineController · Operaciones de CommunityTimelineController q…"]
    o41["GET /community/feed"]:::op
    o44["GET /community/notifications"]:::op
  end
  subgraph s2["ctrl:CommunityTopicsController · Operaciones de CommunityTopicsController que e…"]
    o46["GET /community/topics"]:::op
  end
  subgraph s3["ctrl:CommunityVerificationController · Operaciones de CommunityVerificationCont…"]
    o48["POST /internal/community/verification/badges"]:::op
    o50["POST /internal/community/verification/badges/{targetId}/revoke"]:::op
    o51["POST /internal/community/verification/badges/expire-sweep"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"ACTUALIZA"| t4
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t4
  a2 --> o6
  o6 -->|"BORRA"| t7
  o6 -->|"LEE"| t7
  o6 -->|"LEE"| t3
  a2 --> o8
  o8 -->|"LEE"| t7
  o8 -->|"LEE"| t3
  a2 --> o9
  o9 -->|"LEE"| t10
  o9 -->|"LEE"| t11
  o9 -->|"LEE"| t12
  o9 -->|"LEE"| t13
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t14
  o9 -.-> t15
  a2 --> o16
  o16 -->|"LEE"| t3
  o16 -->|"ACTUALIZA"| t14
  o16 -->|"LEE"| t14
  a2 --> o17
  o17 -->|"LEE"| t3
  o17 -->|"LEE"| t14
  a2 --> o18
  o18 -->|"LEE"| t13
  o18 -->|"LEE"| t19
  o18 -->|"LEE"| t20
  o18 -->|"LEE"| t21
  o18 -->|"LEE"| t22
  o18 -->|"LEE"| t3
  o18 -.-> t23
  a2 --> o24
  o24 -->|"LEE"| t12
  o24 -->|"LEE"| t13
  o24 -->|"LEE"| t3
  o24 -->|"LEE"| t14
  o24 -->|"LEE"| t25
  o24 -->|"LEE"| t4
  a2 --> o26
  o26 -->|"LEE"| t3
  o26 -->|"LEE"| t27
  o26 -->|"LEE"| t14
  o26 -->|"LEE"| t25
  o26 -->|"LEE"| t4
  a2 --> o28
  o28 -->|"LEE"| t29
  o28 -->|"LEE"| t3
  o28 -->|"LEE"| t4
  o28 -->|"LEE"| t30
  a2 --> o31
  o31 -->|"LEE"| t32
  o31 -->|"LEE"| t3
  a2 --> o33
  o33 -->|"LEE"| t32
  o33 -->|"LEE"| t3
  a2 --> o34
  o34 -->|"LEE"| t13
  o34 -->|"LEE"| t3
  o34 -->|"LEE"| t27
  o34 -->|"LEE"| t14
  o34 -->|"LEE"| t25
  o34 -->|"LEE"| t4
  a2 --> o35
  o35 -->|"LEE"| t29
  o35 -->|"LEE"| t3
  o35 -->|"LEE"| t4
  o35 -->|"LEE"| t30
  a2 --> o36
  o36 -->|"LEE"| t3
  a2 --> o37
  o37 -->|"LEE"| t10
  o37 -->|"LEE"| t11
  o37 -->|"CREA"| t3
  o37 -->|"LEE"| t3
  a2 --> o38
  o38 -->|"LEE"| t3
  a40 --> o39
  o39 -->|"CREA"| t3
  a2 --> o41
  o41 -->|"LEE"| t13
  o41 -->|"LEE"| t42
  o41 -->|"LEE"| t3
  o41 -->|"LEE"| t27
  o41 -->|"LEE"| t14
  o41 -->|"LEE"| t25
  o41 -.-> t43
  a2 --> o44
  o44 -->|"LEE"| t3
  o44 -->|"LEE"| t45
  a2 --> o46
  o46 -->|"LEE"| t47
  a40 --> o48
  o48 -->|"CREA"| t49
  o48 -->|"ACTUALIZA"| t3
  o48 -->|"LEE"| t3
  o48 -->|"ACTUALIZA"| t30
  o48 -->|"CREA"| t30
  o48 -->|"LEE"| t30
  a40 --> o50
  o50 -->|"CREA"| t49
  o50 -->|"ACTUALIZA"| t3
  o50 -->|"LEE"| t3
  o50 -->|"ACTUALIZA"| t30
  o50 -->|"LEE"| t30
  a52 --> o51
  o51 -->|"CREA"| t49
  o51 -->|"ACTUALIZA"| t3
  o51 -->|"LEE"| t3
  o51 -->|"ACTUALIZA"| t30
  o51 -->|"LEE"| t30
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 5 de 5 — etapas `ctrl:PartyRatingsController`, `ctrl:PatientReviewsController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a12(["PATIENT"]):::actor
  t3[("community.party_ratings")]:::tabla
  t4[("practice.practices")]:::tabla
  t6[("clinical.encounter_participants")]:::tabla
  t7[("clinical.encounters")]:::tabla
  t13[("community.public_profiles")]:::tabla
  t14[("community.service_reviews")]:::tabla
  t15[("scheduling.appointment_bookings")]:::tabla
  t17[("community.review_dimension_scores")]:::tabla
  t8[("+3 tablas más")]
  subgraph s0["ctrl:PartyRatingsController · Operaciones de PartyRatingsController que el READ…"]
    o1["GET /community/ratings"]:::op
    o5["PUT /community/ratings"]:::op
    o9["GET /community/ratings/mine"]:::op
    o10["GET /community/ratings/summary"]:::op
  end
  subgraph s1["ctrl:PatientReviewsController · Operaciones de PatientReviewsController que el…"]
    o11["GET /patients/me/reviewable-care"]:::op
    o16["POST /patients/me/reviews"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t6
  o5 -->|"LEE"| t7
  o5 -->|"ACTUALIZA"| t3
  o5 -->|"CREA"| t3
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t4
  o5 -.-> t8
  a2 --> o9
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  a2 --> o10
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t4
  a12 --> o11
  o11 -->|"LEE"| t7
  o11 -->|"LEE"| t13
  o11 -->|"LEE"| t14
  o11 -->|"LEE"| t15
  a12 --> o16
  o16 -->|"LEE"| t6
  o16 -->|"LEE"| t7
  o16 -->|"LEE"| t13
  o16 -->|"CREA"| t17
  o16 -->|"CREA"| t14
  o16 -->|"LEE"| t14
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. DELETE /community/blocks

Levantar un bloqueo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.unblock"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a BlocksRepository.findByPair"]:::llamada
  n10[("LEE community.user_blocks")]:::efecto
  n9 --> n10
  n11[("ACTUALIZA community.user_blocks")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /community/blocks

Bloqueos emitidos por un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.listBlocks"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a BlocksRepository.listByBlocker"]:::llamada
  n9[("LEE community.user_blocks")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /community/blocks

Bloquear a un usuario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: El usuario ya está bloqueado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede bloquear a uno mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.block"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9{"dto.blockerProfileId === dto.blockedProfileId"}:::decision
  n10(["422 PRECONDITION_FAILED No se puede bloquear a uno mismo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a BlocksRepository.findByPair"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE community.user_blocks")]:::efecto
  n11 --> n12
  n13{"previous?.statusConceptId === CONCEPTS.STATE_ACTIVE"}:::decision
  n12 --> n13
  n14(["409 CONFLICT El usuario ya está bloqueado"]):::error
  n13 -->|"sí"| n14
  n15{"previous"}:::decision
  n13 -->|"no"| n15
  n16[("ACTUALIZA community.user_blocks")]:::efecto
  n15 -->|"sí"| n16
  n17{"dto.reason"}:::decision
  n16 --> n17
  n18[("ACTUALIZA community.user_blocks")]:::efecto
  n17 -->|"sí"| n18
  n19["Llama a BlocksRepository.create"]:::llamada
  n18 --> n19
  n17 -->|"no"| n19
  n15 -->|"no"| n19
  n20[("CREA community.user_blocks")]:::efecto
  n19 --> n20
  n21["Llama a FollowsRepository.findMutualBetween"]:::llamada
  n20 --> n21
  n22[("LEE community.social_follows")]:::efecto
  n21 --> n22
  n23["Repite: por cada const f de mutual"]:::bucle
  n22 --> n23
  n24[("ACTUALIZA community.social_follows")]:::efecto
  n23 -->|"cada elemento"| n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  n23 -->|"al terminar"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. DELETE /community/bookmarks

Quitar un marcador

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.unbookmark"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a BookmarksRepository.findByProfileTarget"]:::llamada
  n10[("LEE community.bookmarks")]:::efecto
  n9 --> n10
  n11[("BORRA community.bookmarks")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /community/bookmarks

Marcadores guardados por un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.listBookmarks"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a BookmarksRepository.listByProfilePage"]:::llamada
  n9[("LEE community.bookmarks")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /community/bookmarks

Guardar un bookmark en una colección

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: El contenido ya está guardado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.bookmark"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a BookmarksRepository.findByProfileTarget"]:::llamada
  n10[("LEE community.bookmarks")]:::efecto
  n9 --> n10
  n11{"dup"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El contenido ya está guardado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a BookmarksRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA community.bookmarks")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /community/comments

Comentar (hilo anidado) con contadores

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: Comentario padre no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.createComment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!author"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Perfil autor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n11 --> n12
  n13{"dto.parentCommentId"}:::decision
  n14["Llama a CommentsRepository.findById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE community.comments")]:::efecto
  n14 --> n15
  n16{"!parent"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Comentario padre no encontrado"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA community.comments")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a CommentsRepository.create"]:::llamada
  n18 --> n19
  n13 -->|"no"| n19
  n20[("CREA community.comments")]:::efecto
  n19 --> n20
  n21["Repite: por cada const [i, m] de (dto.media ?? []).entries()"]:::bucle
  n20 --> n21
  n22["Llama a CommunitySocialService.assertMediaFileUsableBy"]:::llamada
  n21 -->|"cada elemento"| n22
  n23["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n22 --> n23
  n24["Llama a FilesRepository.findById"]:::llamada
  n23 --> n24
  n25[("LEE common.files")]:::efecto
  n24 --> n25
  n26{"!file"}:::decision
  n25 --> n26
  n27(["404 NOT_FOUND {labels.notFound}"]):::error
  n26 -->|"sí"| n27
  n28{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n26 -->|"no"| n28
  n29(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n28 -->|"sí"| n29
  n30{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n28 -->|"no"| n30
  n31(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n30 -->|"sí"| n31
  n32{"!file.currentVersionId"}:::decision
  n30 -->|"no"| n32
  n33(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n32 -->|"sí"| n33
  n34["Llama a AttachableFileService.assertVersionUsable"]:::llamada
  n32 -->|"no"| n34
  n35{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n34 --> n35
  n36(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n35 -->|"sí"| n36
  n37{"!file.currentVersionId"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n37 -->|"sí"| n38
  n39{"!version"}:::decision
  n37 -->|"no"| n39
  n40(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n39 -->|"sí"| n40
  n41{"version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED"}:::decision
  n39 -->|"no"| n41
  n42(["422 PRECONDITION_FAILED {labels.subject} resultó infectado"]):::error
  n41 -->|"sí"| n42
  n43{"accepted && !accepted.includes(version.mimeType ?? '')"}:::decision
  n41 -->|"no"| n43
  n44(["422 PRECONDITION_FAILED {labels.subject} no es de un formato admitido para este uso"]):::error
  n43 -->|"sí"| n44
  n45["Llama a CommentsRepository.createMedia"]:::llamada
  n43 -->|"no"| n45
  n46[("CREA community.comment_media")]:::efecto
  n45 --> n46
  n47["Repite: por cada const mention de dto.mentions ?? []"]:::bucle
  n46 --> n47
  n21 -->|"al terminar"| n47
  n48["Llama a PostsRepository.createMention"]:::llamada
  n47 -->|"cada elemento"| n48
  n49[("CREA community.mentions")]:::efecto
  n48 --> n49
  n50(("201 Responde con éxito")):::ok
  n49 --> n50
  n47 -->|"al terminar"| n50
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. GET /community/comments/media/{fileId}/content

Descargar el adjunto de un comentario (imagen, sticker o GIF)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Publicación no encontrada; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente todavía no está lista para servirse públicamente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.getCommentMedia"]:::llamada
  n2 --> n3
  n4["Llama a CommentsRepository.findMediaByFileId"]:::llamada
  n3 --> n4
  n5[("LEE community.comment_media")]:::efecto
  n4 --> n5
  n6{"!attachment"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Archivo no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommentsRepository.findById"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE community.comments")]:::efecto
  n8 --> n9
  n10{"!comment || comment.commentableTypeConceptId !== SOCIAL_OBJECT_CONCEPT_BY_CODE.POST"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Archivo no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n10 -->|"no"| n12
  n13{"requested"}:::decision
  n12 --> n13
  n14["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n13 -->|"sí"| n14
  n15["Llama a PublicProfilesRepository.findById"]:::llamada
  n14 --> n15
  n16[("LEE community.public_profiles")]:::efecto
  n15 --> n16
  n17(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n16 --> n17
  n18["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n13 -->|"no"| n18
  n19["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("LEE community.public_profiles")]:::efecto
  n19 --> n20
  n21["Llama a CommunitySocialReadService.assertPostVisible"]:::llamada
  n20 --> n21
  n18 -->|"al terminar"| n21
  n22["Llama a PostsRepository.findById"]:::llamada
  n21 --> n22
  n23[("LEE community.social_posts")]:::efecto
  n22 --> n23
  n24{"!post || !(await this.visibility.canViewPost(em, post, actorProfileId))"}:::decision
  n23 --> n24
  n25(["404 NOT_FOUND Publicación no encontrada"]):::error
  n24 -->|"sí"| n25
  n26["Llama a FileUploadService.downloadPublicMedia"]:::llamada
  n24 -->|"no"| n26
  n27["Llama a FilesRepository.findById"]:::llamada
  n26 --> n27
  n28[("LEE common.files")]:::efecto
  n27 --> n28
  n29{"!file || file.categoryConceptId !== CONCEPTS.FILE_CATEGORY_IMAGE || file.sensitivityConceptId !== CONCEPTS.SE…"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND Archivo no encontrado"]):::error
  n29 -->|"sí"| n30
  n31{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n29 -->|"no"| n31
  n32(["422 PRECONDITION_FAILED El archivo está borrado"]):::error
  n31 -->|"sí"| n32
  n33{"!file.currentVersionId"}:::decision
  n31 -->|"no"| n33
  n34(["422 PRECONDITION_FAILED El archivo no tiene una versión vigente"]):::error
  n33 -->|"sí"| n34
  n35["Llama a FileVersionsRepository.findById"]:::llamada
  n33 -->|"no"| n35
  n36[("LEE common.file_versions")]:::efecto
  n35 --> n36
  n37{"!version"}:::decision
  n36 --> n37
  n38(["404 NOT_FOUND Versión vigente no encontrada"]):::error
  n37 -->|"sí"| n38
  n39{"version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN"}:::decision
  n37 -->|"no"| n39
  n40(["422 PRECONDITION_FAILED La versión vigente todavía no está lista para servirse públicamente"]):::error
  n39 -->|"sí"| n40
  n41["Llama a LocalDiskFileStorageAdapter.retrieve"]:::llamada
  n39 -->|"no"| n41
  n42["Llama a LocalDiskFileStorageAdapter.hashFromUri"]:::llamada
  n41 --> n42
  n43{"!storageUri.startsWith(LOCAL_URI_PREFIX)"}:::decision
  n42 --> n43
  n44(["404 NOT_FOUND La URI no pertenece al almacenamiento local"]):::error
  n43 -->|"sí"| n44
  n45{"!CONTENT_HASH_PATTERN.test(hash)"}:::decision
  n43 -->|"no"| n45
  n46(["404 NOT_FOUND La URI de almacenamiento local está mal formada"]):::error
  n45 -->|"sí"| n46
  n47["Intenta"]:::intento
  n45 -->|"no"| n47
  n48{"isMissingFile(error)"}:::decision
  n47 -->|"si falla"| n48
  n49(["404 NOT_FOUND El contenido no está disponible en el almacenamiento local"]):::error
  n48 -->|"sí"| n49
  n50(["↩ (relanza el error capturado)"]):::error
  n48 -->|"no"| n50
  n51["Llama a S3FileStorageAdapter.retrieve"]:::llamada
  n47 --> n51
  n52["Llama a S3FileStorageAdapter.assertConfigured"]:::llamada
  n51 --> n52
  n53{"!this.env.s3.bucket"}:::decision
  n52 --> n53
  n54(["500 INTERNAL {HttpStatus.SERVICE_UNAVAILABLE}"]):::error
  n53 -->|"sí"| n54
  n55["Llama a S3FileStorageAdapter.parseOwnedKey"]:::llamada
  n53 -->|"no"| n55
  n56{"!storageUri.startsWith(expected)"}:::decision
  n55 --> n56
  n57(["404 NOT_FOUND La URI no pertenece al bucket configurado"]):::error
  n56 -->|"sí"| n57
  n58{"!CONTENT_HASH_PATTERN.test(hash) || key !== this.objectKey(hash)"}:::decision
  n56 -->|"no"| n58
  n59(["404 NOT_FOUND La URI S3 está mal formada o fuera del prefijo permitido"]):::error
  n58 -->|"sí"| n59
  n60["Intenta"]:::intento
  n58 -->|"no"| n60
  n61{"!result.Body"}:::decision
  n60 --> n61
  n62(["500 INTERNAL S3 object body is empty"]):::error
  n61 -->|"sí"| n62
  n63{"isNotFound(error)"}:::decision
  n60 -->|"si falla"| n63
  n64(["404 NOT_FOUND El contenido no está disponible en el almacenamiento configurado"]):::error
  n63 -->|"sí"| n64
  n65(["↩ (relanza el error capturado)"]):::error
  n63 -->|"no"| n65
  n66(("200 Responde con éxito")):::ok
  n61 -->|"no"| n66
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /community/conversations

Conversaciones activas de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingReadService.listConversations"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a ConversationsRepository.listActiveParticipationsOf"]:::llamada
  n9[("LEE community.conversation_participants")]:::efecto
  n8 --> n9
  n10["Llama a ConversationsRepository.listConversationsByIds"]:::llamada
  n9 --> n10
  n11[("LEE community.conversations")]:::efecto
  n10 --> n11
  n12["Repite: map(…)"]:::bucle
  n11 --> n12
  n13["Llama a ConversationsRepository.findParticipants"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("LEE community.conversation_participants")]:::efecto
  n13 --> n14
  n15["Llama a PublicProfilesRepository.listByIds"]:::llamada
  n14 --> n15
  n12 -->|"al terminar"| n15
  n16[("LEE community.public_profiles")]:::efecto
  n15 --> n16
  n17["Repite: map(…)"]:::bucle
  n16 --> n17
  n18["Llama a ConversationsRepository.findLastMessage"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("LEE community.direct_messages")]:::efecto
  n18 --> n19
  n20["Llama a ConversationsRepository.countUnread"]:::llamada
  n19 --> n20
  n21[("LEE community.direct_messages")]:::efecto
  n20 --> n21
  n22{"!lastReadMessageId"}:::decision
  n21 --> n22
  n23[("LEE community.direct_messages")]:::efecto
  n22 -->|"sí"| n23
  n24[("LEE community.direct_messages · LEE community.direct_messages")]:::efecto
  n23 --> n24
  n22 -->|"no"| n24
  n25{"!lastRead?.sentAt"}:::decision
  n24 --> n25
  n26[("LEE community.direct_messages")]:::efecto
  n25 -->|"sí"| n26
  n27[("LEE community.direct_messages")]:::efecto
  n26 --> n27
  n25 -->|"no"| n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  n17 -->|"al terminar"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /community/conversations

Crear una conversación con participantes

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las conversaciones grupales se crean desde el flujo de grupos; PreconditionFailedException: Los participantes de una conversación deben ser distintos; PreconditionFailedException: Una conversación directa requiere exactamente dos participantes; PreconditionFailedException: La persona no está disponible para iniciar una conversación; PreconditionFailedException: No se puede iniciar una conversación entre perfiles bloqueados |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.createConversation"]:::llamada
  n2 --> n3
  n4{"(dto.conversationType as string | undefined) === 'GROUP'"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Las conversaciones grupales se crean desde el flujo de grupos"]):::error
  n4 -->|"sí"| n5
  n6["Llama a CommunityMessagingService.createDirectConversation"]:::llamada
  n4 -->|"no"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n6 --> n7
  n8["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n7 --> n8
  n9["Llama a PublicProfilesRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n10 --> n11
  n12{"participantIds.size !== dto.participantProfileIds.length"}:::decision
  n13(["422 PRECONDITION_FAILED Los participantes de una conversación deben ser distintos"]):::error
  n12 -->|"sí"| n13
  n14{"dto.participantProfileIds.length !== 2"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED Una conversación directa requiere exactamente dos participantes"]):::error
  n14 -->|"sí"| n15
  n16["Llama a PublicProfilesRepository.findById"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE community.public_profiles")]:::efecto
  n16 --> n17
  n18{"!eligibleRecipient"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED La persona no está disponible para iniciar una conversación"]):::error
  n18 -->|"sí"| n19
  n20["Llama a BlocksRepository.existsBetween"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE community.user_blocks")]:::efecto
  n20 --> n21
  n22{"blocked"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED No se puede iniciar una conversación entre perfiles bloqueados"]):::error
  n22 -->|"sí"| n23
  n24["Llama a ConversationsRepository.findDirectBetween"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE community.conversation_participants · LEE community.conversations")]:::efecto
  n24 --> n25
  n26["Repite: por cada const conversation de candidates"]:::bucle
  n25 --> n26
  n27[("LEE community.conversation_participants")]:::efecto
  n26 -->|"cada elemento"| n27
  n28["Llama a ConversationsRepository.createConversation"]:::llamada
  n27 --> n28
  n26 -->|"al terminar"| n28
  n29[("CREA community.conversations")]:::efecto
  n28 --> n29
  n30["Repite: por cada const profileId de dto.participantProfileIds"]:::bucle
  n29 --> n30
  n31["Llama a ConversationsRepository.createParticipant"]:::llamada
  n30 -->|"cada elemento"| n31
  n32[("CREA community.conversation_participants")]:::efecto
  n31 --> n32
  n33(("201 Responde con éxito")):::ok
  n32 --> n33
  n30 -->|"al terminar"| n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. GET /community/conversations/{conversationId}/attachments/{fileId}/content

Descargar el adjunto de una conversación (participante activo)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingReadService.getAttachmentContent"]:::llamada
  n2 --> n3
  n4["Intenta"]:::intento
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n7 --> n8
  n9{"error instanceof ForbiddenException"}:::decision
  n4 -->|"si falla"| n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n9 -->|"no"| n11
  n12["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n13[("LEE community.conversation_participants")]:::efecto
  n12 --> n13
  n14{"!participant"}:::decision
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Intenta"]:::intento
  n14 -->|"no"| n16
  n17["Llama a CommunityMessagingReadService.assertNoBlockWithPeers"]:::llamada
  n16 --> n17
  n18["Llama a ConversationsRepository.findParticipants"]:::llamada
  n17 --> n18
  n19[("LEE community.conversation_participants")]:::efecto
  n18 --> n19
  n20["Repite: por cada const peer de peers"]:::bucle
  n19 --> n20
  n21["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n20 -->|"cada elemento"| n21
  n22["Llama a BlocksRepository.existsBetween"]:::llamada
  n21 --> n22
  n23[("LEE community.user_blocks")]:::efecto
  n22 --> n23
  n24{"await this.visibility.isBlockedBetween(em, profileId, peer)"}:::decision
  n23 --> n24
  n25(["404 NOT_FOUND Conversación no encontrada"]):::error
  n24 -->|"sí"| n25
  n26{"error instanceof ResourceNotFoundException"}:::decision
  n16 -->|"si falla"| n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"sí"| n27
  n28(["↩ (relanza el error capturado)"]):::error
  n26 -->|"no"| n28
  n29["Llama a ConversationsRepository.findLiveMessagesByAttachmentFileId"]:::llamada
  n24 -->|"no"| n29
  n20 -->|"al terminar"| n29
  n30[("LEE community.direct_messages")]:::efecto
  n29 --> n30
  n31{"!messages.some((message) =› message.conversationId === conversationId)"}:::decision
  n30 --> n31
  n32(["↩ (relanza el error capturado)"]):::error
  n31 -->|"sí"| n32
  n33["Intenta"]:::intento
  n31 -->|"no"| n33
  n34["Llama a FileUploadService.downloadForAuthorizedContext"]:::llamada
  n33 --> n34
  n35["Llama a FilesRepository.findById"]:::llamada
  n34 --> n35
  n36[("LEE common.files")]:::efecto
  n35 --> n36
  n37{"!file"}:::decision
  n36 --> n37
  n38(["404 NOT_FOUND Archivo no encontrado"]):::error
  n37 -->|"sí"| n38
  n39["Llama a FileUploadService.serveCurrentVersion"]:::llamada
  n37 -->|"no"| n39
  n40["Llama a AttachableFileService.assertUsableForAuthorizedContext"]:::llamada
  n39 --> n40
  n41{"!file"}:::decision
  n40 --> n41
  n42(["404 NOT_FOUND {labels.notFound}"]):::error
  n41 -->|"sí"| n42
  n43["Llama a LocalDiskFileStorageAdapter.retrieve"]:::llamada
  n41 -->|"no"| n43
  n44["Intenta"]:::intento
  n43 --> n44
  n45{"isMissingFile(error)"}:::decision
  n44 -->|"si falla"| n45
  n46(["404 NOT_FOUND El contenido no está disponible en el almacenamiento local"]):::error
  n45 -->|"sí"| n46
  n47(["↩ (relanza el error capturado)"]):::error
  n45 -->|"no"| n47
  n48["Llama a S3FileStorageAdapter.retrieve"]:::llamada
  n44 --> n48
  n49["Intenta"]:::intento
  n48 --> n49
  n50{"!result.Body"}:::decision
  n49 --> n50
  n51(["500 INTERNAL S3 object body is empty"]):::error
  n50 -->|"sí"| n51
  n52{"isNotFound(error)"}:::decision
  n49 -->|"si falla"| n52
  n53(["404 NOT_FOUND El contenido no está disponible en el almacenamiento configurado"]):::error
  n52 -->|"sí"| n53
  n54(["↩ (relanza el error capturado)"]):::error
  n52 -->|"no"| n54
  n55{"error instanceof ResourceNotFoundException || error instanceof PreconditionFailedException"}:::decision
  n33 -->|"si falla"| n55
  n56(["↩ (relanza el error capturado)"]):::error
  n55 -->|"sí"| n56
  n57(["↩ (relanza el error capturado)"]):::error
  n55 -->|"no"| n57
  n58(("200 Responde con éxito")):::ok
  n50 -->|"no"| n58
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. GET /community/conversations/{conversationId}/messages

Mensajes de una conversación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingReadService.listMessages"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9[("LEE community.conversation_participants")]:::efecto
  n8 --> n9
  n10{"!participant"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Conversación no encontrada"]):::error
  n10 -->|"sí"| n11
  n12["Llama a CommunityMessagingReadService.assertNoBlockWithPeers"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a ConversationsRepository.findParticipants"]:::llamada
  n12 --> n13
  n14[("LEE community.conversation_participants")]:::efecto
  n13 --> n14
  n15["Repite: por cada const peer de peers"]:::bucle
  n14 --> n15
  n16["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n15 -->|"cada elemento"| n16
  n17["Llama a BlocksRepository.existsBetween"]:::llamada
  n16 --> n17
  n18[("LEE community.user_blocks")]:::efecto
  n17 --> n18
  n19{"await this.visibility.isBlockedBetween(em, profileId, peer)"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Conversación no encontrada"]):::error
  n19 -->|"sí"| n20
  n21["Llama a ConversationsRepository.findConversationById"]:::llamada
  n19 -->|"no"| n21
  n15 -->|"al terminar"| n21
  n22[("LEE community.conversations")]:::efecto
  n21 --> n22
  n23["Llama a CommunityMessagingReadService.resolvePeerReadUpTo"]:::llamada
  n22 --> n23
  n24["Llama a ConversationsRepository.findParticipants"]:::llamada
  n23 --> n24
  n25[("LEE community.conversation_participants")]:::efecto
  n24 --> n25
  n26["Llama a ConversationsRepository.findMessageById"]:::llamada
  n25 --> n26
  n27[("LEE community.direct_messages")]:::efecto
  n26 --> n27
  n28["Llama a ConversationsRepository.listMessagesPage"]:::llamada
  n27 --> n28
  n29[("LEE community.direct_messages")]:::efecto
  n28 --> n29
  n30["Llama a ConversationsRepository.findMessageById"]:::llamada
  n29 --> n30
  n31[("LEE community.direct_messages")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /community/conversations/{conversationId}/messages

Enviar un mensaje directo en la conversación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: Archivo adjunto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El remitente no es participante activo; PreconditionFailedException: Existe un bloqueo entre los participantes; PreconditionFailedException: No se puede adjuntar un archivo sin un actor que lo autorice; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.sendMessage"]:::llamada
  n2 --> n3
  n4["Llama a CommunityMessagingService.send"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6{"authorizingActor"}:::decision
  n5 --> n6
  n7["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n6 -->|"sí"| n7
  n8["Llama a PublicProfilesRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE community.public_profiles")]:::efecto
  n8 --> n9
  n10(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n9 --> n10
  n11["Llama a ConversationsRepository.findConversationById"]:::llamada
  n6 -->|"no"| n11
  n12[("LEE community.conversations")]:::efecto
  n11 --> n12
  n13{"!conversation"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Conversación no encontrada"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE community.conversation_participants")]:::efecto
  n15 --> n16
  n17{"!sender"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El remitente no es participante activo"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ConversationsRepository.findParticipants"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE community.conversation_participants")]:::efecto
  n19 --> n20
  n21["Repite: por cada const p de participants"]:::bucle
  n20 --> n21
  n22["Llama a BlocksRepository.existsBetween"]:::llamada
  n21 -->|"cada elemento"| n22
  n23[("LEE community.user_blocks")]:::efecto
  n22 --> n23
  n24{"blocked"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED Existe un bloqueo entre los participantes"]):::error
  n24 -->|"sí"| n25
  n26{"dto.attachmentFileId"}:::decision
  n24 -->|"no"| n26
  n21 -->|"al terminar"| n26
  n27{"!authorizingActor"}:::decision
  n26 -->|"sí"| n27
  n28(["422 PRECONDITION_FAILED No se puede adjuntar un archivo sin un actor que lo autorice"]):::error
  n27 -->|"sí"| n28
  n29["Llama a CommunityMessagingService.assertAttachmentCanBeAssociated"]:::llamada
  n27 -->|"no"| n29
  n30["Intenta"]:::intento
  n29 --> n30
  n31["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n30 --> n31
  n32{"!file"}:::decision
  n31 --> n32
  n33(["404 NOT_FOUND {labels.notFound}"]):::error
  n32 -->|"sí"| n33
  n34{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n32 -->|"no"| n34
  n35(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n34 -->|"sí"| n35
  n36{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n34 -->|"no"| n36
  n37(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n36 -->|"sí"| n37
  n38{"!file.currentVersionId"}:::decision
  n36 -->|"no"| n38
  n39(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n38 -->|"sí"| n39
  n40{"!(error instanceof ForbiddenException)"}:::decision
  n30 -->|"si falla"| n40
  n41(["↩ (relanza el error capturado)"]):::error
  n40 -->|"sí"| n41
  n42["Llama a ConversationsRepository.findLiveMessagesByAttachmentFileId"]:::llamada
  n38 -->|"no"| n42
  n40 -->|"no"| n42
  n43[("LEE community.direct_messages")]:::efecto
  n42 --> n43
  n44["Repite: por cada const source de sources"]:::bucle
  n43 --> n44
  n45["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n44 -->|"cada elemento"| n45
  n46[("LEE community.conversation_participants")]:::efecto
  n45 --> n46
  n47["Llama a ConversationsRepository.findParticipants"]:::llamada
  n46 --> n47
  n48[("LEE community.conversation_participants")]:::efecto
  n47 --> n48
  n49["Repite: por cada const sourceParticipant de sourceParticipants"]:::bucle
  n48 --> n49
  n50["Llama a BlocksRepository.existsBetween"]:::llamada
  n49 -->|"cada elemento"| n50
  n51[("LEE community.user_blocks")]:::efecto
  n50 --> n51
  n52["Llama a AttachableFileService.assertUsableForAuthorizedContext"]:::llamada
  n51 --> n52
  n49 -->|"al terminar"| n52
  n53{"!file"}:::decision
  n52 --> n53
  n54(["404 NOT_FOUND {labels.notFound}"]):::error
  n53 -->|"sí"| n54
  n55(["404 NOT_FOUND Archivo adjunto no encontrado"]):::error
  n53 -->|"no"| n55
  n44 -->|"al terminar"| n55
  n56["Llama a ConversationsRepository.createMessage"]:::llamada
  n26 -->|"no"| n56
  n57[("CREA community.direct_messages")]:::efecto
  n56 --> n57
  n58[("ACTUALIZA community.conversations · ACTUALIZA community.conversations")]:::efecto
  n57 --> n58
  n59["Repite: por cada const p de participants"]:::bucle
  n58 --> n59
  n60["Llama a ConversationsRepository.createReceipt"]:::llamada
  n59 -->|"cada elemento"| n60
  n61[("CREA community.message_receipts")]:::efecto
  n60 --> n61
  n62["Llama a CommunityMessageNotificationsService.newMessage"]:::llamada
  n61 --> n62
  n59 -->|"al terminar"| n62
  n63["Intenta"]:::intento
  n62 --> n63
  n64["Llama a PublicProfilesRepository.findById"]:::llamada
  n63 --> n64
  n65[("LEE community.public_profiles")]:::efecto
  n64 --> n65
  n66{"evaluateAutomaticResponse"}:::decision
  n65 --> n66
  n67["Llama a CommunityMessagingService.responderOnly"]:::llamada
  n66 -->|"sí"| n67
  n68["Repite: por cada const recipient de recipients"]:::bucle
  n67 --> n68
  n69["Intenta"]:::intento
  n68 -->|"cada elemento"| n69
  n70["Llama a CommunityChatAutoReplyService.textForResponder"]:::llamada
  n69 --> n70
  n71["… el resto del árbol (3 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. DELETE /community/conversations/{conversationId}/messages/{messageId}

Eliminar un mensaje propio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el autor puede editar o eliminar su mensaje; PreconditionFailedException: El mensaje ya fue eliminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.deleteMessage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a CommunityMessagingService.activeOrNotFoundParticipant"]:::llamada
  n10["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9 --> n10
  n11[("LEE community.conversation_participants")]:::efecto
  n10 --> n11
  n12{"!participant"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Conversación no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CommunityMessagingService.ownLiveMessage"]:::llamada
  n12 -->|"no"| n14
  n15["Llama a ConversationsRepository.findMessageInConversation"]:::llamada
  n14 --> n15
  n16[("LEE community.direct_messages")]:::efecto
  n15 --> n16
  n17{"!message"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"message.senderProfileId !== profileId"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Sólo el autor puede editar o eliminar su mensaje"]):::error
  n19 -->|"sí"| n20
  n21{"message.deletedAt"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El mensaje ya fue eliminado"]):::error
  n21 -->|"sí"| n22
  n23[("ACTUALIZA community.direct_messages")]:::efecto
  n21 -->|"no"| n23
  n24["Llama a ConversationsRepository.findConversationById"]:::llamada
  n23 --> n24
  n25[("LEE community.conversations")]:::efecto
  n24 --> n25
  n26{"conversation?.pinnedMessageId === messageId"}:::decision
  n25 --> n26
  n27[("ACTUALIZA community.conversations")]:::efecto
  n26 -->|"sí"| n27
  n28["Llama a CommunityMessagingService.otherParticipants"]:::llamada
  n27 --> n28
  n26 -->|"no"| n28
  n29["Llama a ConversationsRepository.findParticipants"]:::llamada
  n28 --> n29
  n30[("LEE community.conversation_participants")]:::efecto
  n29 --> n30
  n31(("200 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. PATCH /community/conversations/{conversationId}/messages/{messageId}

Editar el texto de un mensaje propio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el autor puede editar o eliminar su mensaje; PreconditionFailedException: El mensaje ya fue eliminado; PreconditionFailedException: El mensaje no tiene marca de envío: no se puede editar; PreconditionFailedException: Pasaron más de 5 minutos: el mensaje ya no se puede editar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.editMessage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a CommunityMessagingService.activeOrNotFoundParticipant"]:::llamada
  n10["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9 --> n10
  n11[("LEE community.conversation_participants")]:::efecto
  n10 --> n11
  n12{"!participant"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Conversación no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a CommunityMessagingService.ownLiveMessage"]:::llamada
  n12 -->|"no"| n14
  n15["Llama a ConversationsRepository.findMessageInConversation"]:::llamada
  n14 --> n15
  n16[("LEE community.direct_messages")]:::efecto
  n15 --> n16
  n17{"!message"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"message.senderProfileId !== profileId"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED Sólo el autor puede editar o eliminar su mensaje"]):::error
  n19 -->|"sí"| n20
  n21{"message.deletedAt"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El mensaje ya fue eliminado"]):::error
  n21 -->|"sí"| n22
  n23["Llama a CommunityMessagingService.assertEditionWindowInside"]:::llamada
  n21 -->|"no"| n23
  n24{"!sent"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED El mensaje no tiene marca de envío: no se puede editar"]):::error
  n24 -->|"sí"| n25
  n26{"elapsed › EDIT_WINDOW_MS"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED Pasaron más de 5 minutos: el mensaje ya no se puede editar"]):::error
  n26 -->|"sí"| n27
  n28[("ACTUALIZA community.direct_messages · ACTUALIZA community.direct_messages")]:::efecto
  n26 -->|"no"| n28
  n29["Llama a CommunityMessagingService.otherParticipants"]:::llamada
  n28 --> n29
  n30["Llama a ConversationsRepository.findParticipants"]:::llamada
  n29 --> n30
  n31[("LEE community.conversation_participants")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. PATCH /community/conversations/{conversationId}/participant

Marcar la conversación como favorita, fijada o archivada

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.updateParticipant"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a CommunityMessagingService.activeOrNotFoundParticipant"]:::llamada
  n10["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9 --> n10
  n11[("LEE community.conversation_participants")]:::efecto
  n10 --> n11
  n12{"!participant"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Conversación no encontrada"]):::error
  n12 -->|"sí"| n13
  n14(("200 Responde con éxito")):::ok
  n12 -->|"no"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. DELETE /community/conversations/{conversationId}/pin

Soltar el mensaje fijado de la conversación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.unpinMessage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a CommunityMessagingService.activeOrNotFoundParticipant"]:::llamada
  n10["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9 --> n10
  n11[("LEE community.conversation_participants")]:::efecto
  n10 --> n11
  n12{"!participant"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Conversación no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ConversationsRepository.findConversationById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE community.conversations")]:::efecto
  n14 --> n15
  n16{"!conversation"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Conversación no encontrada"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA community.conversations")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a CommunityMessagingService.otherParticipants"]:::llamada
  n18 --> n19
  n20["Llama a ConversationsRepository.findParticipants"]:::llamada
  n19 --> n20
  n21[("LEE community.conversation_participants")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /community/conversations/{conversationId}/pin

Fijar un mensaje de la conversación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.pinMessage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a CommunityMessagingService.activeOrNotFoundParticipant"]:::llamada
  n10["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9 --> n10
  n11[("LEE community.conversation_participants")]:::efecto
  n10 --> n11
  n12{"!participant"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Conversación no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ConversationsRepository.findConversationById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE community.conversations")]:::efecto
  n14 --> n15
  n16{"!conversation"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Conversación no encontrada"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ConversationsRepository.findMessageInConversation"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE community.direct_messages")]:::efecto
  n18 --> n19
  n20{"!message || message.deletedAt"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n20 -->|"sí"| n21
  n22[("ACTUALIZA community.conversations")]:::efecto
  n20 -->|"no"| n22
  n23["Llama a CommunityMessagingService.otherParticipants"]:::llamada
  n22 --> n23
  n24["Llama a ConversationsRepository.findParticipants"]:::llamada
  n23 --> n24
  n25[("LEE community.conversation_participants")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. GET /community/conversations/{conversationId}/presence

Presencia de los demás participantes

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingReadService.conversationPresence"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n9[("LEE community.conversation_participants")]:::efecto
  n8 --> n9
  n10{"!participant"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Conversación no encontrada"]):::error
  n10 -->|"sí"| n11
  n12["Llama a ConversationsRepository.findParticipants"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE community.conversation_participants")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /community/conversations/{conversationId}/read

Marcar mensajes como leídos (recibos)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil no es participante activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingService.markRead"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a ConversationsRepository.findConversationById"]:::llamada
  n10[("LEE community.conversations")]:::efecto
  n9 --> n10
  n11{"!conversation"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Conversación no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ConversationsRepository.findActiveParticipant"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE community.conversation_participants")]:::efecto
  n13 --> n14
  n15{"!participant"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El perfil no es participante activo"]):::error
  n15 -->|"sí"| n16
  n17{"!messageId"}:::decision
  n15 -->|"no"| n17
  n18["Llama a ConversationsRepository.findLastMessage"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE community.direct_messages")]:::efecto
  n18 --> n19
  n20["Llama a ConversationsRepository.createReceipt"]:::llamada
  n19 --> n20
  n17 -->|"no"| n20
  n21[("CREA community.message_receipts")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA community.conversation_participants")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /community/conversations/contacts/search

Buscar personas para iniciar una conversación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityMessagingReadService.searchContacts"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a PublicProfilesRepository.searchChatContacts"]:::llamada
  n9["Transacción: then(…)"]:::transaccion
  n8 --> n9
  n10[("LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. GET /community/feed

Timeline de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityTimelineReadService.getFeed"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a FeedRepository.listPageByOwner"]:::llamada
  n9[("LEE community.feed_items")]:::efecto
  n8 --> n9
  n10["Llama a PostsRepository.listByIds"]:::llamada
  n9 --> n10
  n11[("LEE community.social_posts")]:::efecto
  n10 --> n11
  n12["Llama a CommunityVisibilityService.filterVisiblePosts"]:::llamada
  n11 --> n12
  n13["Llama a BlocksRepository.listBlockedPeers"]:::llamada
  n12 --> n13
  n14[("LEE community.user_blocks")]:::efecto
  n13 --> n14
  n15["Llama a FollowsRepository.listFollowedProfileIds"]:::llamada
  n14 --> n15
  n16[("LEE community.social_follows")]:::efecto
  n15 --> n16
  n17["Llama a CommunityEngagementService.ofPosts"]:::llamada
  n16 --> n17
  n18["Llama a ReactionsRepository.summarizeByTargets"]:::llamada
  n17 --> n18
  n19[("LEE community.reactions")]:::efecto
  n18 --> n19
  n20["Llama a CommentsRepository.countByTargets"]:::llamada
  n19 --> n20
  n21[("LEE community.comments")]:::efecto
  n20 --> n21
  n22["Llama a ReactionsRepository.listByActorTargets"]:::llamada
  n21 --> n22
  n23[("LEE community.reactions")]:::efecto
  n22 --> n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. DELETE /community/follows

Dejar de seguir un objeto social

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.unfollow"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a FollowsRepository.findByFollowerTarget"]:::llamada
  n10[("LEE community.social_follows")]:::efecto
  n9 --> n10
  n11[("ACTUALIZA community.social_follows")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. GET /community/follows

Seguimientos activos de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.listFollows"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a FollowsRepository.listByFollowerPage"]:::llamada
  n9[("LEE community.social_follows")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 25. POST /community/follows

Seguir un objeto social

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: Ya sigue este objeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede seguir a uno mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.follow"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9{"dto.followableType === 'PROFILE' && dto.followableRefId === dto.followerProfileId"}:::decision
  n10(["422 PRECONDITION_FAILED No se puede seguir a uno mismo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a FollowsRepository.findByFollowerTarget"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE community.social_follows")]:::efecto
  n11 --> n12
  n13{"dup && dup.statusConceptId === CONCEPTS.STATE_ACTIVE"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya sigue este objeto"]):::error
  n13 -->|"sí"| n14
  n15{"dup"}:::decision
  n13 -->|"no"| n15
  n16[("ACTUALIZA community.social_follows")]:::efecto
  n15 -->|"sí"| n16
  n17["Llama a FollowsRepository.create"]:::llamada
  n16 --> n17
  n15 -->|"no"| n17
  n18[("CREA community.social_follows")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. GET /community/groups

Grupos de una organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsReadService.listGroups"]:::llamada
  n2 --> n3
  n4["Llama a CommunityGroupAudienceService.hiddenFrom"]:::llamada
  n3 --> n4
  n5["Repite: por cada const visibility de AUDIENCE_VISIBILITIES"]:::bucle
  n4 --> n5
  n6["Llama a CommunityGroupAudienceService.isEligible"]:::llamada
  n5 -->|"cada elemento"| n6
  n7{"según visibilityConceptId"}:::decision
  n6 --> n7
  n8["Llama a GroupsRepository.isActiveTenantMember"]:::llamada
  n7 -->|"COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF"| n8
  n9[("LEE directory.tenant_memberships")]:::efecto
  n8 --> n9
  n10["Llama a GroupsRepository.hasFinishedEncounter"]:::llamada
  n7 -->|"COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS"| n10
  n11[("LEE clinical.encounters")]:::efecto
  n10 --> n11
  n12["Llama a GroupsRepository.searchPage"]:::llamada
  n9 --> n12
  n11 --> n12
  n7 -->|"otro"| n12
  n5 -->|"al terminar"| n12
  n13[("LEE community.groups")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 27. POST /community/groups

Crear un grupo/comunidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; InsufficientRoleException: Para abrir un foro con este público hay que pertenecer a él |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tema no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya hay un grupo con ese slug |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para crear un grupo necesita su perfil público configurado; PreconditionFailedException: Para crear un grupo público necesita su perfil público configurado; PreconditionFailedException: Para crear un grupo público, su perfil público tiene que estar completo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsService.createGroup"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityGroupAccessService.assertOrganizationMayStartForums"]:::llamada
  n4 --> n5
  n6["Llama a GroupsRepository.findTenantTypeConceptId"]:::llamada
  n5 --> n6
  n7[("LEE directory.tenants")]:::efecto
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 --> n8
  n9["Llama a GroupsRepository.findBySlug"]:::llamada
  n10[("LEE community.groups")]:::efecto
  n9 --> n10
  n11{"duplicate"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya hay un grupo con ese slug"]):::error
  n11 -->|"sí"| n12
  n13{"dto.topicId"}:::decision
  n11 -->|"no"| n13
  n14["Llama a GroupsRepository.findTopicById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE community.topics")]:::efecto
  n14 --> n15
  n16{"!topic"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Tema no encontrado"]):::error
  n16 -->|"sí"| n17
  n18["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n16 -->|"no"| n18
  n13 -->|"no"| n18
  n19{"requested"}:::decision
  n18 --> n19
  n20["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a PublicProfilesRepository.findById"]:::llamada
  n20 --> n21
  n22[("LEE community.public_profiles")]:::efecto
  n21 --> n22
  n23(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n22 --> n23
  n24["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n19 -->|"no"| n24
  n25["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n24 -->|"cada elemento"| n25
  n26[("LEE community.public_profiles")]:::efecto
  n25 --> n26
  n27{"!ownerProfileId"}:::decision
  n26 --> n27
  n24 -->|"al terminar"| n27
  n28(["422 PRECONDITION_FAILED Para crear un grupo necesita su perfil público configurado"]):::error
  n27 -->|"sí"| n28
  n29{"isPublicVisibility(dto.visibility)"}:::decision
  n27 -->|"no"| n29
  n30["Llama a CommunityGroupsService.assertPublicCompleteProfile"]:::llamada
  n29 -->|"sí"| n30
  n31["Llama a PublicProfilesRepository.findById"]:::llamada
  n30 --> n31
  n32[("LEE community.public_profiles")]:::efecto
  n31 --> n32
  n33{"!profile"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED Para crear un grupo público necesita su perfil público configurado"]):::error
  n33 -->|"sí"| n34
  n35{"missing.length › 0"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED Para crear un grupo público, su perfil público tiene que estar completo"]):::error
  n35 -->|"sí"| n36
  n37["Llama a CommunityGroupAccessService.assertActorBelongsToAudience"]:::llamada
  n35 -->|"no"| n37
  n29 -->|"no"| n37
  n38["Llama a CommunityGroupAudienceService.isEligible"]:::llamada
  n37 --> n38
  n39{"según visibilityConceptId"}:::decision
  n38 --> n39
  n40["Llama a GroupsRepository.isActiveTenantMember"]:::llamada
  n39 -->|"COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF"| n40
  n41[("LEE directory.tenant_memberships")]:::efecto
  n40 --> n41
  n42["Llama a GroupsRepository.hasFinishedEncounter"]:::llamada
  n39 -->|"COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS"| n42
  n43[("LEE clinical.encounters")]:::efecto
  n42 --> n43
  n44(["403 FORBIDDEN Para abrir un foro con este público hay que pertenecer a él"]):::error
  n41 --> n44
  n43 --> n44
  n39 -->|"otro"| n44
  n45["Llama a GroupsRepository.create"]:::llamada
  n46[("CREA community.groups")]:::efecto
  n45 --> n46
  n47["Llama a GroupsRepository.createMember"]:::llamada
  n46 --> n47
  n48[("CREA community.group_members")]:::efecto
  n47 --> n48
  n49(("201 Responde con éxito")):::ok
  n48 --> n49
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 28. GET /community/groups/{groupId}

Ficha de un grupo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsReadService.getGroup"]:::llamada
  n2 --> n3
  n4["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n3 --> n4
  n5["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n4 --> n5
  n6{"requested"}:::decision
  n5 --> n6
  n7["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n6 -->|"sí"| n7
  n8(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n7 --> n8
  n9["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n6 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12["Llama a GroupsRepository.findById"]:::llamada
  n11 --> n12
  n9 -->|"al terminar"| n12
  n13[("LEE community.groups")]:::efecto
  n12 --> n13
  n14{"!group"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Grupo no encontrado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a GroupsRepository.findMember"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE community.group_members")]:::efecto
  n16 --> n17
  n18["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND Grupo no encontrado"]):::error
  n18 --> n19
  n20{"isSecret && !isMember && !isPlatform"}:::decision
  n21(["404 NOT_FOUND Grupo no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n20 -->|"no"| n22
  n23(["404 NOT_FOUND Grupo no encontrado"]):::error
  n22 -->|"sí"| n23
  n24["Llama a GroupsRepository.countMembersByStatus"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE community.group_members")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 29. GET /community/groups/{groupId}/members

Integrantes de un grupo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsReadService.listMembers"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n3 --> n4
  n5{"requested"}:::decision
  n4 --> n5
  n6["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PublicProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE community.public_profiles")]:::efecto
  n7 --> n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n5 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a GroupsRepository.findById"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14[("LEE community.groups")]:::efecto
  n13 --> n14
  n15{"!group"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Grupo no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n15 -->|"no"| n17
  n18["Llama a CommunityGroupAudienceService.isEligible"]:::llamada
  n17 --> n18
  n19{"según visibilityConceptId"}:::decision
  n18 --> n19
  n20["Llama a GroupsRepository.isActiveTenantMember"]:::llamada
  n19 -->|"COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF"| n20
  n21[("LEE directory.tenant_memberships")]:::efecto
  n20 --> n21
  n22["Llama a GroupsRepository.hasFinishedEncounter"]:::llamada
  n19 -->|"COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS"| n22
  n23[("LEE clinical.encounters")]:::efecto
  n22 --> n23
  n24(["404 NOT_FOUND Grupo no encontrado"]):::error
  n21 --> n24
  n23 --> n24
  n19 -->|"otro"| n24
  n25{"group.visibilityConceptId === COMM.GROUP_VISIBILITY_SECRET"}:::decision
  n26["Llama a GroupsRepository.findMember"]:::llamada
  n25 -->|"sí"| n26
  n27[("LEE community.group_members")]:::efecto
  n26 --> n27
  n28{"!member || member.joinStatusConceptId !== COMM.GROUP_JOIN_ACTIVE"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND Grupo no encontrado"]):::error
  n28 -->|"sí"| n29
  n30["Llama a GroupsRepository.listMembers"]:::llamada
  n28 -->|"no"| n30
  n25 -->|"no"| n30
  n31[("LEE community.group_members")]:::efecto
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 30. POST /community/groups/{groupId}/members

Unirse a un grupo / comunidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 409 | `CONFLICT` | ConflictException: El perfil ya es miembro del grupo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsService.joinGroup"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a GroupsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.groups")]:::efecto
  n5 --> n6
  n7{"!group"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Grupo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"audienceGroup"}:::decision
  n7 -->|"no"| n9
  n10["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n10 --> n11
  n12{"requested"}:::decision
  n11 --> n12
  n13["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n12 -->|"sí"| n13
  n14(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n13 --> n14
  n15["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n12 -->|"no"| n15
  n16["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("LEE community.public_profiles")]:::efecto
  n16 --> n17
  n18["Llama a GroupsRepository.findById"]:::llamada
  n17 --> n18
  n15 -->|"al terminar"| n18
  n19[("LEE community.groups")]:::efecto
  n18 --> n19
  n20{"!group"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Grupo no encontrado"]):::error
  n20 -->|"sí"| n21
  n22["Llama a GroupsRepository.findMember"]:::llamada
  n20 -->|"no"| n22
  n23[("LEE community.group_members")]:::efecto
  n22 --> n23
  n24["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n23 --> n24
  n25(["404 NOT_FOUND Grupo no encontrado"]):::error
  n24 --> n25
  n26{"isSecret && !isMember && !isPlatform"}:::decision
  n27(["404 NOT_FOUND Grupo no encontrado"]):::error
  n26 -->|"sí"| n27
  n28{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n26 -->|"no"| n28
  n29(["404 NOT_FOUND Grupo no encontrado"]):::error
  n28 -->|"sí"| n29
  n30["Llama a GroupsRepository.findMember"]:::llamada
  n28 -->|"no"| n30
  n9 -->|"no"| n30
  n31[("LEE community.group_members")]:::efecto
  n30 --> n31
  n32{"dup && this.isLiveMembership(dup)"}:::decision
  n31 --> n32
  n33(["409 CONFLICT El perfil ya es miembro del grupo"]):::error
  n32 -->|"sí"| n33
  n34{"dup"}:::decision
  n32 -->|"no"| n34
  n35[("ACTUALIZA community.group_members · ACTUALIZA community.group_members · ACTUALIZA community.group_members · A…")]:::efecto
  n34 -->|"sí"| n35
  n36["Llama a GroupsRepository.createMember"]:::llamada
  n34 -->|"no"| n36
  n37[("CREA community.group_members")]:::efecto
  n36 --> n37
  n38{"isPublic"}:::decision
  n35 --> n38
  n37 --> n38
  n39[("ACTUALIZA community.groups")]:::efecto
  n38 -->|"sí"| n39
  n40(("201 Responde con éxito")):::ok
  n39 --> n40
  n38 -->|"no"| n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 31. DELETE /community/groups/{groupId}/members/{member}

Salir del grupo o dar de baja a un integrante

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Sólo quien administra el grupo puede resolver sus membresías |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: El perfil no es del grupo |
| 409 | `CONFLICT` | ConflictException: Al dueño del grupo no lo puede sacar otro: sólo él puede irse, o transferir el grupo antes |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsService.leaveGroup"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n4 --> n5
  n6["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n5 --> n6
  n7{"requested"}:::decision
  n6 --> n7
  n8["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n7 -->|"sí"| n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n7 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a GroupsRepository.findById"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14[("LEE community.groups")]:::efecto
  n13 --> n14
  n15{"!group"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Grupo no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a GroupsRepository.findMember"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE community.group_members")]:::efecto
  n17 --> n18
  n19["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n18 --> n19
  n20(["404 NOT_FOUND Grupo no encontrado"]):::error
  n19 --> n20
  n21{"isSecret && !isMember && !isPlatform"}:::decision
  n22(["404 NOT_FOUND Grupo no encontrado"]):::error
  n21 -->|"sí"| n22
  n23{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n21 -->|"no"| n23
  n24(["404 NOT_FOUND Grupo no encontrado"]):::error
  n23 -->|"sí"| n24
  n25["Llama a CommunityGroupAccessService.assertCanAdminister"]:::llamada
  n23 -->|"no"| n25
  n26(["403 FORBIDDEN Sólo quien administra el grupo puede resolver sus membresías"]):::error
  n25 --> n26
  n27{"!isSelf"}:::decision
  n28["Llama a CommunityGroupAccessService.assertCanAdminister"]:::llamada
  n27 -->|"sí"| n28
  n29(["403 FORBIDDEN Sólo quien administra el grupo puede resolver sus membresías"]):::error
  n28 --> n29
  n30["Llama a GroupsRepository.findByIdForUpdate"]:::llamada
  n27 -->|"no"| n30
  n31[("LEE community.groups")]:::efecto
  n30 --> n31
  n32{"!group"}:::decision
  n31 --> n32
  n33(["404 NOT_FOUND Grupo no encontrado"]):::error
  n32 -->|"sí"| n33
  n34["Llama a GroupsRepository.findMember"]:::llamada
  n32 -->|"no"| n34
  n35[("LEE community.group_members")]:::efecto
  n34 --> n35
  n36{"!member"}:::decision
  n35 --> n36
  n37(["404 NOT_FOUND El perfil no es del grupo"]):::error
  n36 -->|"sí"| n37
  n38{"wasOwner && !isSelf"}:::decision
  n36 -->|"no"| n38
  n39(["409 CONFLICT Al dueño del grupo no lo puede sacar otro: sólo él puede irse, o transferir el grupo antes"]):::error
  n38 -->|"sí"| n39
  n40[("ACTUALIZA community.group_members")]:::efecto
  n38 -->|"no"| n40
  n41["Llama a GroupsRepository.countMembersByStatus"]:::llamada
  n40 --> n41
  n42[("LEE community.group_members")]:::efecto
  n41 --> n42
  n43[("ACTUALIZA community.groups")]:::efecto
  n42 --> n43
  n44{"remain === 0"}:::decision
  n43 --> n44
  n45[("ACTUALIZA community.groups")]:::efecto
  n44 -->|"sí"| n45
  n46{"wasOwner && wasActive"}:::decision
  n44 -->|"no"| n46
  n47["Llama a CommunityGroupsService.chooseHeir"]:::llamada
  n46 -->|"sí"| n47
  n48["Llama a GroupsRepository.listActiveMembersByAge"]:::llamada
  n47 --> n48
  n49[("LEE community.group_members")]:::efecto
  n48 --> n49
  n50{"heir"}:::decision
  n49 --> n50
  n51[("ACTUALIZA community.group_members · ACTUALIZA community.groups")]:::efecto
  n50 -->|"sí"| n51
  n52(("200 Responde con éxito")):::ok
  n45 --> n52
  n51 --> n52
  n50 -->|"no"| n52
  n46 -->|"no"| n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 32. PATCH /community/groups/{groupId}/members/{member}

Aprobar/rechazar un alta o cambiar el rol

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Sólo quien administra el grupo puede resolver sus membresías |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: Membresía no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que indicar una decisión o un rol; PreconditionFailedException: La solicitud de ingreso ya estaba resuelta; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupsService.updateMember"]:::llamada
  n2 --> n3
  n4{"!dto.decision && !dto.role"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Hay que indicar una decisión o un rol"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n6 --> n7
  n8["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n7 --> n8
  n9{"requested"}:::decision
  n8 --> n9
  n10["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n9 -->|"sí"| n10
  n11(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n10 --> n11
  n12["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n9 -->|"no"| n12
  n13["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("LEE community.public_profiles")]:::efecto
  n13 --> n14
  n15["Llama a GroupsRepository.findById"]:::llamada
  n14 --> n15
  n12 -->|"al terminar"| n15
  n16[("LEE community.groups")]:::efecto
  n15 --> n16
  n17{"!group"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Grupo no encontrado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a GroupsRepository.findMember"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE community.group_members")]:::efecto
  n19 --> n20
  n21["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n20 --> n21
  n22(["404 NOT_FOUND Grupo no encontrado"]):::error
  n21 --> n22
  n23{"isSecret && !isMember && !isPlatform"}:::decision
  n24(["404 NOT_FOUND Grupo no encontrado"]):::error
  n23 -->|"sí"| n24
  n25{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n23 -->|"no"| n25
  n26(["404 NOT_FOUND Grupo no encontrado"]):::error
  n25 -->|"sí"| n26
  n27["Llama a CommunityGroupAccessService.assertCanAdminister"]:::llamada
  n25 -->|"no"| n27
  n28(["403 FORBIDDEN Sólo quien administra el grupo puede resolver sus membresías"]):::error
  n27 --> n28
  n29["Llama a GroupsRepository.findMemberById"]:::llamada
  n30[("LEE community.group_members")]:::efecto
  n29 --> n30
  n31{"!member"}:::decision
  n30 --> n31
  n32(["404 NOT_FOUND Membresía no encontrada"]):::error
  n31 -->|"sí"| n32
  n33{"dto.decision"}:::decision
  n31 -->|"no"| n33
  n34{"member.joinStatusConceptId !== COMM.GROUP_JOIN_PENDING"}:::decision
  n33 -->|"sí"| n34
  n35(["422 PRECONDITION_FAILED La solicitud de ingreso ya estaba resuelta"]):::error
  n34 -->|"sí"| n35
  n36{"dto.decision === 'APPROVE'"}:::decision
  n34 -->|"no"| n36
  n37[("ACTUALIZA community.group_members · ACTUALIZA community.group_members")]:::efecto
  n36 -->|"sí"| n37
  n38[("ACTUALIZA community.group_members")]:::efecto
  n36 -->|"no"| n38
  n39{"dto.role"}:::decision
  n37 --> n39
  n38 --> n39
  n33 -->|"no"| n39
  n40[("ACTUALIZA community.group_members")]:::efecto
  n39 -->|"sí"| n40
  n41{"approved"}:::decision
  n40 --> n41
  n39 -->|"no"| n41
  n42["Llama a CommunityGroupNotificationsService.notifyJoinApproved"]:::llamada
  n41 -->|"sí"| n42
  n43["Transacción: safely(…)"]:::transaccion
  n42 --> n43
  n44["Llama a PublicProfilesRepository.listByIds"]:::llamada
  n43 --> n44
  n45[("LEE community.public_profiles")]:::efecto
  n44 --> n45
  n46["Llama a CommunityGroupNotificationsService.emit"]:::llamada
  n45 --> n46
  n47["Llama a NotificationsService.createRequest"]:::llamada
  n46 --> n47
  n48{"!recipientUserId"}:::decision
  n47 --> n48
  n49(["422 PRECONDITION_FAILED La notificación a una dirección externa también necesita el usuario destinatario / La…"]):::error
  n48 -->|"sí"| n49
  n50["Transacción: transactional(…)"]:::transaccion
  n48 -->|"no"| n50
  n51{"!channel"}:::decision
  n50 --> n51
  n52(["404 NOT_FOUND Canal no encontrado"]):::error
  n51 -->|"sí"| n52
  n53{"channel.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n51 -->|"no"| n53
  n54(["422 PRECONDITION_FAILED El canal no está activo"]):::error
  n53 -->|"sí"| n54
  n55{"dto.templateId"}:::decision
  n53 -->|"no"| n55
  n56{"!template"}:::decision
  n55 -->|"sí"| n56
  n57(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n56 -->|"sí"| n57
  n58{"template.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n56 -->|"no"| n58
  n59(["422 PRECONDITION_FAILED La plantilla no está publicada"]):::error
  n58 -->|"sí"| n59
  n60{"template.channelId !== dto.channelId"}:::decision
  n58 -->|"no"| n60
  n61(["422 PRECONDITION_FAILED La plantilla es de otro canal"]):::error
  n60 -->|"sí"| n61
  n62(("200 Responde con éxito")):::ok
  n60 -->|"no"| n62
  n55 -->|"no"| n62
  n41 -->|"no"| n62
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 33. GET /community/groups/{groupId}/posts

Muro de un grupo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Hay que ser integrante del grupo para ver su contenido |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupWallService.listWall"]:::llamada
  n2 --> n3
  n4["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n3 --> n4
  n5["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n4 --> n5
  n6{"requested"}:::decision
  n5 --> n6
  n7["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n6 -->|"sí"| n7
  n8(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n7 --> n8
  n9["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n6 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12["Llama a GroupsRepository.findById"]:::llamada
  n11 --> n12
  n9 -->|"al terminar"| n12
  n13[("LEE community.groups")]:::efecto
  n12 --> n13
  n14{"!group"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Grupo no encontrado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a GroupsRepository.findMember"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE community.group_members")]:::efecto
  n16 --> n17
  n18["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND Grupo no encontrado"]):::error
  n18 --> n19
  n20{"isSecret && !isMember && !isPlatform"}:::decision
  n21(["404 NOT_FOUND Grupo no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n20 -->|"no"| n22
  n23(["404 NOT_FOUND Grupo no encontrado"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CommunityGroupAccessService.assertCanRead"]:::llamada
  n22 -->|"no"| n24
  n25(["403 FORBIDDEN Hay que ser integrante del grupo para ver su contenido"]):::error
  n24 --> n25
  n26["Llama a CommentsRepository.listRootsPage"]:::llamada
  n27[("LEE community.comments")]:::efecto
  n26 --> n27
  n28["Llama a CommentsRepository.listRepliesOf"]:::llamada
  n27 --> n28
  n29[("LEE community.comments")]:::efecto
  n28 --> n29
  n30(("200 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 34. POST /community/groups/{groupId}/posts

Publicar en el muro del grupo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Hay que ser integrante del grupo para publicar en su muro |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: La publicación a la que responde no es de este grupo; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityGroupWallService.createPost"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityGroupAccessService.resolve"]:::llamada
  n4 --> n5
  n6["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n5 --> n6
  n7{"requested"}:::decision
  n6 --> n7
  n8["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n7 -->|"sí"| n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n7 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a GroupsRepository.findById"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14[("LEE community.groups")]:::efecto
  n13 --> n14
  n15{"!group"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Grupo no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a GroupsRepository.findMember"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE community.group_members")]:::efecto
  n17 --> n18
  n19["Llama a CommunityGroupAccessService.assertAudienceVisible"]:::llamada
  n18 --> n19
  n20(["404 NOT_FOUND Grupo no encontrado"]):::error
  n19 --> n20
  n21{"isSecret && !isMember && !isPlatform"}:::decision
  n22(["404 NOT_FOUND Grupo no encontrado"]):::error
  n21 -->|"sí"| n22
  n23{"group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform"}:::decision
  n21 -->|"no"| n23
  n24(["404 NOT_FOUND Grupo no encontrado"]):::error
  n23 -->|"sí"| n24
  n25["Llama a CommunityGroupAccessService.assertCanPost"]:::llamada
  n23 -->|"no"| n25
  n26(["403 FORBIDDEN Hay que ser integrante del grupo para publicar en su muro"]):::error
  n25 --> n26
  n27{"!dto.parentCommentId"}:::decision
  n28["Llama a CommunityGroupAccessService.assertOrganizationMayStartForums"]:::llamada
  n27 -->|"sí"| n28
  n29["Llama a GroupsRepository.findTenantTypeConceptId"]:::llamada
  n28 --> n29
  n30[("LEE directory.tenants")]:::efecto
  n29 --> n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 --> n31
  n32["Llama a PublicProfilesRepository.findById"]:::llamada
  n27 -->|"no"| n32
  n33[("LEE community.public_profiles")]:::efecto
  n32 --> n33
  n34{"!author"}:::decision
  n33 --> n34
  n35(["404 NOT_FOUND Perfil autor no encontrado"]):::error
  n34 -->|"sí"| n35
  n36{"dto.parentCommentId"}:::decision
  n34 -->|"no"| n36
  n37["Llama a CommentsRepository.findById"]:::llamada
  n36 -->|"sí"| n37
  n38[("LEE community.comments")]:::efecto
  n37 --> n38
  n39{"!parent || parent.commentableTypeConceptId !== COMM.CONTENT_TYPE_GROUP || parent.commentableRefId !== groupId"}:::decision
  n38 --> n39
  n40(["404 NOT_FOUND La publicación a la que responde no es de este grupo"]):::error
  n39 -->|"sí"| n40
  n41[("ACTUALIZA community.comments")]:::efecto
  n39 -->|"no"| n41
  n42["Llama a CommentsRepository.create"]:::llamada
  n41 --> n42
  n36 -->|"no"| n42
  n43[("CREA community.comments")]:::efecto
  n42 --> n43
  n44{"announce"}:::decision
  n43 --> n44
  n45["Llama a CommunityGroupNotificationsService.notifyNewPost"]:::llamada
  n44 -->|"sí"| n45
  n46["Transacción: safely(…)"]:::transaccion
  n45 --> n46
  n47["Llama a GroupsRepository.listActiveMemberProfileIds"]:::llamada
  n46 --> n47
  n48[("LEE community.group_members")]:::efecto
  n47 --> n48
  n49["Llama a PublicProfilesRepository.listByIds"]:::llamada
  n48 --> n49
  n50[("LEE community.public_profiles")]:::efecto
  n49 --> n50
  n51["Repite: por cada const recipientUserId de new Set(recipients)"]:::bucle
  n50 --> n51
  n52["Llama a CommunityGroupNotificationsService.emit"]:::llamada
  n51 -->|"cada elemento"| n52
  n53["Llama a NotificationsService.createRequest"]:::llamada
  n52 --> n53
  n54{"!recipientUserId"}:::decision
  n53 --> n54
  n55(["422 PRECONDITION_FAILED La notificación a una dirección externa también necesita el usuario destinatario / La…"]):::error
  n54 -->|"sí"| n55
  n56["Transacción: transactional(…)"]:::transaccion
  n54 -->|"no"| n56
  n57{"!channel"}:::decision
  n56 --> n57
  n58(["404 NOT_FOUND Canal no encontrado"]):::error
  n57 -->|"sí"| n58
  n59{"channel.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n57 -->|"no"| n59
  n60(["422 PRECONDITION_FAILED El canal no está activo"]):::error
  n59 -->|"sí"| n60
  n61{"dto.templateId"}:::decision
  n59 -->|"no"| n61
  n62{"!template"}:::decision
  n61 -->|"sí"| n62
  n63(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n62 -->|"sí"| n63
  n64{"template.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n62 -->|"no"| n64
  n65(["422 PRECONDITION_FAILED La plantilla no está publicada"]):::error
  n64 -->|"sí"| n65
  n66{"template.channelId !== dto.channelId"}:::decision
  n64 -->|"no"| n66
  n67(["422 PRECONDITION_FAILED La plantilla es de otro canal"]):::error
  n66 -->|"sí"| n67
  n68(("201 Responde con éxito")):::ok
  n66 -->|"no"| n68
  n61 -->|"no"| n68
  n51 -->|"al terminar"| n68
  n44 -->|"no"| n68
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 35. POST /community/moderation/appeals/{appealId}/resolve

Resolver una apelación de moderación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Apelación no encontrada |
| 409 | `CONFLICT` | ConflictException: La apelación ya está resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityModerationService.resolveAppeal"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ModerationRepository.findAppealById"]:::llamada
  n4 --> n5
  n6[("LEE community.moderation_appeals")]:::efecto
  n5 --> n6
  n7{"!appeal"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Apelación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"appeal.statusConceptId !== COMM.APPEAL_OPEN"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La apelación ya está resuelta"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA community.moderation_appeals · ACTUALIZA community.moderation_appeals · ACTUALIZA community.moderat…")]:::efecto
  n9 -->|"no"| n11
  n12["Llama a ModerationRepository.findDecisionById"]:::llamada
  n11 --> n12
  n13[("LEE community.moderation_decisions")]:::efecto
  n12 --> n13
  n14["Llama a ModerationRepository.findQueueById"]:::llamada
  n13 --> n14
  n15[("LEE community.moderation_queue")]:::efecto
  n14 --> n15
  n16{"original"}:::decision
  n15 --> n16
  n17["Llama a ModerationRepository.findOpenQueueForContent"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE community.moderation_queue")]:::efecto
  n17 --> n18
  n19{"requeued"}:::decision
  n18 --> n19
  n20[("ACTUALIZA community.moderation_queue")]:::efecto
  n19 -->|"sí"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"no"| n21
  n16 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 36. POST /community/moderation/decisions/{decisionId}/appeal

Apelar una decisión de moderación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: Sólo el sancionado por esta decisión puede apelarla |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Decisión no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una apelación abierta para esta decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityModerationService.appeal"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a ModerationRepository.findDecisionById"]:::llamada
  n10[("LEE community.moderation_decisions")]:::efecto
  n9 --> n10
  n11{"!decision"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Decisión no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ModerationRepository.findStrikeByDecisionAndSubject"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE community.moderation_strikes")]:::efecto
  n13 --> n14
  n15{"!strike"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN Sólo el sancionado por esta decisión puede apelarla"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ModerationRepository.findOpenAppealForDecision"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE community.moderation_appeals")]:::efecto
  n17 --> n18
  n19{"open"}:::decision
  n18 --> n19
  n20(["409 CONFLICT Ya existe una apelación abierta para esta decisión"]):::error
  n19 -->|"sí"| n20
  n21["Llama a ModerationRepository.createAppeal"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA community.moderation_appeals")]:::efecto
  n21 --> n22
  n23["Llama a ModerationRepository.findQueueById"]:::llamada
  n22 --> n23
  n24[("LEE community.moderation_queue")]:::efecto
  n23 --> n24
  n25{"queue"}:::decision
  n24 --> n25
  n26["Llama a ModerationRepository.createQueue"]:::llamada
  n25 -->|"sí"| n26
  n27[("CREA community.moderation_queue")]:::efecto
  n26 --> n27
  n28(("201 Responde con éxito")):::ok
  n27 --> n28
  n25 -->|"no"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 37. GET /community/moderation/decisions/mine

Mis propias decisiones de moderación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityModerationReadService.listMyDecisions"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a ModerationRepository.listStrikesBySubject"]:::llamada
  n9[("LEE community.moderation_strikes")]:::efecto
  n8 --> n9
  n10["Llama a ModerationRepository.listDecisionsByIds"]:::llamada
  n9 --> n10
  n11[("LEE community.moderation_decisions")]:::efecto
  n10 --> n11
  n12["Llama a ModerationRepository.findOpenAppealForDecision"]:::llamada
  n11 --> n12
  n13[("LEE community.moderation_appeals")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 38. POST /community/moderation/queue/{queueId}/decision

Resolver moderación (decisión + strike)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entrada de cola no encontrada |
| 409 | `CONFLICT` | ConflictException: La entrada de cola ya está resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityModerationService.decide"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ModerationRepository.findQueueById"]:::llamada
  n4 --> n5
  n6[("LEE community.moderation_queue")]:::efecto
  n5 --> n6
  n7{"!queue"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Entrada de cola no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"queue.statusConceptId === COMM.QUEUE_RESOLVED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La entrada de cola ya está resuelta"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ModerationRepository.createDecision"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA community.moderation_decisions")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA community.moderation_queue")]:::efecto
  n12 --> n13
  n14["Llama a ModerationRepository.findReportsByTarget"]:::llamada
  n13 --> n14
  n15[("LEE community.content_reports")]:::efecto
  n14 --> n15
  n16["Repite: por cada const r de reports"]:::bucle
  n15 --> n16
  n17[("ACTUALIZA community.content_reports · ACTUALIZA community.content_reports · ACTUALIZA community.content_repor…")]:::efecto
  n16 -->|"cada elemento"| n17
  n18{"dto.subjectProfileId && dto.strikeSeverity && dto.decision !== 'DISMISSED'"}:::decision
  n17 --> n18
  n16 -->|"al terminar"| n18
  n19["Llama a ModerationRepository.createStrike"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA community.moderation_strikes")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 39. GET /community/notifications

Notificaciones sociales de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityTimelineReadService.listNotifications"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n6 --> n7
  n8["Llama a NotificationsRepository.listByRecipientPage"]:::llamada
  n9[("LEE community.social_notifications")]:::efecto
  n8 --> n9
  n10["Llama a NotificationsRepository.countUnread"]:::llamada
  n9 --> n10
  n11[("LEE community.social_notifications")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 40. GET /community/polls/{pollId}

Encuesta con opciones, recuentos y voto propio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPollsReadService.getPoll"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n3 --> n4
  n5{"requested"}:::decision
  n4 --> n5
  n6["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PublicProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE community.public_profiles")]:::efecto
  n7 --> n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n5 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a PollsRepository.findPollById"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14[("LEE community.polls")]:::efecto
  n13 --> n14
  n15{"!poll"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Encuesta no encontrada"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PostsRepository.findById"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a CommunityVisibilityService.canViewPost"]:::llamada
  n18 --> n19
  n20["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n19 --> n20
  n21["Llama a BlocksRepository.existsBetween"]:::llamada
  n20 --> n21
  n22[("LEE community.user_blocks")]:::efecto
  n21 --> n22
  n23{"según post.visibilityConceptId"}:::decision
  n22 --> n23
  n24["Llama a CommunityVisibilityService.followsProfile"]:::llamada
  n23 -->|"COMM.POST_VISIBILITY_FOLLOWERS"| n24
  n25["Llama a FollowsRepository.findByFollowerTarget"]:::llamada
  n24 --> n25
  n26[("LEE community.social_follows")]:::efecto
  n25 --> n26
  n27{"!post || !(await this.visibility.canViewPost(em, post, actorProfileId))"}:::decision
  n26 --> n27
  n23 -->|"otro"| n27
  n28(["404 NOT_FOUND Encuesta no encontrada"]):::error
  n27 -->|"sí"| n28
  n29["Llama a PollsRepository.listOptions"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE community.poll_options")]:::efecto
  n29 --> n30
  n31["Llama a PollsRepository.countVotesByOption"]:::llamada
  n30 --> n31
  n32[("LEE community.poll_votes")]:::efecto
  n31 --> n32
  n33["Llama a PollsRepository.listVotedOptionIds"]:::llamada
  n32 --> n33
  n34[("LEE community.poll_votes")]:::efecto
  n33 --> n34
  n35(("200 Responde con éxito")):::ok
  n34 --> n35
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 41. POST /community/polls/{pollId}/votes

Votar en una encuesta

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada; ResourceNotFoundException: La opción no pertenece a la encuesta |
| 409 | `CONFLICT` | ConflictException: Ya votó por esta opción; ConflictException: La encuesta admite un único voto por votante |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La encuesta está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPollsService.vote"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a PollsRepository.findPollById"]:::llamada
  n10[("LEE community.polls")]:::efecto
  n9 --> n10
  n11{"!poll"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Encuesta no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PostsRepository.findById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE community.social_posts")]:::efecto
  n13 --> n14
  n15["Llama a CommunityVisibilityService.canViewPost"]:::llamada
  n14 --> n15
  n16["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n15 --> n16
  n17["Llama a BlocksRepository.existsBetween"]:::llamada
  n16 --> n17
  n18[("LEE community.user_blocks")]:::efecto
  n17 --> n18
  n19{"según post.visibilityConceptId"}:::decision
  n18 --> n19
  n20["Llama a CommunityVisibilityService.followsProfile"]:::llamada
  n19 -->|"COMM.POST_VISIBILITY_FOLLOWERS"| n20
  n21["Llama a FollowsRepository.findByFollowerTarget"]:::llamada
  n20 --> n21
  n22[("LEE community.social_follows")]:::efecto
  n21 --> n22
  n23{"!post || !(await this.visibility.canViewPost(tx, post, dto.voterProfileId))"}:::decision
  n22 --> n23
  n19 -->|"otro"| n23
  n24(["404 NOT_FOUND Encuesta no encontrada"]):::error
  n23 -->|"sí"| n24
  n25{"poll.statusConceptId !== COMM.POLL_OPEN || (poll.closesAt && poll.closesAt.getTime() ‹= Date.now())"}:::decision
  n23 -->|"no"| n25
  n26(["422 PRECONDITION_FAILED La encuesta está cerrada"]):::error
  n25 -->|"sí"| n26
  n27["Llama a PollsRepository.findOptionById"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE community.poll_options")]:::efecto
  n27 --> n28
  n29{"!option || option.pollId !== pollId"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND La opción no pertenece a la encuesta"]):::error
  n29 -->|"sí"| n30
  n31["Llama a PollsRepository.findVote"]:::llamada
  n29 -->|"no"| n31
  n32[("LEE community.poll_votes")]:::efecto
  n31 --> n32
  n33{"dupOption"}:::decision
  n32 --> n33
  n34(["409 CONFLICT Ya votó por esta opción"]):::error
  n33 -->|"sí"| n34
  n35{"!poll.allowsMultiple"}:::decision
  n33 -->|"no"| n35
  n36["Llama a PollsRepository.countVotesByVoter"]:::llamada
  n35 -->|"sí"| n36
  n37[("LEE community.poll_votes")]:::efecto
  n36 --> n37
  n38{"already › 0"}:::decision
  n37 --> n38
  n39(["409 CONFLICT La encuesta admite un único voto por votante"]):::error
  n38 -->|"sí"| n39
  n40["Llama a PollsRepository.createVote"]:::llamada
  n38 -->|"no"| n40
  n35 -->|"no"| n40
  n41[("CREA community.poll_votes")]:::efecto
  n40 --> n41
  n42[("ACTUALIZA community.poll_options · ACTUALIZA community.polls")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 42. GET /community/posts/{postId}

Publicación con media, hashtags y menciones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.getPost"]:::llamada
  n2 --> n3
  n4["Llama a PostsRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE community.social_posts")]:::efecto
  n4 --> n5
  n6{"!post"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Publicación no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n6 -->|"no"| n8
  n9{"requested"}:::decision
  n8 --> n9
  n10["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a PublicProfilesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n12 --> n13
  n14["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n9 -->|"no"| n14
  n15["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE community.public_profiles")]:::efecto
  n15 --> n16
  n17["Llama a CommunityVisibilityService.canViewPost"]:::llamada
  n16 --> n17
  n14 -->|"al terminar"| n17
  n18["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n17 --> n18
  n19["Llama a BlocksRepository.existsBetween"]:::llamada
  n18 --> n19
  n20[("LEE community.user_blocks")]:::efecto
  n19 --> n20
  n21{"según post.visibilityConceptId"}:::decision
  n20 --> n21
  n22["Llama a CommunityVisibilityService.followsProfile"]:::llamada
  n21 -->|"COMM.POST_VISIBILITY_FOLLOWERS"| n22
  n23["Llama a FollowsRepository.findByFollowerTarget"]:::llamada
  n22 --> n23
  n24[("LEE community.social_follows")]:::efecto
  n23 --> n24
  n25{"!canView"}:::decision
  n24 --> n25
  n21 -->|"otro"| n25
  n26(["404 NOT_FOUND Publicación no encontrada"]):::error
  n25 -->|"sí"| n26
  n27["Llama a PostsRepository.listMedia"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE community.post_media")]:::efecto
  n27 --> n28
  n29["Llama a PostsRepository.listHashtags"]:::llamada
  n28 --> n29
  n30[("LEE community.content_hashtags · LEE community.hashtags")]:::efecto
  n29 --> n30
  n31["Llama a PostsRepository.listMentions"]:::llamada
  n30 --> n31
  n32[("LEE community.mentions")]:::efecto
  n31 --> n32
  n33["Llama a CommunityEngagementService.ofPosts"]:::llamada
  n32 --> n33
  n34["Llama a ReactionsRepository.summarizeByTargets"]:::llamada
  n33 --> n34
  n35[("LEE community.reactions")]:::efecto
  n34 --> n35
  n36["Llama a CommentsRepository.countByTargets"]:::llamada
  n35 --> n36
  n37[("LEE community.comments")]:::efecto
  n36 --> n37
  n38["Llama a ReactionsRepository.listByActorTargets"]:::llamada
  n37 --> n38
  n39[("LEE community.reactions")]:::efecto
  n38 --> n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 43. GET /community/posts/{postId}/comments

Comentarios de una publicación (hilo anidado)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.listPostComments"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n3 --> n4
  n5{"requested"}:::decision
  n4 --> n5
  n6["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PublicProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE community.public_profiles")]:::efecto
  n7 --> n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n5 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a CommunitySocialReadService.assertPostVisible"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14["Llama a PostsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE community.social_posts")]:::efecto
  n14 --> n15
  n16{"!post || !(await this.visibility.canViewPost(em, post, actorProfileId))"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Publicación no encontrada"]):::error
  n16 -->|"sí"| n17
  n18["Llama a CommentsRepository.listRootsPage"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE community.comments")]:::efecto
  n18 --> n19
  n20["Llama a CommentsRepository.listRepliesOf"]:::llamada
  n19 --> n20
  n21[("LEE community.comments")]:::efecto
  n20 --> n21
  n22["Llama a CommunitySocialReadService.mediaByComment"]:::llamada
  n21 --> n22
  n23["Llama a CommentsRepository.listMediaForComments"]:::llamada
  n22 --> n23
  n24[("LEE community.comment_media")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 44. POST /community/posts/{postId}/polls

Crear una encuesta con opciones sobre un post

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Post no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPollsService.createPoll"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PostsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.social_posts")]:::efecto
  n5 --> n6
  n7{"!post"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Post no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n11 --> n12
  n13["Llama a PollsRepository.createPoll"]:::llamada
  n14[("CREA community.polls")]:::efecto
  n13 --> n14
  n15["Repite: por cada const [i, label] de dto.options.entries()"]:::bucle
  n14 --> n15
  n16["Llama a PollsRepository.createOption"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("CREA community.poll_options")]:::efecto
  n16 --> n17
  n18(("201 Responde con éxito")):::ok
  n17 --> n18
  n15 -->|"al terminar"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 45. GET /community/posts/{postId}/reactions

Reacciones de una publicación, agrupadas por tipo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de ruta (400) · l…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.getPostReactions"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n3 --> n4
  n5{"requested"}:::decision
  n4 --> n5
  n6["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PublicProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE community.public_profiles")]:::efecto
  n7 --> n8
  n9(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n8 --> n9
  n10["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n5 -->|"no"| n10
  n11["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13["Llama a CommunitySocialReadService.assertPostVisible"]:::llamada
  n12 --> n13
  n10 -->|"al terminar"| n13
  n14["Llama a PostsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE community.social_posts")]:::efecto
  n14 --> n15
  n16{"!post || !(await this.visibility.canViewPost(em, post, actorProfileId))"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Publicación no encontrada"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ReactionsRepository.summarizeByTarget"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE community.reactions")]:::efecto
  n18 --> n19
  n20["Llama a ReactionsRepository.findByActorTarget"]:::llamada
  n19 --> n20
  n21[("LEE community.reactions")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 46. GET /community/profiles/{profileId}

Ficha de un perfil público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.getProfile"]:::llamada
  n2 --> n3
  n4["Llama a PublicProfilesRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Perfil público no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n6 -->|"no"| n8
  n9{"requested"}:::decision
  n8 --> n9
  n10["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a PublicProfilesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE community.public_profiles")]:::efecto
  n11 --> n12
  n13(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n12 --> n13
  n14["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n9 -->|"no"| n14
  n15["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE community.public_profiles")]:::efecto
  n15 --> n16
  n17["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n16 --> n17
  n14 -->|"al terminar"| n17
  n18["Llama a BlocksRepository.existsBetween"]:::llamada
  n17 --> n18
  n19[("LEE community.user_blocks")]:::efecto
  n18 --> n19
  n20{"actorProfileId && (await this.visibility.isBlockedBetween(em, actorProfileId, profile.id))"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Perfil público no encontrado"]):::error
  n20 -->|"sí"| n21
  n22["Llama a PublicProfilesRepository.listBadgesBySubject"]:::llamada
  n20 -->|"no"| n22
  n23[("LEE community.verified_badges")]:::efecto
  n22 --> n23
  n24["Llama a CommunityPrestigeRepository.findScoreByProfile"]:::llamada
  n23 --> n24
  n25[("LEE community.prestige_scores")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 47. GET /community/profiles/{profileId}/auto-reply

Respuesta automática por inactividad del perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityChatAutoReplyService.get"]:::llamada
  n2 --> n3
  n4["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n6 --> n7
  n8[("LEE community.chat_auto_replies")]:::efecto
  n9(("200 Responde con éxito")):::ok
  n8 --> n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 48. PUT /community/profiles/{profileId}/auto-reply

Configurar la respuesta automática del perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityChatAutoReplyService.upsert"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9[("LEE community.chat_auto_replies")]:::efecto
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 49. GET /community/profiles/{profileId}/posts

Publicaciones de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.listProfilePosts"]:::llamada
  n2 --> n3
  n4["Llama a PostsRepository.listByAuthorPage"]:::llamada
  n3 --> n4
  n5[("LEE community.social_posts")]:::efecto
  n4 --> n5
  n6["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n5 --> n6
  n7{"requested"}:::decision
  n6 --> n7
  n8["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n7 -->|"sí"| n8
  n9["Llama a PublicProfilesRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n10 --> n11
  n12["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n7 -->|"no"| n12
  n13["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("LEE community.public_profiles")]:::efecto
  n13 --> n14
  n15["Llama a CommunityVisibilityService.filterVisiblePosts"]:::llamada
  n14 --> n15
  n12 -->|"al terminar"| n15
  n16["Llama a BlocksRepository.listBlockedPeers"]:::llamada
  n15 --> n16
  n17[("LEE community.user_blocks")]:::efecto
  n16 --> n17
  n18["Llama a FollowsRepository.listFollowedProfileIds"]:::llamada
  n17 --> n18
  n19[("LEE community.social_follows")]:::efecto
  n18 --> n19
  n20["Llama a CommunityEngagementService.ofPosts"]:::llamada
  n19 --> n20
  n21["Llama a ReactionsRepository.summarizeByTargets"]:::llamada
  n20 --> n21
  n22[("LEE community.reactions")]:::efecto
  n21 --> n22
  n23["Llama a CommentsRepository.countByTargets"]:::llamada
  n22 --> n23
  n24[("LEE community.comments")]:::efecto
  n23 --> n24
  n25["Llama a ReactionsRepository.listByActorTargets"]:::llamada
  n24 --> n25
  n26[("LEE community.reactions")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 50. POST /community/profiles/{profileId}/posts

Publicar un post con hashtags, media y menciones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.publishPost"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!author"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Perfil autor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n11 --> n12
  n13["Llama a PostsRepository.create"]:::llamada
  n14[("CREA community.social_posts")]:::efecto
  n13 --> n14
  n15["Repite: por cada const [i, m] de (dto.media ?? []).entries()"]:::bucle
  n14 --> n15
  n16["Llama a CommunitySocialService.assertMediaFileUsableBy"]:::llamada
  n15 -->|"cada elemento"| n16
  n17["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n16 --> n17
  n18["Llama a FilesRepository.findById"]:::llamada
  n17 --> n18
  n19[("LEE common.files")]:::efecto
  n18 --> n19
  n20{"!file"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND {labels.notFound}"]):::error
  n20 -->|"sí"| n21
  n22{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n20 -->|"no"| n22
  n23(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n22 -->|"sí"| n23
  n24{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n24 -->|"sí"| n25
  n26{"!file.currentVersionId"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n26 -->|"sí"| n27
  n28["Llama a AttachableFileService.assertVersionUsable"]:::llamada
  n26 -->|"no"| n28
  n29{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n28 --> n29
  n30(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n29 -->|"sí"| n30
  n31{"!file.currentVersionId"}:::decision
  n29 -->|"no"| n31
  n32(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n31 -->|"sí"| n32
  n33{"!version"}:::decision
  n31 -->|"no"| n33
  n34(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n33 -->|"sí"| n34
  n35{"version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {labels.subject} resultó infectado"]):::error
  n35 -->|"sí"| n36
  n37{"accepted && !accepted.includes(version.mimeType ?? '')"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED {labels.subject} no es de un formato admitido para este uso"]):::error
  n37 -->|"sí"| n38
  n39["Llama a PostsRepository.createMedia"]:::llamada
  n37 -->|"no"| n39
  n40[("CREA community.post_media")]:::efecto
  n39 --> n40
  n41["Repite: por cada const raw de dto.hashtags ?? []"]:::bucle
  n40 --> n41
  n15 -->|"al terminar"| n41
  n42["Llama a PostsRepository.upsertHashtag"]:::llamada
  n41 -->|"cada elemento"| n42
  n43[("LEE community.hashtags")]:::efecto
  n42 --> n43
  n44{"hashtag"}:::decision
  n43 --> n44
  n45[("ACTUALIZA community.hashtags")]:::efecto
  n44 -->|"sí"| n45
  n46[("CREA community.hashtags")]:::efecto
  n45 --> n46
  n44 -->|"no"| n46
  n47["Llama a PostsRepository.linkHashtag"]:::llamada
  n46 --> n47
  n48[("CREA community.content_hashtags")]:::efecto
  n47 --> n48
  n49["Repite: por cada const mention de dto.mentions ?? []"]:::bucle
  n48 --> n49
  n41 -->|"al terminar"| n49
  n50["Llama a PostsRepository.createMention"]:::llamada
  n49 -->|"cada elemento"| n50
  n51[("CREA community.mentions")]:::efecto
  n50 --> n51
  n52(("201 Responde con éxito")):::ok
  n51 --> n52
  n49 -->|"al terminar"| n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 51. GET /community/profiles/{profileId}/reviews

Reviews publicadas de un perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityReviewsReadService.listProfileReviews"]:::llamada
  n2 --> n3
  n4["Llama a PublicProfilesRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Perfil público no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityReviewsReadService.projectPage"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a CommunityReviewsReadService.resolveCursor"]:::llamada
  n8 --> n9
  n10["Llama a ReviewsRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE community.service_reviews")]:::efecto
  n10 --> n11
  n12{"!anchor || anchor.targetPublicProfileId !== profileId"}:::decision
  n11 --> n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ReviewsRepository.listByTargetPage"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE community.service_reviews")]:::efecto
  n14 --> n15
  n16["Llama a ReviewsRepository.listDimensionScores"]:::llamada
  n15 --> n16
  n17[("LEE community.review_dimension_scores")]:::efecto
  n16 --> n17
  n18["Llama a ReviewsRepository.listResponses"]:::llamada
  n17 --> n18
  n19[("LEE community.review_responses")]:::efecto
  n18 --> n19
  n20["Llama a ReviewsRepository.displayNamesByPerson"]:::llamada
  n19 --> n20
  n21[("LEE profiles.persons")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 52. POST /community/profiles/{profileId}/reviews

Publicar una review verificada de servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo un paciente con atención registrada puede calificar |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una review verificada para este encuentro |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil no acepta reviews; PreconditionFailedException: La atención declarada no habilita una reseña; PreconditionFailedException: La atención todavía no terminó; PreconditionFailedException: La atención declarada no fue con este profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityReviewsService.publishReview"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!target"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Perfil objetivo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"target.acceptsReviews === false"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El perfil no acepta reviews"]):::error
  n9 -->|"sí"| n10
  n11{"!reviewerPatientProfileId"}:::decision
  n9 -->|"no"| n11
  n12(["403 FORBIDDEN Sólo un paciente con atención registrada puede calificar"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CommunityReviewsService.assertEligibleCare"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a EncountersRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE clinical.encounters")]:::efecto
  n14 --> n15
  n16{"!encounter"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED La atención declarada no habilita una reseña"]):::error
  n16 -->|"sí"| n17
  n18{"encounter.patientProfileId !== patientProfileId"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La atención declarada no habilita una reseña"]):::error
  n18 -->|"sí"| n19
  n20{"encounter.statusConceptId !== CLIN.ENCOUNTER_FINISHED"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED La atención todavía no terminó"]):::error
  n20 -->|"sí"| n21
  n22[("LEE clinical.encounter_participants")]:::efecto
  n20 -->|"no"| n22
  n23{"!attended"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED La atención declarada no fue con este profesional"]):::error
  n23 -->|"sí"| n24
  n25["Llama a ReviewsRepository.findByReviewerEncounter"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE community.service_reviews")]:::efecto
  n25 --> n26
  n27{"existing"}:::decision
  n26 --> n27
  n28(["409 CONFLICT Ya existe una review verificada para este encuentro"]):::error
  n27 -->|"sí"| n28
  n29["Llama a ReviewsRepository.create"]:::llamada
  n27 -->|"no"| n29
  n30[("CREA community.service_reviews")]:::efecto
  n29 --> n30
  n31["Repite: por cada const d de dto.dimensions ?? []"]:::bucle
  n30 --> n31
  n32["Llama a ReviewsRepository.createDimensionScore"]:::llamada
  n31 -->|"cada elemento"| n32
  n33[("CREA community.review_dimension_scores")]:::efecto
  n32 --> n33
  n34(("201 Responde con éxito")):::ok
  n33 --> n34
  n31 -->|"al terminar"| n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 53. POST /community/profiles/{profileId}/reviews/{reviewId}/responses

Responder una reseña de la propia vitrina

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado; ResourceNotFoundException: Reseña no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya respondiste esta reseña |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityReviewsService.respondToReview"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!target"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Perfil objetivo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PublicProfilesRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n11 --> n12
  n13["Llama a ReviewsRepository.findById"]:::llamada
  n14[("LEE community.service_reviews")]:::efecto
  n13 --> n14
  n15{"!review || review.targetPublicProfileId !== profileId"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Reseña no encontrada"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ReviewsRepository.findResponseByResponder"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE community.review_responses")]:::efecto
  n17 --> n18
  n19{"previous"}:::decision
  n18 --> n19
  n20(["409 CONFLICT Ya respondiste esta reseña"]):::error
  n19 -->|"sí"| n20
  n21["Llama a ReviewsRepository.createResponse"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA community.review_responses")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 54. GET /community/profiles/by-slug/{slug}

Ficha de un perfil público por su slug

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil no encontrado; ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialReadService.getProfileBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicProfilesRepository.findBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Perfil no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunitySocialReadService.getProfile"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicProfilesRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11{"!profile"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Perfil público no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CommunityVisibilityService.resolveActorProfileId"]:::llamada
  n11 -->|"no"| n13
  n14{"requested"}:::decision
  n13 --> n14
  n15["Llama a CommunityVisibilityService.assertOwnProfile"]:::llamada
  n14 -->|"sí"| n15
  n16(["403 FORBIDDEN Sólo el titular del perfil puede leer su contenido privado"]):::error
  n15 --> n16
  n17["Repite: por cada const subject de this.subjects(actor)"]:::bucle
  n14 -->|"no"| n17
  n18["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("LEE community.public_profiles")]:::efecto
  n18 --> n19
  n20["Llama a CommunityVisibilityService.isBlockedBetween"]:::llamada
  n19 --> n20
  n17 -->|"al terminar"| n20
  n21["Llama a BlocksRepository.existsBetween"]:::llamada
  n20 --> n21
  n22[("LEE community.user_blocks")]:::efecto
  n21 --> n22
  n23{"actorProfileId && (await this.visibility.isBlockedBetween(em, actorProfileId, profile.id))"}:::decision
  n22 --> n23
  n24(["404 NOT_FOUND Perfil público no encontrado"]):::error
  n23 -->|"sí"| n24
  n25["Llama a PublicProfilesRepository.listBadgesBySubject"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE community.verified_badges")]:::efecto
  n25 --> n26
  n27["Llama a CommunityPrestigeRepository.findScoreByProfile"]:::llamada
  n26 --> n27
  n28[("LEE community.prestige_scores")]:::efecto
  n27 --> n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 55. GET /community/profiles/me

Consultar la vitrina pública propia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.getOwnProfile"]:::llamada
  n2 --> n3
  n4["Llama a CommunitySocialService.showcaseOf"]:::llamada
  n3 --> n4
  n5["Repite: por cada const targetId de this.subjects(actor)"]:::bucle
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n5 -->|"cada elemento"| n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(("200 Responde con éxito")):::ok
  n7 --> n8
  n5 -->|"al terminar"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 56. PUT /community/profiles/me

Crear o actualizar la vitrina pública propia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 409 | `CONFLICT` | ConflictException: Ese enlace ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: No se pudo recuperar el perfil público recién guardado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.upsertOwnProfile"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PublicProfilesRepository.findBySlug"]:::llamada
  n4 --> n5
  n6[("LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"busy && !this.subjects(actor).includes(busy.targetId)"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ese enlace ya está en uso"]):::error
  n7 -->|"sí"| n8
  n9{"dto.avatarFileId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a FilesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE common.files")]:::efecto
  n11 --> n12
  n13{"!file"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND {labels.notFound}"]):::error
  n13 -->|"sí"| n14
  n15{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n13 -->|"no"| n15
  n16(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n15 -->|"sí"| n16
  n17{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n17 -->|"sí"| n18
  n19{"!file.currentVersionId"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a AttachableFileService.assertVersionUsable"]:::llamada
  n19 -->|"no"| n21
  n22{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n22 -->|"sí"| n23
  n24{"!file.currentVersionId"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n24 -->|"sí"| n25
  n26["Llama a FileVersionsRepository.findById"]:::llamada
  n24 -->|"no"| n26
  n27[("LEE common.file_versions")]:::efecto
  n26 --> n27
  n28{"!version"}:::decision
  n27 --> n28
  n29(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n28 -->|"sí"| n29
  n30{"version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED"}:::decision
  n28 -->|"no"| n30
  n31(["422 PRECONDITION_FAILED {labels.subject} resultó infectado"]):::error
  n30 -->|"sí"| n31
  n32{"accepted && !accepted.includes(version.mimeType ?? '')"}:::decision
  n30 -->|"no"| n32
  n33(["422 PRECONDITION_FAILED {labels.subject} no es de un formato admitido para este uso"]):::error
  n32 -->|"sí"| n33
  n34{"dto.coverFileId"}:::decision
  n32 -->|"no"| n34
  n9 -->|"no"| n34
  n35["Llama a AttachableFileService.assertUsableBy"]:::llamada
  n34 -->|"sí"| n35
  n36["Llama a FilesRepository.findById"]:::llamada
  n35 --> n36
  n37[("LEE common.files")]:::efecto
  n36 --> n37
  n38{"!file"}:::decision
  n37 --> n38
  n39(["404 NOT_FOUND {labels.notFound}"]):::error
  n38 -->|"sí"| n39
  n40{"file.createdByUserId !== actor.id && !enAllowlist"}:::decision
  n38 -->|"no"| n40
  n41(["403 FORBIDDEN {labels.subject} no le pertenece"]):::error
  n40 -->|"sí"| n41
  n42{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n40 -->|"no"| n42
  n43(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n42 -->|"sí"| n43
  n44{"!file.currentVersionId"}:::decision
  n42 -->|"no"| n44
  n45(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n44 -->|"sí"| n45
  n46["Llama a AttachableFileService.assertVersionUsable"]:::llamada
  n44 -->|"no"| n46
  n47{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n46 --> n47
  n48(["422 PRECONDITION_FAILED {labels.subject} está borrado"]):::error
  n47 -->|"sí"| n48
  n49{"!file.currentVersionId"}:::decision
  n47 -->|"no"| n49
  n50(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n49 -->|"sí"| n50
  n51["Llama a FileVersionsRepository.findById"]:::llamada
  n49 -->|"no"| n51
  n52[("LEE common.file_versions")]:::efecto
  n51 --> n52
  n53{"!version"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED {labels.subject} no tiene una versión vigente"]):::error
  n53 -->|"sí"| n54
  n55{"version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED"}:::decision
  n53 -->|"no"| n55
  n56(["422 PRECONDITION_FAILED {labels.subject} resultó infectado"]):::error
  n55 -->|"sí"| n56
  n57{"accepted && !accepted.includes(version.mimeType ?? '')"}:::decision
  n55 -->|"no"| n57
  n58(["422 PRECONDITION_FAILED {labels.subject} no es de un formato admitido para este uso"]):::error
  n57 -->|"sí"| n58
  n59["Llama a CommunitySocialService.showcaseOf"]:::llamada
  n57 -->|"no"| n59
  n34 -->|"no"| n59
  n60["Repite: por cada const targetId de this.subjects(actor)"]:::bucle
  n59 --> n60
  n61["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n60 -->|"cada elemento"| n61
  n62[("LEE community.public_profiles")]:::efecto
  n61 --> n62
  n63{"existing"}:::decision
  n62 --> n63
  n60 -->|"al terminar"| n63
  n64["Llama a PublicProfilesRepository.create"]:::llamada
  n63 -->|"no"| n64
  n65[("CREA community.public_profiles")]:::efecto
  n64 --> n65
  n66["Llama a CommunitySocialService.getOwnProfile"]:::llamada
  n63 -->|"sí"| n66
  n65 --> n66
  n67["Llama a CommunitySocialService.showcaseOf"]:::llamada
  n66 --> n67
  n68["Repite: por cada const targetId de this.subjects(actor)"]:::bucle
  n67 --> n68
  n69["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n68 -->|"cada elemento"| n69
  n70[("LEE community.public_profiles")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (2 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"al terminar"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 57. GET /community/profiles/me/stats

Estadísticas de la vitrina pública propia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.getOwnProfileStats"]:::llamada
  n2 --> n3
  n4["Llama a CommunitySocialService.showcaseOf"]:::llamada
  n3 --> n4
  n5["Repite: por cada const targetId de this.subjects(actor)"]:::bucle
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n5 -->|"cada elemento"| n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8["Llama a CommunityProfileStatsService.read"]:::llamada
  n7 --> n8
  n5 -->|"al terminar"| n8
  n9["Intenta"]:::intento
  n8 --> n9
  n10["Llama a RedisRuntimeService.getCounters"]:::llamada
  n9 --> n10
  n11["Llama a RedisRuntimeService.keyFor"]:::llamada
  n10 --> n11
  n12{"!tenant"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Operación de runtime sin tenant en contexto"]):::error
  n12 -->|"sí"| n13
  n14{"!key"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED Clave de runtime vacía"]):::error
  n14 -->|"sí"| n15
  n16(("200 Responde con éxito")):::ok
  n14 -->|"no"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 58. GET /community/ratings

Calificaciones de un médico, paciente u organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La calificación de un paciente sólo la ven los profesionales que lo atienden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a PartyRatingsReadService.list"]:::llamada
  n2 --> n3
  n4["Llama a PartyRatingsReadService.assertCanRead"]:::llamada
  n3 --> n4
  n5["Llama a RatingPartiesService.assertCanReadPatientRatings"]:::llamada
  n4 --> n5
  n6[("LEE practice.practices")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN La calificación de un paciente sólo la ven los profesionales que lo atienden"]):::error
  n6 --> n7
  n8["Llama a PartyRatingsRepository.aggregate"]:::llamada
  n9[("LEE community.party_ratings")]:::efecto
  n8 --> n9
  n10["Llama a PartyRatingsRepository.findByTarget"]:::llamada
  n9 --> n10
  n11[("LEE community.party_ratings")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 59. PUT /community/ratings

Calificar con estrellas a un médico, paciente u organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: Indique en nombre de qué organización califica; BadRequestException: Indique la atención terminada que respalda la calificación; BadRequestException: Indique el vínculo de trabajo que respalda la calificación |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Su cuenta no tiene un perfil de paciente con el cual calificar; ForbiddenException: Su cuenta no tiene un perfil profesional con el cual calificar; ForbiddenException: Sólo quien administra la organización puede calificar en su nombre; ForbiddenException: No puede calificar a una organización que usted administra |
| 409 | `CONFLICT` | ConflictException: Esta calificación se está guardando en otro pedido; vuelva a intentarlo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {BASIS_REJECTED}; PreconditionFailedException: La atención todavía no terminó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PartyRatingsService.rate"]:::llamada
  n2 --> n3
  n4["Intenta"]:::intento
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a RatingPartiesService.resolveReviewer"]:::llamada
  n5 --> n6
  n7{"type === 'PATIENT'"}:::decision
  n6 --> n7
  n8{"!actor.patientProfileId"}:::decision
  n7 -->|"sí"| n8
  n9(["403 FORBIDDEN Su cuenta no tiene un perfil de paciente con el cual calificar"]):::error
  n8 -->|"sí"| n9
  n10{"type === 'PRACTITIONER'"}:::decision
  n8 -->|"no"| n10
  n7 -->|"no"| n10
  n11{"!actor.practitionerProfileId"}:::decision
  n10 -->|"sí"| n11
  n12(["403 FORBIDDEN Su cuenta no tiene un perfil profesional con el cual calificar"]):::error
  n11 -->|"sí"| n12
  n13{"!organizationId"}:::decision
  n11 -->|"no"| n13
  n10 -->|"no"| n13
  n14(["400 VALIDATION_FAILED Indique en nombre de qué organización califica"]):::error
  n13 -->|"sí"| n14
  n15["Llama a RatingPartiesService.assertAdministers"]:::llamada
  n13 -->|"no"| n15
  n16["Llama a RatingPartiesService.administers"]:::llamada
  n15 --> n16
  n17[("LEE practice.practices")]:::efecto
  n16 --> n17
  n18{"!(await this.administers(em, organizationId, actor))"}:::decision
  n17 --> n18
  n19(["403 FORBIDDEN Sólo quien administra la organización puede calificar en su nombre"]):::error
  n18 -->|"sí"| n19
  n20["Llama a PartyRatingsService.assertBasis"]:::llamada
  n18 -->|"no"| n20
  n21{"conPaciente"}:::decision
  n20 --> n21
  n22{"!dto.encounterId"}:::decision
  n21 -->|"sí"| n22
  n23(["400 VALIDATION_FAILED Indique la atención terminada que respalda la calificación"]):::error
  n22 -->|"sí"| n23
  n24["Llama a PartyRatingsService.assertEncounterJoins"]:::llamada
  n22 -->|"no"| n24
  n25["Llama a EncountersRepository.findById"]:::llamada
  n24 --> n25
  n26[("LEE clinical.encounters")]:::efecto
  n25 --> n26
  n27{"!encuentro"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED {BASIS_REJECTED}"]):::error
  n27 -->|"sí"| n28
  n29{"encuentro.statusConceptId !== CLIN.ENCOUNTER_FINISHED"}:::decision
  n27 -->|"no"| n29
  n30(["422 PRECONDITION_FAILED La atención todavía no terminó"]):::error
  n29 -->|"sí"| n30
  n31["Repite: por cada const party de parties"]:::bucle
  n29 -->|"no"| n31
  n32["Llama a PartyRatingsService.wasInEncounter"]:::llamada
  n31 -->|"cada elemento"| n32
  n33{"party.type === 'PRACTITIONER'"}:::decision
  n32 --> n33
  n34[("LEE clinical.encounter_participants")]:::efecto
  n33 -->|"sí"| n34
  n35{"!(await this.wasInEncounter(em, encuentro, party))"}:::decision
  n34 --> n35
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {BASIS_REJECTED}"]):::error
  n35 -->|"sí"| n36
  n37{"!dto.roleAssignmentId"}:::decision
  n35 -->|"no"| n37
  n31 -->|"al terminar"| n37
  n21 -->|"no"| n37
  n38(["400 VALIDATION_FAILED Indique el vínculo de trabajo que respalda la calificación"]):::error
  n37 -->|"sí"| n38
  n39["Llama a PartyRatingsService.assertNotSelf"]:::llamada
  n37 -->|"no"| n39
  n40["Llama a RatingPartiesService.administers"]:::llamada
  n39 --> n40
  n41[("LEE practice.practices")]:::efecto
  n40 --> n41
  n42{"await this.parties.administers(em, organization.id, actor)"}:::decision
  n41 --> n42
  n43(["403 FORBIDDEN No puede calificar a una organización que usted administra"]):::error
  n42 -->|"sí"| n43
  n44["Llama a PartyRatingsService.assertRoleAssignment"]:::llamada
  n42 -->|"no"| n44
  n45[("LEE practice.practitioner_role_assignments")]:::efecto
  n44 --> n45
  n46{"!habilita"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED {BASIS_REJECTED}"]):::error
  n46 -->|"sí"| n47
  n48["Llama a PartyRatingsRepository.findExisting"]:::llamada
  n46 -->|"no"| n48
  n49[("LEE community.party_ratings")]:::efecto
  n48 --> n49
  n50{"previa"}:::decision
  n49 --> n50
  n51["Llama a PartyRatingsRepository.update"]:::llamada
  n50 -->|"sí"| n51
  n52[("ACTUALIZA community.party_ratings · ACTUALIZA community.party_ratings")]:::efecto
  n51 --> n52
  n53["Llama a PartyRatingsRepository.create"]:::llamada
  n52 --> n53
  n50 -->|"no"| n53
  n54[("CREA community.party_ratings")]:::efecto
  n53 --> n54
  n55{"error instanceof UniqueConstraintViolationException"}:::decision
  n4 -->|"si falla"| n55
  n56(["409 CONFLICT Esta calificación se está guardando en otro pedido; vuelva a intentarlo"]):::error
  n55 -->|"sí"| n56
  n57(["↩ (relanza el error capturado)"]):::error
  n55 -->|"no"| n57
  n58(("200 Responde con éxito")):::ok
  n54 --> n58
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 60. GET /community/ratings/mine

Mis calificaciones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: Indique en nombre de qué organización califica |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Su cuenta no tiene un perfil de paciente con el cual calificar; ForbiddenException: Su cuenta no tiene un perfil profesional con el cual calificar; ForbiddenException: Sólo quien administra la organización puede calificar en su nombre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PartyRatingsReadService.mine"]:::llamada
  n2 --> n3
  n4["Llama a RatingPartiesService.resolveReviewer"]:::llamada
  n3 --> n4
  n5{"type === 'PATIENT'"}:::decision
  n4 --> n5
  n6{"!actor.patientProfileId"}:::decision
  n5 -->|"sí"| n6
  n7(["403 FORBIDDEN Su cuenta no tiene un perfil de paciente con el cual calificar"]):::error
  n6 -->|"sí"| n7
  n8{"type === 'PRACTITIONER'"}:::decision
  n6 -->|"no"| n8
  n5 -->|"no"| n8
  n9{"!actor.practitionerProfileId"}:::decision
  n8 -->|"sí"| n9
  n10(["403 FORBIDDEN Su cuenta no tiene un perfil profesional con el cual calificar"]):::error
  n9 -->|"sí"| n10
  n11{"!organizationId"}:::decision
  n9 -->|"no"| n11
  n8 -->|"no"| n11
  n12(["400 VALIDATION_FAILED Indique en nombre de qué organización califica"]):::error
  n11 -->|"sí"| n12
  n13["Llama a RatingPartiesService.assertAdministers"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a RatingPartiesService.administers"]:::llamada
  n13 --> n14
  n15[("LEE practice.practices")]:::efecto
  n14 --> n15
  n16{"!(await this.administers(em, organizationId, actor))"}:::decision
  n15 --> n16
  n17(["403 FORBIDDEN Sólo quien administra la organización puede calificar en su nombre"]):::error
  n16 -->|"sí"| n17
  n18["Llama a PartyRatingsRepository.findByReviewer"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE community.party_ratings")]:::efecto
  n18 --> n19
  n20(("200 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 61. GET /community/ratings/summary

Nota media de un médico, paciente u organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La calificación de un paciente sólo la ven los profesionales que lo atienden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a PartyRatingsReadService.summary"]:::llamada
  n2 --> n3
  n4["Llama a PartyRatingsReadService.assertCanRead"]:::llamada
  n3 --> n4
  n5["Llama a RatingPartiesService.assertCanReadPatientRatings"]:::llamada
  n4 --> n5
  n6[("LEE practice.practices")]:::efecto
  n5 --> n6
  n7(["403 FORBIDDEN La calificación de un paciente sólo la ven los profesionales que lo atienden"]):::error
  n6 --> n7
  n8["Llama a PartyRatingsRepository.aggregate"]:::llamada
  n9[("LEE community.party_ratings")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 62. PUT /community/reactions

Reaccionar a contenido (upsert una reacción por actor/objeto)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySocialService.react"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CommunityVisibilityService.assertActsAsProfile"]:::llamada
  n4 --> n5
  n6["Llama a PublicProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8(["403 FORBIDDEN No se puede escribir en el grafo social con un perfil ajeno"]):::error
  n7 --> n8
  n9["Llama a ReactionsRepository.findByActorTarget"]:::llamada
  n10[("LEE community.reactions")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12[("ACTUALIZA community.reactions")]:::efecto
  n11 -->|"sí"| n12
  n13["Llama a ReactionsRepository.create"]:::llamada
  n12 --> n13
  n11 -->|"no"| n13
  n14[("CREA community.reactions")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 63. POST /community/reports

Reportar contenido y encolar moderación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityModerationService.report"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ModerationRepository.createReport"]:::llamada
  n4 --> n5
  n6[("CREA community.content_reports")]:::efecto
  n5 --> n6
  n7["Llama a ModerationRepository.findOpenQueueForContent"]:::llamada
  n6 --> n7
  n8[("LEE community.moderation_queue")]:::efecto
  n7 --> n8
  n9{"!queue"}:::decision
  n8 --> n9
  n10["Llama a ModerationRepository.createQueue"]:::llamada
  n9 -->|"sí"| n10
  n11[("CREA community.moderation_queue")]:::efecto
  n10 --> n11
  n12(("201 Responde con éxito")):::ok
  n11 --> n12
  n9 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 64. GET /f/{slug}

Ficha pública de una farmacia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND No encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.signals"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n8 --> n9
  n10[("LEE community.service_reviews")]:::efecto
  n9 --> n10
  n11["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n10 --> n11
  n12[("LEE community.verified_badges")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n14 --> n15
  n16[("LEE common.addresses")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n16 --> n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n18 --> n19
  n20[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_affiliations")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n24 --> n25
  n26[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 65. POST /internal/community/feed/ranking/apply

Aplicar rank_score recalculado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityFeedService.applyRanking"]:::llamada
  n2 --> n3
  n4["Llama a FeedRepository.applyRankScores"]:::llamada
  n3 --> n4
  n5["Repite: por cada const update de updates"]:::bucle
  n4 --> n5
  n6[("ACTUALIZA community.feed_items")]:::efecto
  n5 -->|"cada elemento"| n6
  n7(("201 Responde con éxito")):::ok
  n6 --> n7
  n5 -->|"al terminar"| n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 66. POST /internal/community/feed/rebuild

Generar feed (fan-out y ranking)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityFeedService.rebuild"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Repite: por cada const ownerProfileId de dto.followerProfileIds"]:::bucle
  n4 --> n5
  n6["Llama a FeedRepository.findByOwnerSource"]:::llamada
  n5 -->|"cada elemento"| n6
  n7[("LEE community.feed_items")]:::efecto
  n6 --> n7
  n8["Llama a FeedRepository.create"]:::llamada
  n7 --> n8
  n9[("CREA community.feed_items")]:::efecto
  n8 --> n9
  n10(("201 Responde con éxito")):::ok
  n9 --> n10
  n5 -->|"al terminar"| n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 67. GET /internal/community/search/health

Estado del índice del directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: OpenSearch está en estado red |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySearchIndexService.health"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.countIndexable"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a SearchIndexService.ping"]:::llamada
  n6 --> n7
  n8{"response.body.status === 'red'"}:::decision
  n7 --> n8
  n9(["500 INTERNAL OpenSearch está en estado red"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SearchIndexService.countDocuments"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a SearchIndexService.assertTenant"]:::llamada
  n10 --> n11
  n12{"!tenantId"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n12 -->|"sí"| n13
  n14["Llama a SearchIndexService.resolveIndex"]:::llamada
  n12 -->|"no"| n14
  n15{"!def"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n15 -->|"sí"| n16
  n17(("200 Responde con éxito")):::ok
  n15 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 68. POST /internal/community/search/reindex

Reindexar el directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: El documento trae campos no declarados para este índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunitySearchIndexService.reindexAll"]:::llamada
  n2 --> n3
  n4{"recreate"}:::decision
  n3 --> n4
  n5["Llama a SearchIndexService.recreateIndex"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a SearchIndexService.resolveIndex"]:::llamada
  n5 --> n6
  n7{"!def"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SearchIndexService.ensureIndex"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a SearchIndexService.resolveIndex"]:::llamada
  n9 --> n10
  n11{"!def"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n11 -->|"sí"| n12
  n13["Llama a SearchIndexService.ensureIndex"]:::llamada
  n4 -->|"no"| n13
  n14["Llama a SearchIndexService.resolveIndex"]:::llamada
  n13 --> n14
  n15{"!def"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PublicSearchRepository.countIndexable"]:::llamada
  n11 -->|"no"| n17
  n15 -->|"no"| n17
  n18[("LEE community.public_profiles")]:::efecto
  n17 --> n18
  n19["Repite: ciclo for"]:::bucle
  n18 --> n19
  n20["Llama a PublicSearchRepository.listIndexable"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("LEE community.public_profiles")]:::efecto
  n20 --> n21
  n22["Llama a CommunitySearchIndexService.buildDocuments"]:::llamada
  n21 --> n22
  n23["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n22 --> n23
  n24[("LEE community.service_reviews")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n24 --> n25
  n26[("LEE common.addresses")]:::efecto
  n25 --> n26
  n27["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n26 --> n27
  n28[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n27 --> n28
  n29["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n28 --> n29
  n30[("LEE community.verified_badges")]:::efecto
  n29 --> n30
  n31["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n30 --> n31
  n32[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n31 --> n32
  n33["Llama a SearchIndexService.bulkIndex"]:::llamada
  n32 --> n33
  n34["Llama a SearchIndexService.assertTenant"]:::llamada
  n33 --> n34
  n35{"!tenantId"}:::decision
  n34 --> n35
  n36(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n35 -->|"sí"| n36
  n37["Llama a SearchIndexService.resolveIndex"]:::llamada
  n35 -->|"no"| n37
  n38{"!def"}:::decision
  n37 --> n38
  n39(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n38 -->|"sí"| n39
  n40["Llama a SearchIndexService.ensureIndex"]:::llamada
  n38 -->|"no"| n40
  n41["Llama a SearchIndexService.resolveIndex"]:::llamada
  n40 --> n41
  n42{"!def"}:::decision
  n41 --> n42
  n43(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n42 -->|"sí"| n43
  n44["Repite: por cada const entry de documents"]:::bucle
  n42 -->|"no"| n44
  n45["Llama a SearchIndexService.assertIndexableDocument"]:::llamada
  n44 -->|"cada elemento"| n45
  n46{"extra.length › 0"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED El documento trae campos no declarados para este índice"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.countDocuments"]:::llamada
  n46 -->|"no"| n48
  n44 -->|"al terminar"| n48
  n19 -->|"al terminar"| n48
  n49["Llama a SearchIndexService.assertTenant"]:::llamada
  n48 --> n49
  n50{"!tenantId"}:::decision
  n49 --> n50
  n51(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n50 -->|"sí"| n51
  n52["Llama a SearchIndexService.resolveIndex"]:::llamada
  n50 -->|"no"| n52
  n53{"!def"}:::decision
  n52 --> n53
  n54(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n53 -->|"sí"| n54
  n55(("200 Responde con éxito")):::ok
  n53 -->|"no"| n55
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 69. POST /internal/community/verification/badges

Emitir un sello a mano (auditado)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityVerificationService.applyVerified"]:::llamada
  n2 --> n3
  n4["Llama a VerifiedBadgesRepository.findProfileByTarget"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6["Llama a VerifiedBadgesRepository.findActive"]:::llamada
  n5 --> n6
  n7[("LEE community.verified_badges")]:::efecto
  n6 --> n7
  n8["Llama a VerifiedBadgesRepository.grant"]:::llamada
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10[("ACTUALIZA community.verified_badges · ACTUALIZA community.verified_badges · ACTUALIZA community.verified_badg…")]:::efecto
  n9 -->|"sí"| n10
  n11[("CREA community.verified_badges")]:::efecto
  n10 --> n11
  n9 -->|"no"| n11
  n12["Llama a VerifiedBadgesRepository.recordHistory"]:::llamada
  n11 --> n12
  n13[("CREA audit.verified_badges_history")]:::efecto
  n12 --> n13
  n14[("ACTUALIZA community.public_profiles")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 70. POST /internal/community/verification/badges/{targetId}/revoke

Bajar los sellos de un sujeto (auditado)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityVerificationService.applyRevoked"]:::llamada
  n2 --> n3
  n4["Llama a VerifiedBadgesRepository.findProfileByTarget"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6["Llama a CommunityVerificationService.revokeProfileBadges"]:::llamada
  n5 --> n6
  n7["Llama a VerifiedBadgesRepository.findAllBySubject"]:::llamada
  n6 --> n7
  n8[("LEE community.verified_badges")]:::efecto
  n7 --> n8
  n9["Repite: por cada const badge de current"]:::bucle
  n8 --> n9
  n10["Llama a VerifiedBadgesRepository.revoke"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("ACTUALIZA community.verified_badges")]:::efecto
  n10 --> n11
  n12{"reason === 'REVOKED' || !badge.validTo"}:::decision
  n11 --> n12
  n13[("ACTUALIZA community.verified_badges")]:::efecto
  n12 -->|"sí"| n13
  n14["Llama a VerifiedBadgesRepository.recordHistory"]:::llamada
  n13 --> n14
  n12 -->|"no"| n14
  n15[("CREA audit.verified_badges_history")]:::efecto
  n14 --> n15
  n16{"profile.verificationStatusConceptId === CONCEPTS.STATE_ACTIVE"}:::decision
  n15 --> n16
  n9 -->|"al terminar"| n16
  n17[("ACTUALIZA community.public_profiles")]:::efecto
  n16 -->|"sí"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  n16 -->|"no"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 71. POST /internal/community/verification/badges/expire-sweep

Bajar los sellos cuya vigencia ya venció

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityVerificationService.expireSweep"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VerifiedBadgesRepository.findExpired"]:::llamada
  n4 --> n5
  n6[("LEE community.verified_badges")]:::efecto
  n5 --> n6
  n7["Repite: por cada const badge de overdue"]:::bucle
  n6 --> n7
  n8["Llama a VerifiedBadgesRepository.revoke"]:::llamada
  n7 -->|"cada elemento"| n8
  n9[("ACTUALIZA community.verified_badges")]:::efecto
  n8 --> n9
  n10{"reason === 'REVOKED' || !badge.validTo"}:::decision
  n9 --> n10
  n11[("ACTUALIZA community.verified_badges")]:::efecto
  n10 -->|"sí"| n11
  n12["Llama a VerifiedBadgesRepository.recordHistory"]:::llamada
  n11 --> n12
  n10 -->|"no"| n12
  n13[("CREA audit.verified_badges_history")]:::efecto
  n12 --> n13
  n14["Repite: por cada const profileId de profiles"]:::bucle
  n13 --> n14
  n7 -->|"al terminar"| n14
  n15["Llama a VerifiedBadgesRepository.findAllBySubject"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE community.verified_badges")]:::efecto
  n15 --> n16
  n17[("LEE community.public_profiles")]:::efecto
  n16 --> n17
  n18{"profile?.verificationStatusConceptId === CONCEPTS.STATE_ACTIVE"}:::decision
  n17 --> n18
  n19[("ACTUALIZA community.public_profiles")]:::efecto
  n18 -->|"sí"| n19
  n20(("200 Responde con éxito")):::ok
  n19 --> n20
  n18 -->|"no"| n20
  n14 -->|"al terminar"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 72. GET /l/{slug}

Ficha pública de un laboratorio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND No encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.signals"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n8 --> n9
  n10[("LEE community.service_reviews")]:::efecto
  n9 --> n10
  n11["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n10 --> n11
  n12[("LEE community.verified_badges")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n14 --> n15
  n16[("LEE common.addresses")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n16 --> n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n18 --> n19
  n20[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_affiliations")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n24 --> n25
  n26[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 73. GET /o/{slug}

Ficha pública de una organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND No encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.signals"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n8 --> n9
  n10[("LEE community.service_reviews")]:::efecto
  n9 --> n10
  n11["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n10 --> n11
  n12[("LEE community.verified_badges")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n14 --> n15
  n16[("LEE common.addresses")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n16 --> n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n18 --> n19
  n20[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_affiliations")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n24 --> n25
  n26[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 74. GET /p/{slug}

Ficha pública de un profesional

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND No encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.signals"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n8 --> n9
  n10[("LEE community.service_reviews")]:::efecto
  n9 --> n10
  n11["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n10 --> n11
  n12[("LEE community.verified_badges")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n14 --> n15
  n16[("LEE common.addresses")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n16 --> n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n18 --> n19
  n20[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_affiliations")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n24 --> n25
  n26[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 75. GET /patients/me/reviewable-care

Consultar si una atención recibida se puede calificar

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo un paciente puede consultar sus atenciones |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Atención no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityReviewableCareService.getReviewableCare"]:::llamada
  n2 --> n3
  n4{"!patientProfileId"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN Sólo un paciente puede consultar sus atenciones"]):::error
  n4 -->|"sí"| n5
  n6[("LEE scheduling.appointment_bookings")]:::efecto
  n4 -->|"no"| n6
  n7{"!booking || booking.patientProfileId !== patientProfileId || booking.tenantId !== tenantId"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Atención no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a EncountersRepository.findLatestIdsByAppointmentIds"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE clinical.encounters")]:::efecto
  n9 --> n10
  n11["Llama a EncountersRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE clinical.encounters")]:::efecto
  n11 --> n12
  n13["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n12 --> n13
  n14[("LEE community.public_profiles")]:::efecto
  n13 --> n14
  n15["Llama a ReviewsRepository.findByReviewerEncounter"]:::llamada
  n14 --> n15
  n16[("LEE community.service_reviews")]:::efecto
  n15 --> n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 76. POST /patients/me/reviews

Calificar una atención recibida

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo un paciente con atención registrada puede calificar |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una review verificada para este encuentro |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La atención declarada no habilita una reseña; PreconditionFailedException: El perfil no acepta reviews; PreconditionFailedException: La atención todavía no terminó; PreconditionFailedException: La atención declarada no fue con este profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityReviewsService.publishOwnReview"]:::llamada
  n2 --> n3
  n4["Llama a CommunityReviewsService.resolveTargetOfEncounter"]:::llamada
  n3 --> n4
  n5["Llama a EncountersRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE clinical.encounters")]:::efecto
  n5 --> n6
  n7["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n6 --> n7
  n8[("LEE community.public_profiles")]:::efecto
  n7 --> n8
  n9{"!showcase"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La atención declarada no habilita una reseña"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CommunityReviewsService.publishReview"]:::llamada
  n9 -->|"no"| n11
  n12["Transacción: transactional(…)"]:::transaccion
  n11 --> n12
  n13["Llama a PublicProfilesRepository.findById"]:::llamada
  n12 --> n13
  n14[("LEE community.public_profiles")]:::efecto
  n13 --> n14
  n15{"!target"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Perfil objetivo no encontrado"]):::error
  n15 -->|"sí"| n16
  n17{"target.acceptsReviews === false"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El perfil no acepta reviews"]):::error
  n17 -->|"sí"| n18
  n19{"!reviewerPatientProfileId"}:::decision
  n17 -->|"no"| n19
  n20(["403 FORBIDDEN Sólo un paciente con atención registrada puede calificar"]):::error
  n19 -->|"sí"| n20
  n21["Llama a CommunityReviewsService.assertEligibleCare"]:::llamada
  n19 -->|"no"| n21
  n22["Llama a EncountersRepository.findById"]:::llamada
  n21 --> n22
  n23[("LEE clinical.encounters")]:::efecto
  n22 --> n23
  n24{"!encounter"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED La atención declarada no habilita una reseña"]):::error
  n24 -->|"sí"| n25
  n26{"encounter.patientProfileId !== patientProfileId"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED La atención declarada no habilita una reseña"]):::error
  n26 -->|"sí"| n27
  n28{"encounter.statusConceptId !== CLIN.ENCOUNTER_FINISHED"}:::decision
  n26 -->|"no"| n28
  n29(["422 PRECONDITION_FAILED La atención todavía no terminó"]):::error
  n28 -->|"sí"| n29
  n30[("LEE clinical.encounter_participants")]:::efecto
  n28 -->|"no"| n30
  n31{"!attended"}:::decision
  n30 --> n31
  n32(["422 PRECONDITION_FAILED La atención declarada no fue con este profesional"]):::error
  n31 -->|"sí"| n32
  n33["Llama a ReviewsRepository.findByReviewerEncounter"]:::llamada
  n31 -->|"no"| n33
  n34[("LEE community.service_reviews")]:::efecto
  n33 --> n34
  n35{"existing"}:::decision
  n34 --> n35
  n36(["409 CONFLICT Ya existe una review verificada para este encuentro"]):::error
  n35 -->|"sí"| n36
  n37["Llama a ReviewsRepository.create"]:::llamada
  n35 -->|"no"| n37
  n38[("CREA community.service_reviews")]:::efecto
  n37 --> n38
  n39["Repite: por cada const d de dto.dimensions ?? []"]:::bucle
  n38 --> n39
  n40["Llama a ReviewsRepository.createDimensionScore"]:::llamada
  n39 -->|"cada elemento"| n40
  n41[("CREA community.review_dimension_scores")]:::efecto
  n40 --> n41
  n42(("201 Responde con éxito")):::ok
  n41 --> n42
  n39 -->|"al terminar"| n42
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 77. GET /public/comments/{commentId}/replies

Respuestas de un comentario público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Comentario no encontrado; ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de ruta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.commentReplies"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPostOfPublicComment"]:::llamada
  n3 --> n4
  n5[("LEE community.comments · LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"postId === null"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Comentario no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.assertPostPublic"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.isPostPublic"]:::llamada
  n8 --> n9
  n10[("LEE community.social_posts · LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11{"!(await this.repo.isPostPublic(em, postId))"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Publicación no encontrada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PublicSearchRepository.listPublicCommentReplies"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a PublicSearchRepository.listPublicComments"]:::llamada
  n13 --> n14
  n15[("LEE community.comments · LEE community.public_profiles")]:::efecto
  n14 --> n15
  n16["Llama a PublicSearchRepository.listPublicCommentMedia"]:::llamada
  n15 --> n16
  n17[("LEE community.comment_media")]:::efecto
  n16 --> n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 78. GET /public/media/{id}

Servir una imagen pública (avatar, portada o post)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente todavía no está lista para servirse públicamente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getPublicMedia"]:::llamada
  n2 --> n3
  n4["Llama a PublicProfilesRepository.isPublicMedia"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6["Llama a PublicSearchRepository.isPublicPostMedia"]:::llamada
  n5 --> n6
  n7[("LEE community.post_media · LEE community.social_posts · LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8["Llama a PublicSearchRepository.isPublicCommentMedia"]:::llamada
  n7 --> n8
  n9[("LEE community.comment_media · LEE community.comments · LEE community.public_profiles · LEE community.social_p…")]:::efecto
  n8 --> n9
  n10{"!allowed"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Archivo no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a FileUploadService.downloadPublicMedia"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a FilesRepository.findById"]:::llamada
  n12 --> n13
  n14[("LEE common.files")]:::efecto
  n13 --> n14
  n15{"!file || file.categoryConceptId !== CONCEPTS.FILE_CATEGORY_IMAGE || file.sensitivityConceptId !== CONCEPTS.SE…"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Archivo no encontrado"]):::error
  n15 -->|"sí"| n16
  n17{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El archivo está borrado"]):::error
  n17 -->|"sí"| n18
  n19{"!file.currentVersionId"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El archivo no tiene una versión vigente"]):::error
  n19 -->|"sí"| n20
  n21["Llama a FileVersionsRepository.findById"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE common.file_versions")]:::efecto
  n21 --> n22
  n23{"!version"}:::decision
  n22 --> n23
  n24(["404 NOT_FOUND Versión vigente no encontrada"]):::error
  n23 -->|"sí"| n24
  n25{"version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN"}:::decision
  n23 -->|"no"| n25
  n26(["422 PRECONDITION_FAILED La versión vigente todavía no está lista para servirse públicamente"]):::error
  n25 -->|"sí"| n26
  n27["Llama a LocalDiskFileStorageAdapter.retrieve"]:::llamada
  n25 -->|"no"| n27
  n28["Llama a LocalDiskFileStorageAdapter.hashFromUri"]:::llamada
  n27 --> n28
  n29{"!storageUri.startsWith(LOCAL_URI_PREFIX)"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND La URI no pertenece al almacenamiento local"]):::error
  n29 -->|"sí"| n30
  n31{"!CONTENT_HASH_PATTERN.test(hash)"}:::decision
  n29 -->|"no"| n31
  n32(["404 NOT_FOUND La URI de almacenamiento local está mal formada"]):::error
  n31 -->|"sí"| n32
  n33["Intenta"]:::intento
  n31 -->|"no"| n33
  n34{"isMissingFile(error)"}:::decision
  n33 -->|"si falla"| n34
  n35(["404 NOT_FOUND El contenido no está disponible en el almacenamiento local"]):::error
  n34 -->|"sí"| n35
  n36(["↩ (relanza el error capturado)"]):::error
  n34 -->|"no"| n36
  n37["Llama a S3FileStorageAdapter.retrieve"]:::llamada
  n33 --> n37
  n38["Llama a S3FileStorageAdapter.assertConfigured"]:::llamada
  n37 --> n38
  n39{"!this.env.s3.bucket"}:::decision
  n38 --> n39
  n40(["500 INTERNAL {HttpStatus.SERVICE_UNAVAILABLE}"]):::error
  n39 -->|"sí"| n40
  n41["Llama a S3FileStorageAdapter.parseOwnedKey"]:::llamada
  n39 -->|"no"| n41
  n42{"!storageUri.startsWith(expected)"}:::decision
  n41 --> n42
  n43(["404 NOT_FOUND La URI no pertenece al bucket configurado"]):::error
  n42 -->|"sí"| n43
  n44{"!CONTENT_HASH_PATTERN.test(hash) || key !== this.objectKey(hash)"}:::decision
  n42 -->|"no"| n44
  n45(["404 NOT_FOUND La URI S3 está mal formada o fuera del prefijo permitido"]):::error
  n44 -->|"sí"| n45
  n46["Intenta"]:::intento
  n44 -->|"no"| n46
  n47{"!result.Body"}:::decision
  n46 --> n47
  n48(["500 INTERNAL S3 object body is empty"]):::error
  n47 -->|"sí"| n48
  n49{"isNotFound(error)"}:::decision
  n46 -->|"si falla"| n49
  n50(["404 NOT_FOUND El contenido no está disponible en el almacenamiento configurado"]):::error
  n49 -->|"sí"| n50
  n51(["↩ (relanza el error capturado)"]):::error
  n49 -->|"no"| n51
  n52(("200 Responde con éxito")):::ok
  n47 -->|"no"| n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 79. GET /public/nearby

Prestadores cercanos, en línea recta

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: Se requieren coordenadas válidas: lat en [-90,90] y lng en [-180,180] |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.nearby"]:::llamada
  n2 --> n3
  n4["Llama a CommunityPublicService.requireCoordinates"]:::llamada
  n3 --> n4
  n5{"!valid(lat, 90) || !valid(lng, 180)"}:::decision
  n4 --> n5
  n6(["400 VALIDATION_FAILED Se requieren coordenadas válidas: lat en [-90,90] y lng en [-180,180]"]):::error
  n5 -->|"sí"| n6
  n7["Intenta"]:::intento
  n5 -->|"no"| n7
  n8["Llama a SearchIndexService.search"]:::llamada
  n7 --> n8
  n9["Llama a SearchIndexService.assertTenant"]:::llamada
  n8 --> n9
  n10{"!tenantId"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n10 -->|"sí"| n11
  n12["Llama a SearchIndexService.resolveIndex"]:::llamada
  n10 -->|"no"| n12
  n13{"!def"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n13 -->|"sí"| n14
  n15["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n13 -->|"no"| n15
  n16["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n15 -->|"cada elemento"| n16
  n17{"!allowed.includes(field)"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n17 -->|"sí"| n18
  n19["Repite: por cada const field de params.facets ?? []"]:::bucle
  n17 -->|"no"| n19
  n15 -->|"al terminar"| n19
  n20["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n19 -->|"cada elemento"| n20
  n21{"!allowed.includes(field)"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n21 -->|"sí"| n22
  n23{"params.geo"}:::decision
  n21 -->|"no"| n23
  n19 -->|"al terminar"| n23
  n24["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n23 -->|"sí"| n24
  n25{"!allowed.includes(field)"}:::decision
  n24 --> n25
  n26(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n25 -->|"sí"| n26
  n27["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n25 -->|"no"| n27
  n23 -->|"no"| n27
  n28["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n27 -->|"cada elemento"| n28
  n29{"!allowed.includes(field)"}:::decision
  n28 --> n29
  n30(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n29 -->|"sí"| n30
  n31["Llama a CommunityPublicService.nearbyFromSql"]:::llamada
  n7 -->|"si falla"| n31
  n32["Llama a PublicSearchRepository.nearbyProfiles"]:::llamada
  n31 --> n32
  n33[("LEE community.public_profiles · LEE common.addresses · LEE community.public_profiles")]:::efecto
  n32 --> n33
  n34["Llama a CommunityPublicService.signals"]:::llamada
  n33 --> n34
  n35["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n34 --> n35
  n36[("LEE community.service_reviews")]:::efecto
  n35 --> n36
  n37["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n36 --> n37
  n38[("LEE community.verified_badges")]:::efecto
  n37 --> n38
  n39["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n38 --> n39
  n40[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n39 --> n40
  n41["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n40 --> n41
  n42[("LEE common.addresses")]:::efecto
  n41 --> n42
  n43(("200 Responde con éxito")):::ok
  n29 -->|"no"| n43
  n27 -->|"al terminar"| n43
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 80. GET /public/posts/{postId}/comments

Comentarios raíz de una publicación pública

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de ruta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.postComments"]:::llamada
  n2 --> n3
  n4["Llama a CommunityPublicService.assertPostPublic"]:::llamada
  n3 --> n4
  n5["Llama a PublicSearchRepository.isPostPublic"]:::llamada
  n4 --> n5
  n6[("LEE community.social_posts · LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!(await this.repo.isPostPublic(em, postId))"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Publicación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PublicSearchRepository.listPublicRootComments"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a PublicSearchRepository.listPublicComments"]:::llamada
  n9 --> n10
  n11[("LEE community.comments · LEE community.public_profiles")]:::efecto
  n10 --> n11
  n12["Llama a PublicSearchRepository.listPublicCommentMedia"]:::llamada
  n11 --> n12
  n13[("LEE community.comment_media")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 81. GET /public/posts/{postId}/reactions

Quiénes reaccionaron a una publicación pública

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de ruta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.postReactions"]:::llamada
  n2 --> n3
  n4["Llama a CommunityPublicService.assertPostPublic"]:::llamada
  n3 --> n4
  n5["Llama a PublicSearchRepository.isPostPublic"]:::llamada
  n4 --> n5
  n6[("LEE community.social_posts · LEE community.public_profiles")]:::efecto
  n5 --> n6
  n7{"!(await this.repo.isPostPublic(em, postId))"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Publicación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PublicSearchRepository.listPostReactors"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE community.reactions · LEE community.public_profiles")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 82. GET /public/profiles/{prefijo}/{slug}

Ficha pública por prefijo de vertical

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"concept === undefined"}:::decision
  n2 --> n3
  n4(["404 NOT_FOUND No encontrado"]):::error
  n3 -->|"sí"| n4
  n5["Llama a CommunityPublicService.getBySlug"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND No encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CommunityPublicService.signals"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n10 --> n11
  n12[("LEE community.service_reviews")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n12 --> n13
  n14[("LEE community.verified_badges")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n16 --> n17
  n18[("LEE common.addresses")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n18 --> n19
  n20[("LEE community.social_posts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE profiles.practitioner_affiliations")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n24 --> n25
  n26[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n25 --> n26
  n27["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n26 --> n27
  n28[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n27 --> n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 83. GET /public/profiles/{prefijo}/{slug}/reviews

Opiniones publicadas de una ficha pública

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"concept === undefined"}:::decision
  n2 --> n3
  n4(["404 NOT_FOUND No encontrado"]):::error
  n3 -->|"sí"| n4
  n5["Llama a CommunityReviewsReadService.listPublicReviewsBySlug"]:::llamada
  n3 -->|"no"| n5
  n6["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n5 --> n6
  n7[("LEE community.public_profiles")]:::efecto
  n6 --> n7
  n8{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND No encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CommunityReviewsReadService.projectPage"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a CommunityReviewsReadService.resolveCursor"]:::llamada
  n10 --> n11
  n12["Llama a ReviewsRepository.findById"]:::llamada
  n11 --> n12
  n13[("LEE community.service_reviews")]:::efecto
  n12 --> n13
  n14{"!anchor || anchor.targetPublicProfileId !== profileId"}:::decision
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a ReviewsRepository.listByTargetPage"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE community.service_reviews")]:::efecto
  n16 --> n17
  n18["Llama a ReviewsRepository.listDimensionScores"]:::llamada
  n17 --> n18
  n19[("LEE community.review_dimension_scores")]:::efecto
  n18 --> n19
  n20["Llama a ReviewsRepository.listResponses"]:::llamada
  n19 --> n20
  n21[("LEE community.review_responses")]:::efecto
  n20 --> n21
  n22["Llama a ReviewsRepository.displayNamesByPerson"]:::llamada
  n21 --> n22
  n23[("LEE profiles.persons")]:::efecto
  n22 --> n23
  n24["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n23 --> n24
  n25[("LEE community.service_reviews")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 84. GET /public/search

Buscador público unificado

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 85. GET /public/search/diagnostic-units

Laboratorios y centros de diagnóstico

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 86. GET /public/search/insurers

Aseguradoras en el directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 87. GET /public/search/medications

Medicamentos ofertados públicamente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 88. GET /public/search/organizations

Organizaciones en el directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 89. GET /public/search/pharmacies

Farmacias en el directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 90. GET /public/search/practitioners

Profesionales en el directorio público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · parámetros de consulta (400) · parámetros de consulta (400) · parámetros de consulta (…"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.search"]:::llamada
  n2 --> n3
  n4{"specialtyConceptId"}:::decision
  n3 --> n4
  n5["Llama a MedicalSpecialtyCatalogService.assertIsMedicalSpecialty"]:::llamada
  n4 -->|"sí"| n5
  n6["Llama a MedicalSpecialtyCatalogService.listMemberIds"]:::llamada
  n5 --> n6
  n7{"members === null"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El catálogo de especialidades médicas no está disponible"]):::error
  n7 -->|"sí"| n8
  n9{"!members.has(specialtyConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La especialidad no pertenece al catálogo de especialidades médicas"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CatalogConceptsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n11 --> n12
  n13["Llama a PublicTerritoryFilterService.resolve"]:::llamada
  n12 --> n13
  n4 -->|"no"| n13
  n14{"department"}:::decision
  n13 --> n14
  n15["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n14 -->|"sí"| n15
  n16["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n15 --> n16
  n17[("LEE terminology.value_sets")]:::efecto
  n16 --> n17
  n18["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n17 --> n18
  n19[("LEE terminology.value_set_members")]:::efecto
  n18 --> n19
  n20{"members === null"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n20 -->|"sí"| n21
  n22{"!members.includes(conceptId)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n22 -->|"sí"| n23
  n24["Llama a CatalogConceptsRepository.findById"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
  n24 --> n25
  n26{"!departmentSigla"}:::decision
  n25 --> n26
  n27(["422 PRECONDITION_FAILED El departamento no tiene una sigla reconocible en el catálogo"]):::error
  n26 -->|"sí"| n27
  n28["Llama a PublicTerritoryFilterService.assertMember"]:::llamada
  n26 -->|"no"| n28
  n14 -->|"no"| n28
  n29["Llama a ValueSetsRepository.findByInternalCode"]:::llamada
  n28 --> n29
  n30[("LEE terminology.value_sets")]:::efecto
  n29 --> n30
  n31["Llama a ValueSetsRepository.findIncludedConceptIdsByValueSet"]:::llamada
  n30 --> n31
  n32[("LEE terminology.value_set_members")]:::efecto
  n31 --> n32
  n33{"members === null"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED El catálogo territorial no está disponible"]):::error
  n33 -->|"sí"| n34
  n35{"!members.includes(conceptId)"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED {options.mensaje}"]):::error
  n35 -->|"sí"| n36
  n37{"departmentSigla"}:::decision
  n35 -->|"no"| n37
  n38["Llama a CatalogConceptsRepository.findById"]:::llamada
  n37 -->|"sí"| n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40{"departmentSiglaOfMunicipalityCode(code) !== departmentSigla"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El municipio no pertenece al departamento elegido"]):::error
  n40 -->|"sí"| n41
  n42["Llama a CommunityPublicService.searchFromIndex"]:::llamada
  n40 -->|"no"| n42
  n37 -->|"no"| n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44["Llama a SearchIndexService.search"]:::llamada
  n43 --> n44
  n45["Llama a SearchIndexService.assertTenant"]:::llamada
  n44 --> n45
  n46{"!tenantId"}:::decision
  n45 --> n46
  n47(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n46 -->|"sí"| n47
  n48["Llama a SearchIndexService.resolveIndex"]:::llamada
  n46 -->|"no"| n48
  n49{"!def"}:::decision
  n48 --> n49
  n50(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n49 -->|"sí"| n50
  n51["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n49 -->|"no"| n51
  n52["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n51 -->|"cada elemento"| n52
  n53{"!allowed.includes(field)"}:::decision
  n52 --> n53
  n54(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n53 -->|"sí"| n54
  n55["Repite: por cada const field de params.facets ?? []"]:::bucle
  n53 -->|"no"| n55
  n51 -->|"al terminar"| n55
  n56["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n55 -->|"cada elemento"| n56
  n57{"!allowed.includes(field)"}:::decision
  n56 --> n57
  n58(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n57 -->|"sí"| n58
  n59{"params.geo"}:::decision
  n57 -->|"no"| n59
  n55 -->|"al terminar"| n59
  n60["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n59 -->|"sí"| n60
  n61{"!allowed.includes(field)"}:::decision
  n60 --> n61
  n62(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n61 -->|"sí"| n62
  n63["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n61 -->|"no"| n63
  n59 -->|"no"| n63
  n64["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n63 -->|"cada elemento"| n64
  n65{"!allowed.includes(field)"}:::decision
  n64 --> n65
  n66(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n65 -->|"sí"| n66
  n67["Llama a PublicSearchRepository.searchProfiles"]:::llamada
  n65 -->|"no"| n67
  n63 -->|"al terminar"| n67
  n68{"filters.city"}:::decision
  n67 --> n68
  n69["Llama a PublicSearchRepository.targetIdsByCity"]:::llamada
  n68 -->|"sí"| n69
  n70[("LEE common.addresses")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 91. GET /s/{slug}

Ficha pública de una aseguradora

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CommunityPublicService.getBySlug"]:::llamada
  n2 --> n3
  n4["Llama a PublicSearchRepository.findPublicBySlug"]:::llamada
  n3 --> n4
  n5[("LEE community.public_profiles")]:::efecto
  n4 --> n5
  n6{"!profile || (expectedTargetConceptId && profile.targetTypeConceptId !== expectedTargetConceptId)"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND No encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CommunityPublicService.signals"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a PublicSearchRepository.ratingsByProfile"]:::llamada
  n8 --> n9
  n10[("LEE community.service_reviews")]:::efecto
  n9 --> n10
  n11["Llama a PublicSearchRepository.badgesByProfiles"]:::llamada
  n10 --> n11
  n12[("LEE community.verified_badges")]:::efecto
  n11 --> n12
  n13["Llama a PublicSearchRepository.agendaByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources · LEE scheduling.practitioner_schedules")]:::efecto
  n13 --> n14
  n15["Llama a PublicSearchRepository.locationsByOwner"]:::llamada
  n14 --> n15
  n16[("LEE common.addresses")]:::efecto
  n15 --> n16
  n17["Llama a PublicSearchRepository.listPublicPosts"]:::llamada
  n16 --> n17
  n18[("LEE community.social_posts")]:::efecto
  n17 --> n18
  n19["Llama a PublicSearchRepository.specialtiesByPractitioner"]:::llamada
  n18 --> n19
  n20[("LEE profiles.practitioner_specialties · LEE terminology.catalog_concepts")]:::efecto
  n19 --> n20
  n21["Llama a PublicSearchRepository.affiliationsByPractitioner"]:::llamada
  n20 --> n21
  n22[("LEE profiles.practitioner_affiliations")]:::efecto
  n21 --> n22
  n23["Llama a PublicSearchRepository.practiceSitesByPractitioner"]:::llamada
  n22 --> n23
  n24[("LEE practice.practitioner_role_assignments · LEE practice.practice_sites · LEE practice.practices · LEE commo…")]:::efecto
  n23 --> n24
  n25["Llama a PublicSearchRepository.engagementByPost"]:::llamada
  n24 --> n25
  n26[("LEE community.post_media · LEE community.reactions · LEE community.comments")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| DESCONOCIDO / | 200, 401, 403, 429 | 0 |
| DESCONOCIDO / | 200, 401, 403, 429 | 0 |
| DESCONOCIDO / | 200, 401, 403, 429 | 0 |
| DESCONOCIDO / | 200, 401, 403, 429 | 0 |
| GET /community/moderation/appeals | 200, 401, 403, 429 | 2 |
| GET /community/moderation/decisions | 200, 401, 403, 429 | 1 |
| GET /community/moderation/queue | 200, 401, 403, 429 | 2 |
| POST /community/public-profiles | 201, 400, 401, 403, 429 | 1 |
| GET /community/topics | 200, 401, 403, 429 | 1 |
| GET /internal/community/feed/pending | 200, 400, 401, 403, 429 | 3 |
| GET /internal/community/feed/ranking/pending | 200, 400, 401, 403, 429 | 4 |
| GET /public/posts | 200, 400, 401, 429 | 5 |
