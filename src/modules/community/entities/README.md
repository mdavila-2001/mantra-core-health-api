# src / modules / community / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `bookmarks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `comments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `content_hashtags.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `content_reports.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversation_participants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `direct_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `feed_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `feedback_ticket_comments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `feedback_ticket_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `feedback_tickets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `group_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `groups.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hashtags.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `mentions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_receipts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `moderation_appeals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `moderation_decisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `moderation_queue.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `moderation_strikes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `poll_options.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `poll_votes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `polls.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `post_media.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `post_shares.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prestige_awards.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prestige_scores.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `public_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `review_dimension_scores.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `review_responses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_reviews.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `social_follows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `social_notifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `social_posts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `topics.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_blocks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `verified_badges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
