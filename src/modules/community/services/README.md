# Servicios — Community

Poseen la unidad de trabajo (`em.transactional`) y aplican las reglas de negocio;
`flush` del padre antes de los hijos. Cada servicio trae su `*.spec.ts` unitario
(mockea repos y `EntityManager`).

| Servicio                     | Casos de uso                                                 |
| ---------------------------- | ------------------------------------------------------------ |
| `CommunitySocialService`     | perfil (bootstrap), UC-01, UC-02, UC-03, UC-04, UC-05, UC-14 |
| `CommunityMessagingService`  | conversación (bootstrap), UC-06, UC-07                       |
| `CommunityModerationService` | UC-08, UC-09, UC-10                                          |
| `CommunityReviewsService`    | UC-11                                                        |
| `CommunityGroupsService`     | grupo (bootstrap), UC-13                                     |
| `CommunityPollsService`      | encuesta (bootstrap), UC-12                                  |
| `CommunityFeedService`       | UC-15                                                        |
