# Revisión del módulo `community` — ALOVIDA

## Alcance y resultado

Se revisaron perfiles públicos, publicaciones, comentarios, medios, mensajería, moderación, reseñas, encuestas, grupos, feed y superficie anónima. `corepack yarn test src/modules/community --runInBand --silent` aprobó **41 suites y 616 pruebas**, con dos advertencias preexistentes de imports JSON. No se confirmó un hallazgo nuevo en la superficie examinada.

## Controles confirmados

La API pública está marcada `@Public()` pero acotada a 60 solicitudes por minuto por IP; la descarga de medios públicos usa una comprobación de pertenencia a avatar/portada o contenido publicado ([`community-public.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/community/controllers/community-public.controller.ts#L82-L620), [`community-public.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/community/services/community-public.service.ts#L660-L700)). Las proyecciones anónimas enumeran campos manualmente para no filtrar `tenantId`, `targetId`, IDs de archivo ni conceptos internos ([`community-public.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/community/services/community-public.service.ts#L221-L240), [`community-public.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/community/services/community-public.service.ts#L1270-L1380)). Repositorio y servicio exigen perfil y publicación públicos antes de exponer medios, reacciones o comentarios.

La mensajería y sus adjuntos exigen que el perfil pertenezca al actor y que participe activamente en la conversación; los recursos ajenos responden como inexistentes ([`community-messaging-read.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/community/services/community-messaging-read.service.ts#L101-L205)).

| Caso | Prueba dirigida a conservar | Resultado esperado |
| --- | --- | --- |
| Correcto | Publicación y perfil públicos aparecen en feed y directorio | `200`, sólo proyección permitida |
| Límite | Página de directorio con cursor y máximo de resultados | continuidad sin duplicados y límite aplicado |
| Error | Medio de post privado, moderado o autor no público | `404`, sin bytes ni metadatos |
| Falla catalogada | Visitante anónimo pide un slug despublicado | `404/RESOURCE_NOT_FOUND/COMMUNITY_PUBLIC_RESOURCE_NOT_FOUND` con razón estable |

## Cobertura pendiente

Mantener la integración real de lecturas públicas y añadir regresión que compare claves de cada DTO público contra la lista permitida cuando se agreguen campos a perfiles, medios o posts. El límite de bandeja de mensajería de 100 conversaciones está documentado y requiere métrica de uso antes de ampliarse.
