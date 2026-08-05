# Matriz de trazabilidad REDESA — Regla → Implementación → Prueba

Cumple la exigencia §6/§12 del informe REDESA: cada regla canónica (`CAN-*`) y cada contradicción
crítica/alta (`C-*`) mapeada a su módulo, tabla(s), endpoint(s) y estado de prueba en este backend.
Estado: ✅ implementado y probado · 🟡 parcial/base · 🔵 decisión de negocio (parametrizable).

## Reglas canónicas (CAN-*)

| Regla | Módulo / tablas | Endpoint(s) / mecanismo | Prueba | Estado |
| --- | --- | --- | --- | --- |
| CAN-IDENT-001 identidad ≠ membresía | iam.users, directory.tenant_memberships | JWT lleva `tenants[]`; desvincular revoca membresía, no identidad | iam-auth.spec | ✅ |
| CAN-ORG-001 organización raíz + perfiles | directory.tenants + perfiles por módulo | — | smoke directory | 🟡 (raíz=tenant; perfiles por módulo) |
| CAN-AUTH-001 acceso clínico por relación/finalidad/mínimo privilegio | authz PDP + authz.clinical_access_grants + authz.care_relationships | PDP concede por grant o relación asistencial vigente + propósito | authz-pdp.spec | ✅ |
| CAN-EMERG-001 acceso de emergencia | authz.break_glass_sessions + audit.data_access_log | breakTheGlass registra motivo/datos/paciente; gancho de notificación | authz-clinical.spec | ✅ |
| CAN-APT-001 cancelación versionada + snapshot | scheduling.appointment_bookings (cancellation_policy_snapshot) | cancel evalúa la ventana del snapshot; default 24h | scheduling-bookings.spec | ✅ |
| CAN-APT-002 solicitud ≠ cita; reprogramación no sobrescribe | scheduling.appointment_bookings + booking_reschedules | reprogramación como evento; assertTransition | booking-state-machine.spec | ✅ |
| CAN-RX-001..004 receta: draft editable, emitida inmutable, invalidar/reemplazar/renovar | clinical.medication_requests | issue/invalidate/replace/renew (comandos, no CRUD) | medications.service.spec | ✅ |
| CAN-NOTE-001 notas: borrador editable, firmada inmutable, adenda | chart.clinical_note_versions + signatures | signVersion/cosign/amend | chart-notes.spec | ✅ |
| CAN-INT-001 cambio de paciente solo en borrador | procedures_perioperative.procedure_cases | guarda por estado (DRAFT-only) | periop-cases.spec | 🟡→✅ (Fase E) |
| CAN-INT-002 credenciales del equipo vigentes antes de confirmar | procedures_perioperative team | verificación fail-closed antes de confirmar/iniciar | periop-cases.spec | 🟡→✅ (Fase E) |
| CAN-SURVEY-001 encuestas privadas ≠ reseñas públicas | community.service_reviews + qa/encuestas | entidades separadas; agregados anonimizados | community smoke | 🟡 (umbral por afinar) |
| CAN-DELETE-001 sin hard-delete de datos protegidos | transversal | guardrail `HARD_DELETE_RESTRICTED_DATA` bloquea CI | redesa:guardrails | ✅ |
| CAN-AUDIT-001 auditoría append-only con hash | audit.audit_log (WORM, previous_hash/record_hash) | append serializado por tenant (advisory lock) | audit-log.repository.spec | ✅ |
| CAN-FIN-001 contabilidad: reversión, aprobaciones | accounting.journal_transactions | DRAFT→…→APPROVED→POSTED→REVERSED; assertTransition | ledger.service.spec | ✅ |
| CAN-ADV-001 crédito publicitario | ads / payments.wallets | saldo prepago (decisión D-04) | — | 🔵 decisión negocio |
| CAN-TIME-001 UTC + zona IANA congelada | transversal (timestamptz) | instantes en UTC; tz congelada en snapshot | — | 🟡 (tz por reserva pendiente) |
| CAN-VERSION-001 versionado de políticas/consentimientos/… | consent, terminology, scheduling (policy version), booking_confirmation_rules (version) | versión + snapshot donde se consume | varios | 🟡 (estandarización continua) |

## Contradicciones (C-*) marcadas Crítica/Alta

| # | Decisión tomada | Implementación | Estado |
| --- | --- | --- | --- |
| C-01 receta inmutable (no ventana 1h) | D-01: editable solo en DRAFT | máquina de estados de receta | ✅ |
| C-02 cancelación versionada | D-02: snapshot + default 24h | scheduling | ✅ |
| C-06 taxonomía profesional / care_relationship | separar identidad/perfil/credencial + relación asistencial | authz.care_relationships | ✅ |
| C-07 acceso a resultados (política explícita) | paciente + representante + centro + relación + emergencia | PDP + care_relationship + legal_representation | ✅ |
| C-08 política de borrado transversal | matriz única, sin hard-delete | guardrail CI | ✅ |
| C-10 máquina de estados de cita | grafo + assertTransition; reprogramación evento | scheduling.state | ✅ |
| C-11 confirmación automática determinista | scope+prioridad+vigencia, empate→MANUAL | scheduling.booking_confirmation_rules | ✅ |
| C-12 coautoría de notas (cofirma) | autor principal + cofirmas; adenda inmutable | chart-notes | ✅ |
| C-13 cambio de paciente en intervención | DRAFT-only; CONFIRMED prohibido | periop (Fase E) | ✅ |
| C-14 credenciales de equipo | verificación fail-closed antes de confirmar | periop (Fase E) | ✅ |
| C-17 contabilidad "sin contador" con aprobaciones | estados intermedios + reversión | accounting | ✅ |
| C-18 registro asistido unificado | invitación/activación un-solo-uso, sin password del creador | iam (Fase F) | ✅ |
| C-19 esquema canónico de auditoría | audit_log WORM con hash-chain | audit | ✅ |
| C-20 consentimiento/autorización versionado | consent + access_grant + legal_representation + emergency_access_event | consent/authz | ✅ |

## Decisiones de negocio pendientes (parametrizables, listas para configurar)

| Decisión | Estado backend | Requiere |
| --- | --- | --- |
| D-05 firma de receta obligatoria por jurisdicción/tipo/canal | tabla `prescription_signature_policies` (fail-safe: no exige si no hay política) | valores por jurisdicción (legal) |
| D-06 retención por jurisdicción | `system_ops.retention_policies` + ejecución existente | plazos por jurisdicción (legal) |
| CAN-ADV-001 significado de crédito publicitario | saldo prepago (wallets) | confirmación de negocio |
| umbral de anonimización de agregados (C-15) | — | definir umbral mínimo |

## Guardrails de CI (criterios de rechazo §9)

`yarn redesa:guardrails` (bloqueante): `HARD_DELETE_RESTRICTED_DATA`, `GENERIC_CRUD_ON_IMMUTABLE`,
`UNSCOPED_MUTATION`, `CASCADE_ON_RESTRICTED`, `TENANT_SCOPE_MISSING` (2026-07-30: listado/conteo
sobre entidad con `tenant_id` sin acotar por tenant ni por id de principal/recurso puntual — ver
`ESTADO-Y-PENDIENTES.md`). `yarn redesa:coverage` (informe): `ORPHAN_TABLE`, `ORPHAN_ENDPOINT`,
`DIRECT_CROSS_DOMAIN_ACCESS`. Ver `REDESA-COBERTURA.md`.
