# Plan — Teleconsulta: señalización WebRTC y servidores ICE

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (este) · Predecesor: ninguno
- Resultado observable: dos participantes de un `virtual_encounter` (médico y paciente del
  encuentro clínico) se conectan al namespace socket.io `/teleconsult` con su access token, se unen
  a la sala del encuentro y se reenvían `offer`/`answer`/`ice-candidate`; un tercero no entra
  (`ROOM_FULL`) y un ajeno tampoco (`NOT_A_PARTICIPANT`). `GET /virtual-encounters/:id/ice-servers`
  entrega STUN por defecto y TURN sólo si el entorno lo configura.
- Kill-test: un usuario que no es participante del encuentro emite `join` → si recibe `ok: true`,
  la autorización no está.

## Alcance
- IN: `clinical_ext/gateways/teleconsult.gateway.ts` (nuevo), `clinical_ext/teleconsult.env.ts`
  (nuevo), `clinical_ext/services/teleconsult-ice.service.ts` (nuevo),
  `clinical_ext/services/virtual-encounters.service.ts` (método de autorización reutilizable),
  `clinical_ext/controllers/virtual-encounters.controller.ts` (endpoint ICE),
  `clinical_ext/dto/virtual-encounter.dto.ts` (DTO de respuesta ICE),
  `clinical_ext/clinical_ext.module.ts` (registro), `app.module.ts` (esquema Joi), `.env.example`.
- OUT: UI de video y cliente del front — **no existe pantalla de consulta virtual** en
  `mantra-core-health` (origin/test): sólo la modalidad `TELECONSULTA` al agendar. No se construye
  UI (instrucción explícita). OUT: servidor TURN real (no hay contratado), grabación, SFU,
  adaptador Redis de socket.io para multi-réplica.
- Decisiones registradas:
  - D-TC-01 Autorización: se reutiliza exactamente `requireEncounterParticipant` del servicio
    (paciente del encuentro, médico primario o participante activo; tenant por membresía del token
    porque en el socket no hay `X-Tenant-Id`). No se inventa otra regla.
  - D-TC-02 Sesión `COMPLETED` no admite señalización (`SESSION_CLOSED`): no tiene sentido
    negociar medios para una sesión cerrada. `SCHEDULED` e `IN_PROGRESS` sí.
  - D-TC-03 Capacidad 2 sockets por sala (consulta 1:1). Re-`join` del mismo socket es idempotente.
  - D-TC-04 TURN: dos formas, excluyentes — credencial estática (`USERNAME`+`CREDENTIAL`) o
    efímera HMAC-SHA1 estilo coturn `use-auth-secret` (`SECRET`, TTL). Configuración parcial =
    error de arranque. Sin TURN, log de arranque explícito.

## H1 — Señalización autorizada por sala
**CA:** Dado médico y paciente del encuentro conectados, cuando ambos hacen `join` y uno emite
`offer`, entonces el otro recibe `offer` con el mismo `sdp` y el emisor no lo recibe.
**DoD:** spec con socket.io real en proceso (Nest + IoAdapter, puerto efímero) en verde.
**Estado:** TESTED

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.M1 | `VirtualEncountersService.assertSignalingParticipant` | ajeno → Forbidden; completada → Precondition | spec del servicio en verde | TESTED |
| H1.M2 | Gateway `/teleconsult`: auth en middleware del namespace (patrón efaf5129) | sin token → `connect_error` | spec gateway | TESTED |
| H1.M3 | `join`/`leave`/disconnect + `peer-joined`/`peer-left` | tercero → `ROOM_FULL` | spec gateway | TESTED |
| H1.M4 | Relay `offer`/`answer`/`ice-candidate` con validación de tamaño | sin unirse → `NOT_IN_ROOM`; sdp enorme → `INVALID_PAYLOAD` | spec gateway | TESTED |

## H2 — Servidores ICE por entorno
**CA:** Dado un entorno sin TURN, cuando se pide `GET /virtual-encounters/:id/ice-servers`,
entonces sólo viene STUN y `turnConfigured: false`; con TURN incompleto, el proceso no arranca.
**DoD:** spec del parser/servicio en tres niveles (correcto, límite, inválido) en verde.
**Estado:** TESTED

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | `parseTeleconsultIceEnv` + esquema Joi | TURN parcial → lanza | spec | TESTED |
| H2.M2 | `TeleconsultIceService` (HMAC efímero, log de arranque) | sin TURN → log "solo STUN" | spec | TESTED |
| H2.M3 | Endpoint `GET :id/ice-servers` con la misma autorización | ajeno → 403 | spec del controlador | TESTED |

## Verificación
`npx tsc --noEmit -p tsconfig.json`, `npx eslint <archivos>`, `npx jest <specs> --maxWorkers=2`.
