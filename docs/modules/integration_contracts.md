<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/integration_contracts/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `integration_contracts`

**Fuente:** [`src/modules/integration_contracts/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integration_contracts/README.md)
· 2 controllers · 4 services · 9 repositories · 9 entidades · 13 DTO

---

# Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`)

Gobierna contratos de integración B2B con proveedores externos (ministerios,
aseguradoras, farmacias): definición y versionado de contratos, perfiles de
autenticación sender-constrained (OAuth2 confidencial + mTLS/DPoP), suscripciones
de webhook, intercambios idempotentes con intentos/reintentos, cursores de
sincronización monótonos y evidencia firmada de entrega de webhooks.

## Endpoints (UC → ruta)

| UC | Método y ruta | Resumen | Status |
|----|---------------|---------|--------|
| UC-31-01 | `POST /integration/contracts` | Definir contrato (DRAFT) | 201 |
| UC-31-02 | `POST /integration/contracts/{id}/versions` | Publicar versión (max+1, DRAFT) | 201 |
| UC-31-03 | `POST /integration/contracts/{id}/auth-profiles` | Configurar perfil de autenticación (ACTIVE) | 201 |
| UC-31-04 | `POST /integration/contracts/{id}/webhook-subscriptions` | Suscribir webhook (contrato ACTIVE) | 201 |
| UC-31-05 | `POST /integration/contracts/{id}/exchanges` | Intercambio idempotente inbound (replay por clave) | 201 |
| UC-31-06 | `POST /integration/contracts/{id}/exchanges/{recordId}/attempts` | Registrar intento outbound | 201 |
| UC-31-07 | `POST /integration/exchanges/{recordId}/retry` | Reintentar intercambio fallido | 201 |
| UC-31-08 | `POST /integration/contracts/{id}/sync-cursors/{scope}/advance` | Avanzar cursor de sincronización (monótono) | 200 |
| UC-31-09 | `POST /integration/webhooks/{subscriptionId}/deliveries` | Entregar y verificar webhook firmado | 201 |
| UC-31-10 | `POST /integration/contracts/{id}/versions/{versionId}/activate` | Activar versión y transicionar estado | 200 |
| UC-31-11 | `POST /integration/contracts/{id}/retire` | Retirar contrato (soft-delete lógico) | 200 |
| UC-31-11 | `POST /integration/contracts/{id}/auth-profiles/{apId}/rotate` | Rotar credenciales del perfil | 200 |

## Entidades (`entities/`)

`integration_contracts`, `integration_contract_versions`, `integration_auth_profiles`,
`contract_webhook_subscriptions`, `integration_exchange_records`,
`integration_exchange_attempts`, `integration_idempotency_records`,
`integration_sync_cursors`, `webhook_delivery_evidence`.

## Reglas de negocio

- **Ciclo de vida del contrato**: DRAFT → ACTIVE (al activar la primera versión) →
  RETIRED. Solo se publican versiones sobre contratos DRAFT o ACTIVE.
- **Versiones**: `version_number = max+1`; una sola versión ACTIVE con
  `effective_to` nulo (la previa pasa a SUPERSEDED al activar otra).
- **Idempotencia** (UC-31-05): la clave viene por header `idempotency-key` o en el
  cuerpo; si la clave ya existe se hace *replay* (no reejecuta); `request_hash`
  distinto bajo la misma clave → 409.
- **Reintento** (UC-31-07): solo si el último intento fue FAILED y no PERMANENT.
- **Cursor** (UC-31-08): avance estrictamente monótono; un `cursor_value` menor o
  igual → 422. El endpoint crea el cursor si no existe.
- **Webhook ACTIVE**: suscribir exige contrato ACTIVE; entregar exige suscripción
  ACTIVE dentro de `valid_from/valid_to` y versión ACTIVE del contrato.
- **Secretos**: credenciales y claves de firma se guardan como *referencias* a
  secret-manager; nunca plaintext ni en logs.

## Persistencia

- Servicios inyectan `EntityManager` (`@mikro-orm/postgresql`) y escriben con
  `em.transactional`. FKs son columnas uuid planas → `flush` del padre antes del
  hijo (idempotencia → registro → intento; registro → evidencia).
- `rowVersion` nunca se fija (DEFAULT 1 en BD). `createdAt/updatedAt` vía
  `createdBy(actor.id)`; `touch(entity, actor.id)` en updates.

## Permisos y logs

- Guard global de auth; todas las operaciones son gobernadas → `@Roles('SECURITY_ADMIN')`.
- Logs Pino estructurados (`operation`, ids); nunca secretos ni PHI.
- Excepciones de dominio: `ResourceNotFoundException` (404), `ConflictException`
  (409), `PreconditionFailedException` (422).

## Conceptos

`integration_contracts.concepts.ts` exporta `INTEGRATION_CONTRACTS_CONCEPT_SEEDS`
(para el seed) e `ICON` (mapa nombre→UUID que consumen los servicios).

## Tests

- Unitarios (`*.spec.ts`): 4 servicios + 2 controllers, mocks de repos/EM. 46 casos.
- Smoke transversal: `test/smoke/modules/integration_contracts.smoke.ts`
  (`INTEGRATION_CONTRACTS_SMOKE`), encadena el ciclo completo del contrato.

