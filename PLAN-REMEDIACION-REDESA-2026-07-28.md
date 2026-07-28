# Plan de remediación REDESA — 2026-07-28

Cierre de los pendientes detectados al cruzar specs (`REDESA_ESPECIFICACION_MAESTRA_CONSOLIDADA.md`
+ `REDESA_INFORME_AUDITORIA_CONTRADICCIONES.md`) contra el código real, verificados
adversarialmente contra los claims ✅ de `REDESA-TRAZABILIDAD.md`.

Prioridad: **P0** = un claim ✅ de la matriz que hoy no se sostiene ante auditoría externa;
**P1** = riesgo material acotado; **P2** = deuda / limpieza.

## Fase 1 — P0 · Auditoría transversal + WORM real en DB (CAN-AUDIT-001, C-19, §9 MISSING_AUDIT)

Problema: el hash-chain de `audit.audit_log` es correcto como *tamper-evidence*, pero
(a) `AuditModule` no exporta el repo/servicio → 0 emisiones fuera del módulo; firma/emisión
de receta y toda la clínica solo escriben a `logger`; (b) no hay WORM real en DB.

Acciones:
1. `AuditModule` exporta `AuditLogRepository` + un `AuditTrailService` fino e inyectable
   (append en la tx activa, resiliente a fallos: nunca tumba la operación de negocio).
2. Emitir `audit_event` en las mutaciones sensibles de mayor valor: receta
   (`issue/sign/invalidate/replace/renew`), periop (`confirm/cancel`), consent
   (`grant/withdraw/revoke`), break-glass, y asientos contables (`post/reverse`).
3. Migración DB: trigger `BEFORE UPDATE OR DELETE ON audit.audit_log` que `RAISE EXCEPTION`
   + `REVOKE UPDATE, DELETE` al rol de aplicación → tamper-resistance, no solo evidence.

## Fase 2 — P0 · PDP conjuntivo para PHI + propagación de revocación de consent (CAN-AUTH-001, C-07, C-20)

Problema: `authz-pdp.service.ts` resuelve por unión aditiva de `hasAllow`; un `role_permission`
ALLOW sobre recurso clínico concede acceso a cualquier paciente sin relación/grant/finalidad
(UNSCOPED_ACCESS). Además revocar un consent no invalida el `clinical_access_grant`.

Acciones:
1. Separar `nonClinicalAllow` (rol/política/excepción) de la señal de **alcance clínico**
   (grant clínico ∨ relación asistencial ∨ representación legal). Cuando la decisión es
   sobre datos de un paciente (`patientProfileId` presente), exigir señal de alcance clínico
   para `PERMIT` — el ALLOW por rol deja de ser suficiente por sí solo.
2. Al retirar/expirar un consent, revocar (soft-state) los `clinical_access_grants` que lo
   referencian; el PDP no volverá a concederlos.

## Fase 3 — P1 · Credencial real de equipo periop + notificación (CAN-INT-002, C-14)

Problema: la verificación de credenciales usa un *proxy* (estado `TEAM_ACCEPTED`), no consulta
la vigencia real en `iam`. El bloqueo solo hace `logger.warn`, no notifica.

Acciones:
1. En `confirmCase`, verificar vigencia real de credencial del profesional (perfil/credencial
   en `iam`), no solo el estado de aceptación del miembro. Fail-closed si vencida/suspendida/no
   verificada.
2. Emitir evento de notificación (outbox) al responsable y organización en el bloqueo.

## Fase 4 — P1 · Cross-domain promotions→payments por servicio (DIRECT_CROSS_DOMAIN_ACCESS)

Problema: `promotions-loyalty.repository.ts` escribe `Wallets`/`WalletLedgerEntries` directo,
saltándose las invariantes de partida doble de payments.

Acción: enrutar el movimiento de wallet por un contrato/servicio de payments.

## Fase 5 — P1 · Idempotencia en emisión de receta (CAN §6, MISSING_IDEMPOTENCY)

Problema: `issue()` no exige `Idempotency-Key`; doble emisión posible.

Acción: aplicar el mecanismo de idempotencia ya existente (usado en payments) a la emisión
de receta (y comandos repetibles equivalentes).

## Fase 6 — P2 · Cablear historial `*_history` (ORPHAN_TABLE real)

Problema: 108/113 tablas de historial sin escritor; no hay `EventSubscriber`.

Acción: `EventSubscriber` de MikroORM que puebla el historial de las entidades versionadas,
o retiro documentado de las que no correspondan.

## Fase 7 — P2 · Limpieza y verdad documental

1. Enum de receta: eliminar concepts muertos (`RENEWED/ACTIVE`) o implementarlos; alinear
   `REDESA-TRAZABILIDAD.md` con el enum real (sin `SIGNED/PARTIALLY_DISPENSED/DISPENSED/EXPIRED`).
2. Analizador `coverage-report.mjs`/`guardrails.mjs`: reconocer el `JwtAuthGuard` global para
   dejar de marcar los 23 endpoints como `UNSCOPED_MUTATION` (falsos positivos).
3. Actualizar `REDESA-TRAZABILIDAD.md` con el estado real tras la remediación.

## Verificación

Tras cada fase: `yarn redesa:guardrails`, `yarn redesa:coverage`, y las suites afectadas
(`authz-pdp.spec`, `medications.service.spec`, `periop-cases.service.spec`, `audit-log.repository.spec`,
`consents`, `ledger.service.spec`). Cierre: build (`nest build`) verde.
