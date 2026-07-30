# Auditoría integral del backend — mantra-core-health-api

**Fecha:** 2026-07-27 · **Alcance:** los 57 módulos de dominio + infraestructura transversal + capa ORM/esquema.
**Método:** 9 auditorías paralelas (infra, ORM y 7 grupos de dominio) por lectura línea a línea de
controllers/services/repositories/DTOs, más verificación de primera mano del patrón de scoping de queries,
guards y configuración de arranque. Baseline: `yarn build` limpio; 354 suites / 3504 tests unitarios.

> Los tests actuales son **unitarios con `EntityManager` mockeado**: verifican reglas de negocio, no
> tocan base de datos. Los bloqueos pesimistas, UNIQUE, FK y transacciones reales **no están verificados**.

---

## 1. Veredicto ejecutivo

La arquitectura por capas es sólida y homogénea (guard global fail-closed, filtro de error que sanea 5xx,
`ValidationPipe` con `whitelist+forbidNonWhitelisted+transform` que cierra mass-assignment, catálogo ORM
muy cuidado). Pero hay **cuatro fallos sistémicos** que atraviesan casi todos los módulos y que, juntos,
hacen que el sistema **no sea seguro para producción con datos clínicos reales** hasta remediarlos:

1. **Sin aislamiento por tenant (IDOR cross-tenant sistémico).** El JWT y `AuthenticatedUser` no llevan
   `tenantId`/`practiceId`; el patrón dominante de repositorio es `findById(em, id)` → `em.findOne(E, { id })`
   (solo PK); no hay RLS en la base. Resultado: cualquier usuario autenticado que conozca/adivine un UUID
   lee o modifica datos de otro tenant en casi todos los endpoints `/:id`. Solo 25 de 329 repos filtran por
   `practice_id`.
2. **Autorización por rol ausente en ~30 controllers mutantes** (muchos de PHI): clinical, clinical_ext,
   diagnostics, chart, insurance, forms, telemetry, community, common, authz-clinical. Con `JwtAuthGuard`
   global pero **sin `@Roles`**, cualquier autenticado ejecuta la operación (liberar resultados, firmar
   notas, emitir prior-auth, otorgar consentimiento…).
3. **MFA es un stub.** `iam-mfa.service.ts` marca el factor verificado sin validar ningún TOTP (`otplib`
   nunca se importa) y el login no exige MFA aunque el factor esté "activo". El segundo factor no existe.
4. **Webhooks públicos sin verificación de firma.** Pagos, tracking, messaging, integrations e
   integration_contracts aceptan callbacks `@Public()` cuyo campo `signature` nunca se verifica → un tercero
   fuerza `PI_SUCCEEDED` (pago fraudulento), marca envíos `DELIVERED`, o falsea acuses de entrega.

A ello se suman fallos de arranque/config (secreto JWT con default inseguro, sin helmet/rate-limit, DDL en
cada boot) y carreras de concurrencia no cubiertas (oversell de inventario, secuencias de ledger, índices
"únicos" que no son únicos).

### Recuento por severidad (agregado, ~250 hallazgos)

| Grupo | CRIT | HIGH | MED | LOW |
| --- | ---: | ---: | ---: | ---: |
| Infra transversal | 1 | 3 | 7 | 9 |
| ORM / esquema | 0 | 4 | 5 | 5 |
| IAM / seguridad (g1) | 2 | 11 | 26 | 13 |
| Clínico / PHI (g2) | 4 | 25 | 30 | 17 |
| Pharmacy / practice (g3) | 2 | 4 | 5 | 6 |
| Comercio / dinero (g4) | 1 | 2 | 5 | 10 |
| Platform / ops (g5) | 0 | 2 | 3 | 2 |
| Data / integración (g6) | 1 | 1 | 10 | 8 |
| Poliglota / avanzado (g7) | 4 | 5 | ~6 | ~8 |
| **Total aprox.** | **~15** | **~57** | **~97** | **~78** |

Detalle línea a línea en `scratchpad/audit/*.md` (archivos de trabajo por grupo) — resumido abajo.

---

## 2. Hallazgos CRITICAL (bloqueantes de despliegue)

| # | Ubicación | Fallo |
| --- | --- | --- |
| C1 | `common/auth/auth.env.ts:15,31` | `JWT_SECRET` con default `dev-only-insecure-secret-change-me` y sin gate por `NODE_ENV`: si falta en prod, se firma/verifica con secreto público del repo → forja de JWT con `SUPERADMIN`. |
| C2 | `iam/services/iam-mfa.service.ts:70` | Verificación MFA es no-op: marca el factor verificado sin validar TOTP; `otplib` nunca se usa. |
| C3 | `iam/services/iam-auth.service.ts:60` | Login nunca exige MFA aunque `mfaStatusConceptId` esté activo: entra solo con password. |
| C4 | `payments/services/payments-transactions.service.ts:158` | Webhook `@Public()` `applyCallback` no verifica firma (`signature` del DTO nunca se usa) → forzar `TXN_CAPTURED`/`PI_SUCCEEDED`: pago fraudulento. |
| C5 | `common/services/files.service.ts:396` | `generateDownloadUrl(fileId)` sin actor ni propiedad: URL firmada de cualquier archivo PHI por UUID (IDOR cross-tenant). |
| C6 | `pharmacy_inventory/.../medication-dispensations.service.ts:90-139` + `stock-positions.repository.ts:33` | Oversell por carrera: read-modify-write de `onHandQuantity` sin `FOR UPDATE`; ningún método de inventario usa lock pesimista. |
| C7 | `pharmacy_inventory/services/inventory-reservations.service.ts:77-131` | Sobre-reserva por carrera: mismo patrón sobre `availableQuantity`/`reservedQuantity`. |
| C8 | `.../SQL/62_cross_store_consistency/04_indexes.sql:5-89` | Los índices `uq_*` son `CREATE INDEX`, no `UNIQUE`: ninguna clave de idempotencia que el código da por garantizada está reforzada → doble entrega en un patrón *at-least-once*. |
| C9 | `object_storage/services/object-governance.service.ts:501-562` | Bypass de legal hold / retención: `requestDeletion` no comprueba holds/retención sobre todas las versiones del manifiesto multi-versión → borra un objeto bajo retención legal. |
| C10 | `object_storage/controllers/dicomweb.controller.ts:44` + `dicom.repository.ts:66` | Exfiltración PHI cross-tenant: `resolveInstance` (WADO-RS) resuelve por UID sin scoping de tenant y devuelve `objectManifestId`/`versionId` → signed-URL de imagen clínica de otro tenant. |
| C11 | `object_storage/dto/object-storage.dto.ts:171` + `object-storage.service.ts:486` | `providerUri` suministrado por el cliente (`@IsString()` sin allowlist) se devuelve como URL "firmada" → substitución de datos / SSRF. |
| C12 | `diagnostics/services/diagnostics-lab.service.ts:199` / `diagnostics-reports.service.ts:122,235` | `verifyResult`/`releaseVersion`/`acknowledgeCritical` sin `@Roles` ni scoping: cualquiera libera resultados y **acusa notificaciones de resultados críticos** (suprime alertas de seguridad clínica). |
| C13 | `procedures_perioperative/services/periop-cases.service.ts:106` | `scheduleCase` crea casos quirúrgicos con `custodianTenantId`/`patientProfileId` del body sin validar el tenant del actor (IDOR de PHI, extensible a todas las rutas `:id`). |
| C14 | `vector_rag/services/retrieval.service.ts:228-274` | `rankCandidates` autoriza chunks por la política del documento sin comprobar colección/tenant de la sesión → fuga de PHI cross-tenant en RAG. |
| C15 | `graph_intelligence/services/graph-traversal.service.ts:134` | `updateAccessScope` con lookup id-only sin tenant → un admin amplía/suspende el alcance de acceso al grafo de otro tenant. |

---

## 3. Hallazgos HIGH (selección — inventario completo en los archivos por grupo)

**Autorización / IDOR**
- `authz/controllers/authz-clinical.controller.ts:29` + `authz-pdp.service.ts:218` — clinical-access-grants sin `@Roles`; el PDP concede ignorando acción/nivel (un grant READ permite DELETE).
- `delegated_access/services/delegated-access-evaluation.service.ts:184` — `evaluate` ignora membresía del permission-set y scopes: cualquier grant activo → `allowed:true` para todo.
- `clinical/services/diagnostic-reports.service.ts:101` / `service-requests.service.ts:52` — release y creación de órdenes sin scoping paciente/tenant.
- `chart/services/chart-notes.service.ts:189` — `signVersion` firma con `signerProfileId` del body y sin `@Roles`: falsificación de firma clínica vinculante.
- `health_data/services/data-release.service.ts:276` — FHIR `$everything` con `custodian` opcional → devuelve la historia del paciente de **todos** los tenants.
- `community/services/community-social.service.ts:124` — publish/comment con `profileId` del body sin propiedad: suplantación de cualquier perfil.
- `time_series/services/series-query.service.ts:133` — `queryRange` usa `tenantId` del DTO como único filtro → lectura de vitales/ubicación de otro tenant.
- `vector_rag/services/vector-governance.service.ts:332` — `publishRagPolicy` id-only antes del check de tenant.
- `geo/controllers/geo-tracked-subjects.controller.ts:63` — última posición (PII) sin scoping de tenant.

**Autenticación / config**
- `main.ts` — sin helmet (cabeceras de seguridad) y sin rate limiting (`@nestjs/throttler` ausente): login/refresh públicos abiertos a fuerza bruta.
- `common/auth/jwt.strategy.ts:17` — algoritmos de verificación no fijados (`algorithms:['HS256']` ausente).

**Concurrencia / integridad**
- `pharmacy_inventory/repositories/ledger.repository.ts:35` — `nextSequence = max()+1` sin lock ni UNIQUE: ledger no monotónico.
- `insurance/controllers/prior-auth.controller.ts:26` (+appeals/claims/coverage/broker-commission) — sin `@Roles`: cualquiera emite determinaciones de pagador.
- `pharmacy_inventory/...dispensations.service.ts:81` — `idempotencyKey` persistido pero nunca consultado: retries duplican movimientos de stock.
- `cross_store_consistency` — IDOR en `findTargetForUpdate`/`findRequestForUpdate`/`findAttemptForUpdate` (id-only): un worker marca `VERIFIED`/`COMPLETED` el borrado (derecho al olvido) de otro tenant.

**Comercio / dinero**
- `payments/dto/payment-transaction.dto.ts:114` — `CreateRefundDto.amount` solo `@IsNumberString()`: reembolso negativo → sobre-reembolso.

**ORM / esquema**
- `orm/config/orm.env.ts:85` — `ORM_SCHEMA_SYNC='safe'` por defecto: DDL en cada arranque de cada réplica en prod.
- `orm/bootstrap/layers/06-foreign-keys.layer.ts:135` — 5993 FK con `VALIDATE` (sin `NOT VALID`) en el arranque: `ACCESS EXCLUSIVE` + escaneo completo bajo advisory lock → stall de boot.
- `orm/bootstrap/layers/04-tables.layer.ts:138` — no-destructividad basada en un único regex deny-list + `splitStatements` por `;` sin parser.

**Verificación de firma (bug lógico)**
- `common/services/contact-points.service.ts:79` — `verify()` ignora el `code` y marca `verified=true`: bypass de verificación de email/teléfono (usable para recuperación de cuenta).

---

## 4. Trabajo incompleto / stubs detectados

| Módulo | Elemento | Estado |
| --- | --- | --- |
| iam | MFA enroll/verify (secret_encrypted nunca escrito/leído) | **stub** — no valida TOTP |
| clinical_ext | `cds.service.evaluate` (fabrica alerta ALTA por regla, ignora `logicJson`); `order-sets.apply` no persiste órdenes | **stub** en flujo clínico |
| read_models | `runRefresh` (REFRESH MATERIALIZED VIEW nunca se ejecuta); `public-projections` devuelven `records:[]` | **stub** — miente éxito |
| integrations / integration_contracts | despacho outbound y entrega de webhook **simulados** (`simulateFailure`/`signatureVerified` los dicta el cliente) | **stub** de I/O externa |
| audit | `applyRetention` reporta éxito sin ejecutar retención | **stub** |
| promotions | `awardReferral` tipo `WALLET_CREDIT` retorna `undefined` (no paga) | **incompleto** (README "Pendiente") |
| ads | reintento de cobro/payment-intent encolado pero no implementado | **incompleto** |
| pharmacy_inventory | idempotencia real y bloqueo de stock | **incompleto** |
| diagnostic_units | reproject UC-23-12 | **incompleto** |
| procedures_perioperative | ruta de creación de checklist de seguridad / verificación preop | **incompleto** |

---

## 5. Pendientes transversales ya conocidos por el equipo (confirmados)

De `ESTADO-Y-PENDIENTES.md §5`, todos **confirmados** por esta auditoría:
- **RLS por tenant** — no existe en API ni en SQL. Es la causa raíz del tema §1.1.
- **Tests de integración contra DB real** — el andamiaje existe (`yarn test:integration`), sin poblar.
- **Auditoría de endpoints como check de CI** — el script vivía fuera del repo; `casos_de_uso/*.puml` **no está en este checkout**, por lo que el cruce exacto UC↔ruta no es reproducible aquí.
- **Módulos 55/56/57** (Mongo/Redis/OpenSearch) — sin carpeta; fuera de reparto.

---

## 6. Hoja de ruta de remediación (prioridad → esfuerzo)

### P0 — Antes de cualquier despliegue (bloqueante)
1. **Identidad de tenant + RLS** (raíz de la mayoría de CRIT/HIGH):
   a. Emitir `tenantId`/`practiceIds` en el JWT al login y propagarlos en `AuthenticatedUser`.
   b. Interceptor/`AsyncLocalStorage` por request que fije `SET LOCAL app.current_tenant` en la transacción.
   c. `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` por `tenant_id` en `database/SQL`.
   d. Scoping por tenant en los `findById` de los repos (o confiar en RLS como red).
2. **`@Roles` en los ~30 controllers mutantes** que hoy no lo tienen (ver §2/§3).
3. **MFA real** (TOTP con `otplib`, cifrado de `secret_encrypted`) y exigirlo en login cuando esté activo.
4. **Verificación de firma HMAC** en todos los webhooks públicos, con secreto por conexión.
5. **Hardening de arranque**: exigir `JWT_SECRET` en prod, `algorithms:['HS256']`, helmet, rate-limit, Swagger y `MIKRO_ORM_DEBUG` gated por entorno, `/health`.

### P1 — Integridad de datos
6. Bloqueo pesimista + idempotencia real en inventario (patrón de `scheduling` como referencia).
7. `UNIQUE` real en índices `uq_*` de idempotencia (cross_store, inventory, insurance, prior-auth).
8. Positividad/límites en importes y cantidades (payments/accounting/erp/billing/inventory).
9. `ORM_SCHEMA_SYNC` default `off`; FK con `NOT VALID` fuera del path de arranque.

### P2 — Observabilidad y limpieza
10. No volcar SQL con valores (ORM debug + slow-query log) — redactar parámetros.
11. Redacción de logs a allowlist; no loguear identificadores de paciente en claro.
12. Completar los stubs (CDS, read-models refresh, integraciones outbound, retención de audit).

---

## 7. Qué se remedia en esta pasada

Ver `REMEDIACION-2026-07-27.md` (cambios aplicados) — se priorizaron los fixes **seguros, aditivos
y verificables sin base de datos**, manteniendo los 3504 tests en verde: hardening de arranque, `@Roles`
en los controllers sin autorización, y endurecimiento de validación de DTOs. Los ítems arquitectónicos
(RLS/tenant, MFA real, firmas de webhook, RLS de la base) se dejan diseñados en §6 porque implementarlos a
ciegas —sin base de datos de verificación y sin decisiones de negocio sobre el modelo de tenant— tiene más
riesgo de romper el sistema que de asegurarlo.
