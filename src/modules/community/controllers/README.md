# Controllers — Community

Capa fina: `@ApiTags`/`@ApiBearerAuth`, `@HttpCode` correcto, validación de params
con `ParseUUIDPipe`, `@CurrentUser`, delegación al servicio. Admin/worker con
`@Roles('SECURITY_ADMIN')`. Cada controller trae su `*.spec.ts` (mockea el servicio).

| Controller                      | Rutas                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommunitySocialController`     | `/community/public-profiles`, `/community/profiles/:id/posts`, `/community/comments`, `/community/reactions`, `/community/bookmarks`, `/community/follows`, `/community/blocks` |
| `CommunityMessagingController`  | `/community/conversations`, `/community/conversations/:id/messages`, `/community/conversations/:id/read`                                                                        |
| `CommunityModerationController` | `/community/reports`, `/community/moderation/queue/:id/decision`, `/community/moderation/decisions/:id/appeal`                                                                  |
| `CommunityReviewsController`    | `/community/profiles/:id/reviews`                                                                                                                                               |
| `CommunityGroupsController`     | `/community/groups`, `/community/groups/:id/members`                                                                                                                            |
| `CommunityPollsController`      | `/community/posts/:id/polls`, `/community/polls/:id/votes`                                                                                                                      |
| `CommunityFeedController`       | `/internal/community/feed/rebuild`                                                                                                                                              |
