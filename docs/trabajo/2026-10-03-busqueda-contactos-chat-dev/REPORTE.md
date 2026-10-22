# Reporte — Búsqueda de contactos del chat en dev

- Fecha: 2026-10-03. Plan: [PLAN.md](./PLAN.md).
- Rama: marcelo/feat-busqueda-contactos-chat.
- Evidencia alcanzada: TESTED; sin verificación E2E desplegada.
- Avance: 5 / 5 microtareas (100%).

## Completado

| ID | Resultado | Comando | Evidencia literal |
|---|---|---|---|
| H1.S1.M1 | DTO y ruta POST incorporados | `yarn test --runInBand` con cuatro specs afectados | `Test Suites: 4 passed, 4 total` |
| H1.S1.M2 | Lectura restringida; rechazo de perfil ajeno antes de consulta | mismo comando | `Tests: 54 passed, 54 total` |
| H1.S2.M1 | Backend compilado | `docker build --target build -t alovida-chat-api-build:dev .` | salida 0, `#15 DONE 12.6s` |
| H1.S2.M2 | Diff revisado y lint dirigido limpio | `git diff --check HEAD`; ESLint en ocho archivos | ambos salida 0 |

| H1.S2.M3 | PR publicado contra dev | `gh pr view 548 --json url,baseRefName,headRefName` | `baseRefName: dev`; `headRefName: marcelo/feat-busqueda-contactos-chat` |

[Resumen de evidencia](./evidencia/VALIDACION.txt).

## A medias

- SQL real y sesión del frontend no ejercitados. Se portó el contrato existente de test sin cambiar la creación de conversaciones.

## No hecho

- Merge y despliegue; cambios de frontend, escrituras de mensajería y migraciones: fuera del alcance.
- CI remoto completo: pendiente; no se afirma que pasó. Se aplica la preferencia previa del usuario de entregar PRs listos para revisión.

PR: https://github.com/mdavila-2001/mantra-core-health-api/pull/548.

## Contrato y riesgos

POST `/community/conversations/contacts/search`, JWT requerido por el guard global. Cuerpo: `profileId` UUID propio, `q` texto de 2–80 caracteres, `limit` opcional 1–20 (10 predeterminado). Respuesta: `{ items: [{ profileId, displayName, headline, avatarUrl }] }`. Cache-Control privado/no-store; texto de búsqueda en el cuerpo.

La consulta conserva el comportamiento existente de test: perfiles públicos activos de pacientes o profesionales, sin perfil propio ni bloqueos activos en cualquier dirección. La búsqueda indexada usa prefijos y variantes de una tilde por palabra; no se amplía su semántica en este port.

No se tocaron secretos, datos ni contenedores del despliegue. Los contenedores de comprobación usan `--rm`; no se dejan procesos temporales.
