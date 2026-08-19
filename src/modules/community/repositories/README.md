# Repositorios — Community

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la transacción y los repos sean mockeables.
Sin reglas de negocio; solo consultas y `em.create(..., { partial: true })` con
`createdBy`. `row_version` nunca se fija.

| Repositorio                | Entidades                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PublicProfilesRepository` | `public_profiles`                                                                                         |
| `PostsRepository`          | `social_posts`, `post_media`, `hashtags`, `content_hashtags`, `mentions`                                  |
| `CommentsRepository`       | `comments`                                                                                                |
| `ReactionsRepository`      | `reactions`                                                                                               |
| `BookmarksRepository`      | `bookmarks`                                                                                               |
| `FollowsRepository`        | `social_follows`                                                                                          |
| `BlocksRepository`         | `user_blocks`                                                                                             |
| `ConversationsRepository`  | `conversations`, `conversation_participants`, `direct_messages`, `message_receipts`                       |
| `ModerationRepository`     | `content_reports`, `moderation_queue`, `moderation_decisions`, `moderation_strikes`, `moderation_appeals` |
| `ReviewsRepository`        | `service_reviews`, `review_dimension_scores`                                                              |
| `PollsRepository`          | `polls`, `poll_options`, `poll_votes`                                                                     |
| `GroupsRepository`         | `groups`, `group_members`                                                                                 |
| `FeedRepository`           | `feed_items`                                                                                              |
