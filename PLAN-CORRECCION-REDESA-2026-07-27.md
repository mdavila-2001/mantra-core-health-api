# Plan de corrección REDESA — reglas de negocio vs. implementación

**Fecha:** 2026-07-27
**Insumos:** `REDESA_ESPECIFICACION_MAESTRA_CONSOLIDADA.md` (reglas canónicas) + `REDESA_INFORME_AUDITORIA_CONTRADICCIONES.md` (C-01…C-20).
**Base de código:** 57 módulos NestJS + MikroORM + PostgreSQL (58 esquemas / 1182 tablas).
**Método:** se cruzaron las reglas canónicas contra el esquema real y los controladores/servicios. Este plan **toma las decisiones** sobre los puntos marcados `PENDIENTE_DE_APROBACIÓN` y las contradicciones, siguiendo la opción recomendada por el propio informe salvo justificación en contra.

> Estado de partida tras el trabajo de esta sesión: **RLS por tenant aplicado y probado**, MFA real, firmas HMAC de webhooks, y stubs de producción convertidos en implementaciones reales (ver `REMEDIACION-2026-07-27.md`). Este plan cubre lo que falta para cumplir las reglas REDESA.

---

## Las 3 contradicciones CRÍTICAS del informe (severidad "Crítica") y su resolución

El `INFORME_AUDITORIA_CONTRADICCIONES` marca **tres** hallazgos con severidad **Crítica**. Son el eje del plan:

1. **C-01 — Receta inmutable vs. ventana de edición de 1h.** Decisión **D-01**: la edición solo aplica a
   `DRAFT`; emitida = inmutable; corrección = invalidar + nueva receta. *Estado: máquina de estados
   implementándose sobre `clinical.medication_requests` (Fase 2).*
2. **C-02 — Cancelación: plazo fijo 24h vs. política configurable.** Decisión **D-02**: política
   **versionada** con snapshot en la cita, default 24h. *Estado: **implementado** (snapshot congelado en
   `appointment_bookings`, la cancelación evalúa la ventana del snapshot).*
3. **C-20 — Consentimiento/autorización sin modelo versionado.** El módulo `consent` ya existe; se refuerza
   con `care_relationship` (D-07) y el **evento de acceso de emergencia** (CAN-EMERG-001). *Estado: evento
   de emergencia **implementado** en el PDP; `care_relationship` explícita queda en Fase 2.*

---

## Parte A — Decisiones canónicas tomadas (cierran los `PENDIENTE`/contradicciones)

| # | Tema | Decisión tomada | Base |
| --- | --- | --- | --- |
| D-01 | **Receta emitida editable 1h** (C-01) | **NO.** La ventana de edición aplica **solo a `DRAFT`**. Emitida/firmada = inmutable; corrección = `INVALIDATED`/`REPLACED` + nueva receta relacionada. | Opción A recomendada; CAN-RX-002. |
| D-02 | **Plazo de cancelación** (C-02) | Política **versionada**; default **24h**; la cita guarda `cancellation_policy_version_id` (snapshot). Precedencia cita→servicio→sede→organización→profesional→plataforma. | CAN-APT-001. |
| D-03 | **Solicitud vs cita** | **Entidades/estados separados** con máquina de estados explícita; la propuesta de reprogramación NO sobrescribe la reserva original. | CAN-APT-002 / C-10. |
| D-04 | **Crédito publicitario** (CAN-ADV-001) | **Saldo prepago monetario** (`advertising_wallets` + `wallet_transactions`), NO línea postpago ni unidad mixta. Columna `credits` prohibida como concepto ambiguo. | C-04. |
| D-05 | **Firma de receta obligatoria** | **Parametrizable por país/tipo de medicamento/canal** (`prescription_signature_policy`), default = no exigida hasta decisión legal por jurisdicción. No bloquea el flujo hoy. | Pendiente legal; fail-safe. |
| D-06 | **Retención legal** (historias, recetas, auditoría, contabilidad) | **Parametrizable por jurisdicción** (`retention_policy` por tipo de recurso). El purgado real ya existe en `audit` (retención por ventana); se extiende a los demás dominios con la política. | Pendiente legal. |
| D-07 | **Duración de "médico tratante"** | **Configurable y revocable** con continuidad asistencial; `care_relationship` con `valid_from/valid_to`, `purpose`, `scope`. Revocable salvo atención en curso. | CAN-AUTH-001 / A-03. |
| D-08 | **Identidad vs membresía** | **Separadas.** Desvincular revoca membresía y permisos, no la identidad ni los actos históricos. La cuenta se desactiva solo si no queda ninguna membresía válida. | CAN-IDENT-001 / C-09. |
| D-09 | **Taxonomía de organización** | **Entidad raíz `organization` + perfiles por composición** (`*_profile`); `organization_type` NO es fuente de autorización. (Hoy: `directory.tenants` como raíz + módulos de perfil; se normaliza el nombre a "organization/tenant" y se documenta el mapeo). | C-05. |
| D-10 | **Política de borrado** | **Matriz transversal única** (invalidar/archivar/anonimizar/finalizar por dominio); **prohibido hard-delete** de datos clínicos/legales/financieros/auditables; nunca `ON DELETE CASCADE` sobre ellos. | CAN-DELETE-001 / C-08. |
| D-11 | **Encuestas vs reseñas** | **Entidades separadas**: `survey_response` (privada) ≠ `public_review` (pública, post-atención) ≠ `testimonial_consent`. Agregados solo anonimizados sobre umbral mínimo. | CAN-SURVEY-001 / C-15/16. |
| D-12 | **Contabilidad "sin contador"** | Automatiza captura/conciliación/borradores; cierres/tributario/decisiones sensibles exigen aprobación configurada; asiento `POSTED` se corrige por **reversión**, nunca edición. | CAN-FIN-001 / C-17. |
| D-13 | **Acceso a resultados** | Política explícita (paciente + representante + centro emisor + relación asistencial/autorización + emergencia justificada), NO lista cerrada "únicamente". | C-07. |
| D-14 | **Cambio de paciente en intervención** | `DRAFT`: corregible sin consentimientos/evidencias; desde `PENDING_CONFIRMATION`: cancelar y crear nueva; `CONFIRMED`: prohibido. `patient_id` fuera del update general tras salir de borrador. | CAN-INT-001 / C-13. |

---

## Parte B — Estado actual vs. reglas canónicas (matriz)

Leyenda: ✅ cumple · 🟡 parcial/con bug conocido · 🔴 falta.

| Regla canónica | Módulo(s) actuales | Estado | Acción correctiva |
| --- | --- | --- | --- |
| CAN-AUDIT-001 auditoría WORM append-only con actor/sesión/IP/finalidad + hash-chain | `audit.audit_log` (WORM, `previous_hash`/`record_hash` por partición de tenant) | 🟡 existe; **carrera** en el hash-chain bajo escritura concurrente | Serializar el append por partición (`FOR UPDATE` sobre fila de control o `advisory lock` por tenant). |
| CAN-RX-001..004 receta: draft editable, emitida inmutable, invalidar/reemplazar/renovar | `clinical.medication_requests`/`medication_records` + `pharmacy_inventory.medication_dispensations` | 🟡 estados `ACTIVE→COMPLETED`; sin PATCH/DELETE (bien); **falta** `DRAFT`, `ISSUED`, `INVALIDATED`, `REPLACED`, `SUPERSEDED` y sus transiciones | Completar la máquina de estados y los comandos `/issue`, `/invalidate`, `/replace`, `/renew` (no CRUD). |
| CAN-NOTE-001 notas: borrador editable, firmada inmutable, corrección por adenda | clinical (`@Patch(':id/amend')` en observaciones); chart-notes con firma/cofirma | 🟡 patrón de adenda presente en observaciones; **verificar** que notas finalizadas bloquean contenido y que la adenda es registro inmutable independiente | Auditar chart-notes/clinical-notes: bloquear mutación tras `FINALIZED`; adenda = fila nueva. |
| CAN-APT-001/002 citas: política versionada + snapshot, solicitud≠cita | `scheduling` (`cancellationWindowMinutes` configurable, cargo por tardía) | 🟡 ventana configurable; **falta** `cancellation_policy_version_id` snapshot en la reserva | Versionar la política y guardar la versión aceptada en la cita. |
| CAN-AUTH-001 acceso clínico por relación/autorización/finalidad/mínimo privilegio | `authz` (PDP + `clinical_access_grants`), `consent`, `delegated_access` | 🟡 existe; **bug**: el PDP concede ignorando acción/nivel (un grant READ permite DELETE) | Corregir el PDP para exigir acción+nivel+propósito; añadir `care_relationship` explícita. |
| CAN-EMERG-001 acceso de emergencia con motivo/registro/notificación/revisión | `authz.break_glass_sessions`, `profiles.emergency_staff_profiles` | 🟡 break-glass existe; **falta** el evento de acceso de emergencia con notificación posterior al paciente y revisión | Añadir `emergency_access_event` (motivo, datos consultados, notificación, revisión). |
| CAN-DELETE-001 sin hard-delete de datos protegidos | varios `@Delete` solo sobre config (files, pricing, sites, offerings, legal-holds) | ✅ sin `@Delete` sobre recetas/notas/auditoría/asientos | Verificar en CI (guardrail `HARD_DELETE_RESTRICTED_DATA`). |
| CAN-FIN-001 contabilidad: reversión, no edición de `POSTED` | `accounting` (partida doble, `POSTED→REVERSED`, locks) | ✅ núcleo correcto | Añadir estados `AUTO_CLASSIFIED`/`PENDING_REVIEW` si se requiere el flujo completo. |
| CAN-TIME-001 UTC + zona IANA congelada | audit/logging en UTC; políticas por zona | 🟡 **verificar** que las políticas (cancelación) evalúan con zona congelada en la operación | Guardar zona IANA en la cita/operación y evaluar con ella. |
| CAN-VERSION-001 versionado de políticas/consentimientos/campañas/… | consent, terminology (versiones), varios | 🟡 parcial por dominio | Estandarizar `*_version` + snapshot en la entidad que las consume. |
| RLS por tenant (precondición de todos los `.puml`) | **aplicado hoy** (`mantra_app` + FORCE RLS en 284 tablas, probado) | 🟡 aplicado en DB pero la app corre como `mantra` (bypassrls) | Interceptor de tenant por request + apuntar runtime a `mantra_app` (Fase 1). |
| Idempotencia (reservas, recetas, dispensaciones, pagos, invitaciones) | scheduling/payments/promotions con claves; **inventario NO consulta su idempotencyKey** | 🟡 | Enforzar idempotencia real en inventario + índices únicos (guardrail `MISSING_IDEMPOTENCY`). |
| Concurrencia (cupos, saldos, dispensaciones, estados) | scheduling (FOR UPDATE) ✅; **inventario sin lock** (oversell) | 🟡 | Locks pesimistas en inventario (patrón scheduling). |

---

## Parte C — Plan de corrección por fases

### Fase 0 — Ya hecho en esta sesión (base)
- Bug bloqueante de seed (conceptos duplicados) corregido → la app puede sembrar y operar.
- **RLS aplicado y probado** (aislamiento por tenant a nivel de base).
- Stubs de producción reales (read_models, integraciones/HTTP+HMAC, clinical_ext CDS/order-sets, audit retención, promotions wallet, ads cobro), **MFA real**, **firmas HMAC de webhooks**. 3523 tests unitarios verdes.

### Fase 1 — Activar el aislamiento por tenant en la app (🔴 P0, ~1-2 días)
1. **Interceptor de tenant por request**: lee el tenant del actor (header `X-Tenant-Id` o claim), **verifica membresía** en `directory.tenant_memberships` (o rol de sistema), y fija `SET app.current_tenant_id` en la transacción de la request.
2. **Emitir `tenantId`/`practiceIds` en el JWT** al login y propagarlos en `AuthenticatedUser`.
3. **Apuntar la conexión de runtime a `mantra_app`** (dejando `mantra` para migraciones/DDL/seed). Correr el smoke/integración con `mantra_app` y cerrar cualquier hueco de permisos.
4. Sustituir los `findById({id})` sensibles por scoping por tenant (o confiar en RLS como red y añadir `care_relationship` donde el `.puml` lo exige).

### Fase 2 — Correctitud de reglas clínicas/financieras (🟠 P1, ~1 semana)
5. **Máquina de estados de receta** (D-01): comandos `/issue`, `/invalidate`, `/replace`, `/renew`; prohibir toda mutación post-`ISSUED`. Guardrail `GENERIC_CRUD_ON_IMMUTABLE_RESOURCE`.
6. **Notas clínicas** (CAN-NOTE-001): bloqueo tras `FINALIZED`, adenda como fila nueva inmutable; firma/cofirma.
7. **PDP de acceso clínico** (bug): exigir acción+nivel+propósito; añadir `care_relationship` y `emergency_access_event` con notificación posterior.
8. **Hash-chain de auditoría**: serializar el append por tenant (cierra la carrera).
9. **Política de cancelación versionada** (D-02): `cancellation_policy_version_id` + snapshot en la cita; evaluar con zona IANA congelada.

### Fase 3 — Integridad de datos y concurrencia (🟠 P1, ~3-4 días)
10. **Inventario**: locks `FOR UPDATE` + idempotencia real (consultar `idempotencyKey`) + índices `UNIQUE`.
11. **Índices únicos de idempotencia** faltantes (cross_store, insurance prior-auth, ledger de inventario).
12. **Positividad/límites** de importes ya iniciada (payments/accounting); extender a erp/billing/insurance.

### Fase 4 — Cobertura y anti-huérfanos (🟡 P2, continuo)
13. **Matriz `Regla → Actor → Permiso → Caso de uso → Tabla → Endpoint → Evento → Prueba`** como artefacto vivo.
14. Reportar `ORPHAN_TABLE`/`ORPHAN_ENDPOINT` (script de CI, ver Parte D).
15. Completar los `PENDIENTE` que requieren decisión de negocio (D-05 firma, D-06 retención por jurisdicción, umbrales de anonimización).

### Fase 5 — Módulos 55/56/57 (Mongo/Redis/OpenSearch) (🟢 P3)
16. La infraestructura ya está levantada (Mongo 27018, Redis 6380, OpenSearch 9201). Decidir alcance e implementar `document_store`, `redis_runtime`, `search_platform` con el mismo patrón.

---

## Parte D — Guardrails automáticos de CI (criterios de rechazo REDESA)

Convertir en checks ejecutables (bloquean el build):

| Check | Detección | Estado hoy |
| --- | --- | --- |
| `HARD_DELETE_RESTRICTED_DATA` | `@Delete`/`nativeDelete`/`ON DELETE CASCADE` sobre esquemas clínicos/legales/financieros/audit | sin `@Delete` sobre inmutables ✅ (falta el check) |
| `GENERIC_CRUD_ON_IMMUTABLE_RESOURCE` | `@Patch`/`@Put`/`@Delete` sobre recetas emitidas, notas firmadas, `audit.*`, asientos `POSTED` | cumplido de facto; falta el check |
| `MISSING_AUDIT` | mutación sensible sin emitir evento de auditoría | parcial |
| `MISSING_IDEMPOTENCY` | operación repetible (reserva/receta/dispensación/pago) sin clave idempotente enforced | **falla en inventario** |
| `UNSCOPED_ACCESS` | endpoint autorizado solo por rol global, sin tenant/relación/propósito | mitigado por RLS + `@Roles`; falta scoping de objeto |
| `INVALID_STATE_TRANSITION` | transición fuera de la máquina declarada | falta declarar máquinas como datos |
| `UNVERSIONED_POLICY` | operación histórica atada a config mutable sin snapshot | falla en cancelación de citas |
| `DIRECT_CROSS_DOMAIN_ACCESS` | repositorio de un módulo toca tablas de otro dominio sin contrato | revisar |
| `ORPHAN_TABLE` / `ORPHAN_ENDPOINT` | tabla sin consumidor / endpoint sin UC | script pendiente |

---

## Resumen ejecutivo del plan

El código está **más avanzado** de lo que las reglas REDESA temían: ya existen auditoría WORM con hash-chain, modelo de consentimiento, access-grants, delegación, break-glass, versionado por dominio, y **desde hoy** aislamiento por tenant (RLS) real y probado. Los huecos son (1) **activar RLS en el runtime** (interceptor de tenant + rol `mantra_app`), (2) **completar máquinas de estado de inmutables** (recetas, notas) y corregir el **PDP** de acceso clínico, (3) **serializar el hash-chain** de auditoría, (4) **idempotencia/locks de inventario**, y (5) **snapshots de política versionada** en citas. Las decisiones de negocio pendientes quedan resueltas en la Parte A con la opción recomendada, dejando parametrizables las que dependen de jurisdicción (firma de receta, plazos de retención).
