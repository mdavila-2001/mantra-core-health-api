# Plan — Chat paciente ↔ farmacia a partir de un pedido

- Fecha: 2026-10-28 · Repos afectados: mantra-core-health-api · Predecesor: auditoría de huecos (sesión del orquestador)
- Resultado observable: el paciente dueño de un pedido y el personal de la farmacia del pedido abren (o reutilizan) el mismo hilo directo; el personal lee y responde en la bandeja de la vitrina de la farmacia; el paciente ve en sus pedidos el perfil de la vitrina.
- Kill-test: un usuario sin membresía activa en el tenant de la farmacia, con el `profileId` de la vitrina, lista conversaciones o envía como la farmacia y NO recibe 403.

## Alcance
- IN: `community` (visibilidad/autorización de mensajería, elegibilidad del destinatario, notificaciones, gateway, servicio de chat de organización); `pharmacy_inventory` (campos de vitrina en la vista del titular, `POST pharmacy/orders/:id/conversation`, puerto + adaptador a community).
- OUT: frontend; migraciones; búsqueda de contactos como farmacia; reportes de moderación firmados como farmacia; vínculo conversación ↔ pedido persistido (no hay columna).
- Ambigüedades registradas:
  1. Paciente sin perfil comunitario (ni privado). Supuesto: NO se crea (misma regla que `CommunityBookingChatService`): 422 tipificado `PATIENT_CHAT_PROFILE_MISSING`. Confirmar con producto.
  2. Roles de membresía que actúan como la organización. Supuesto: OWNER, ADMIN y STAFF activos; para vitrina PHARMACY además el rol runtime `PHARMACY_STAFF`. Confirmar con producto/seguridad.
  3. «Verificada»: perfil ACTIVO + PUBLIC (la proyección sólo ocurre al verificar el tenant) y tenant ACTIVO + VERIFICADO.

## H1 — Bandeja de organización
**CA:** Dado un miembro activo de la farmacia, cuando usa `profileId=<vitrina>` en la mensajería, entonces opera; un no miembro recibe 403/404 como hoy.
**DoD:** jest de `community-visibility`, `community-messaging`, `community-messaging-read`, gateway y notificaciones en verde.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Regla `actúa como organización` (membresía activa + rol) en visibilidad | no miembro → false | jest visibility | TODO |
| H1.S1.M2 | Mensajería usa la regla de mensajería en escritura | staff envía como farmacia | jest messaging | TODO |
| H1.S1.M3 | Lectura, adjuntos y presencia usan la regla | staff lista/lee | jest messaging-read | TODO |
| H1.S1.M4 | Gateway `join:*` usa la regla | staff se une a la sala | jest gateway | TODO |
| H1.S1.M5 | Destinatario PHARMACY/ORGANIZATION activo, público y verificado | sin 422 | jest messaging | TODO |
| H1.S1.M6 | Notificación de mensaje a vitrina de organización va a los miembros | no a `created_by_user_id` | jest notifications | TODO |

## H2 — Vitrina en los pedidos del titular
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `pharmacyPublicProfileId`/`pharmacyPublicSlug` en vista `owner` (null si no hay vitrina activa) y ausentes en vista staff | ver CA | jest pharmacy-orders | TODO |

## H3 — `POST pharmacy/orders/:id/conversation`
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Puerto `PharmacyOrderChatPort` + adaptador a community | compila | tsc | TODO |
| H3.S1.M2 | Caso de uso: titular o staff del tenant; idempotente; `{conversationId, pharmacyProfileId}` | tercero → 404 | jest pharmacy-orders | TODO |
| H3.S1.M3 | Servicio community de chat de pedido por canal de sistema, sin crear vitrina del paciente | sin perfil → 422 tipificado | jest community | TODO |

## Gates
- `tsc --noEmit`, eslint de los archivos tocados, jest dirigido. Int-specs: no se ejecutan (sin Postgres).

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| RLS (`app.current_tenant_id`) filtra perfiles/membresías de otro tenant | lecturas cruzadas vacías con RLS activo | se documenta; la mensajería ya es cross-tenant hoy |
| Sin Postgres | no se verifica el camino real | int-spec no ejecutado, declarado |
