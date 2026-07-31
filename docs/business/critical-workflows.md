# Flujos críticos

> Fase 9. Dos flujos de punta a punta documentados con el nivel de detalle exigido por el plan
> maestro (§7): problema de negocio, actor, precondiciones, flujo principal/alternativo, reglas,
> estados, validaciones, datos, endpoints, eventos, permisos, fallos, evidencia y métricas. Ambos
> derivados de código real (`src/modules/scheduling/README.md`, `src/modules/consent/README.md`,
> `src/modules/authz/`), no de una narrativa hipotética. Otros módulos tienen su propio flujo
> detallado en [su README mirado](../modules/index.md); estos dos son representativos de los
> patrones que se repiten en el resto del sistema.

## 1. Ciclo de vida de una cita (`scheduling`)

**Problema de negocio:** coordinar un recurso limitado (agenda de un profesional/quirófano) entre
demanda simultánea, sin doble reserva, con reglas de cancelación/no-show y lista de espera.

**Actor principal:** `PATIENT` (reserva), `SCHEDULING_AGENT`/`SCHEDULING_ADMIN` (configuración),
`PRACTITIONER` (excepciones de disponibilidad), `SYSTEM_WORKER` (expiración/promoción).

**Precondiciones:** existe un recurso agendable con política de reserva y al menos una plantilla
con slots materializados (`generate-slots`).

**Flujo principal:**

1. `POST /scheduling/slots/:id/holds` — toma un slot con `SELECT ... FOR UPDATE`, decrementa
   `remaining_capacity` (nunca baja de cero).
2. `POST /scheduling/holds/:holdToken/confirm` — dentro del TTL del hold (`hold_ttl_seconds`,
   300s por defecto), confirma → `appointment_bookings` en estado `confirmed` + se programan
   recordatorios.
3. `POST /scheduling/bookings/:id/check-in` — el día de la cita, pasa a `checked_in`.

**Flujos alternativos:**

- **Reprogramar** (`POST /scheduling/bookings/:id/reschedule`): libera el cupo de origen, toma el
  de destino.
- **Cancelar** (`POST /scheduling/bookings/:id/cancel`): libera el cupo; cobra cargo por
  inasistencia solo si la política define `no_show_fee_amount` **y** se marca como no-show — una
  cancelación avisada nunca se cobra.
- **Hold vencido**: `POST /scheduling/internal/expire-holds` (worker) recicla el cupo. Un hold
  vencido no se puede confirmar aunque el worker aún no haya corrido.
- **Excepción de disponibilidad** (`POST /scheduling/resources/:id/exceptions`): bloquea slots
  libres solapados — **no cancela** citas ya confirmadas (decisión clínica explícita, no efecto
  colateral automático).
- **Lista de espera**: `POST /scheduling/waitlist` inscribe; el worker
  (`promote-waitlist`) marca candidatos cuando hay cupo, pero **no reserva por ellos** — el
  paciente confirma por el flujo normal.

**Reglas de negocio:** anti-double-booking vía bloqueo pesimista (`FOR UPDATE`); límite de holds
activos por paciente (`max_active_per_patient`); generación de slots idempotente (slots existentes
= `skipped`, tope de 2000 por ejecución).

**Estados y transiciones:** `open → held → confirmed → checked_in` (camino feliz);
`held → expired` (vencimiento); `confirmed → rescheduled | cancelled`.

**Validaciones:** capacidad del slot ≥ 1 antes de otorgar el hold; TTL del hold vigente al
confirmar; excepción de disponibilidad no afecta slots ya `held`/`confirmed`.

**Datos utilizados:** `schedulable_resources`, `booking_policies`, `schedule_templates`,
`bookable_slots`, `availability_exceptions`, `slot_holds`, `appointment_bookings`,
`booking_reschedules`, `booking_cancellations`, `waitlist_entries`, `appointment_reminders`.

**Endpoints involucrados:** 14 (UC-41-01 a UC-41-14) — tabla completa en
[`docs/modules/scheduling.md`](../modules/scheduling.md).

**Eventos producidos/consumidos:** recordatorios despachados vía
`POST /scheduling/internal/dispatch-reminders` (worker) — mecanismo de entrega documentado en
eventos (Fase 11 — pendiente al momento de escribir este flujo).

**Permisos:** `SCHEDULING_ADMIN` (configuración), `SCHEDULING_AGENT`/`PATIENT` (holds,
confirmación, reprogramación, cancelación, lista de espera), `PRACTITIONER` (sus propias
excepciones), `SYSTEM_WORKER` (endpoints internos).

**Fallos posibles:** slot sin capacidad (409/412), hold vencido al confirmar (412), límite de
holds activos por paciente excedido (409).

**Evidencia en pruebas:** suite unitaria del módulo `scheduling` — ver
la documentación de pruebas unitarias (Fase 15 — pendiente al momento de escribir este flujo).

**Métricas operativas:** no instrumentadas de forma dedicada en esta fase — ver
observabilidad (Fase 14 — pendiente al momento de escribir este flujo) para métricas de negocio críticas
pendientes de definir (tasa de no-show, tiempo de espera promedio en lista de espera).

---

## 2. Consentimiento y acceso clínico (`consent` + `authz`)

**Problema de negocio:** el acceso a PHI no puede depender solo de un rol (`CLINICIAN`) — debe
respetar el consentimiento y la relación asistencial vigentes del paciente concreto, y reaccionar
de inmediato cuando ese consentimiento se retira.

**Actor principal:** `PATIENT` (otorga/retira consentimiento), `CLINICIAN`/`PRACTITIONER`
(solicita acceso), `COMPLIANCE_OFFICER`/`PRIVACY_OFFICER` (supervisión).

**Precondiciones:** existe una relación asistencial (`CareRelationshipsRepository`) o una
representación legal vigente entre el profesional y el paciente.

**Flujo principal:**

1. `POST /consent/consents` — captura consentimiento de directiva de privacidad (+ provisiones +
   evento `granted`).
2. El PDP clínico (`authz-pdp.service.ts`) evalúa cada acceso posterior a PHI de ese paciente
   contra: rol global (RBAC) **Y** `ClinicalAccessGrantsRepository` **Y** relación asistencial
   vigente **Y** rango de la acción (`READ`/`WRITE`/`DELETE`) vs. nivel del grant.
3. El profesional accede a PHI solo si las cuatro condiciones se cumplen simultáneamente.

**Flujos alternativos:**

- **Retiro de consentimiento** (`POST /consent/consents/{id}/withdraw`): dispara re-evaluación de
  accesos activos — no es un flag pasivo, invalida el acceso hacia adelante.
- **Objeción del paciente** (`POST /consent/patient-objections`): puede materializar una
  restricción de privacidad de inmediato (UC-07-07) o quedar pendiente de resolución
  (`POST /consent/patient-objections/{id}/resolve`, `upheld`/`rejected`).
- **Autorización HIPAA específica** (`POST /consent/hipaa-authorizations`): divulgación puntual a
  un tercero, revocable independientemente (`.../revoke`) del consentimiento general.
- **Expiración**: `POST /consent/internal/expiration-sweep` (worker) barre consentimientos
  vencidos.
- **Break-the-glass** (módulo `authz`): acceso de emergencia excepcional fuera del flujo normal,
  auditado explícitamente — no documentado en detalle en esta fase, ver
  `docs/security/access-control.md` (Fase 13).

**Reglas de negocio:** las bases legales de procesamiento son versionadas — una nueva *supersede*
a la anterior, nunca la reemplaza en el histórico. La evidencia de consentimiento es append-only e
inmutable (`consent.consent_evidence`, IMMUTABLE) — un consentimiento otorgado no se edita ni
borra, solo se revoca hacia adelante.

**Estados y transiciones:** consentimiento `granted → withdrawn`; objeción
`raised → upheld | rejected`; base legal `active → superseded`.

**Validaciones:** un acceso a PHI sin relación asistencial vigente se rechaza aunque el rol sea
correcto; el rango de la acción debe estar cubierto por el nivel del grant
(`READ` < `WRITE`/`CREATE` < `DELETE`/`EXECUTE`/`APPROVE`).

**Datos utilizados:** `consent.consents`, `consent.consent_provisions`, `consent.consent_events`
(append-only), `consent.consent_evidence` (inmutable), `consent.hipaa_authorizations`,
`consent.patient_objections`, `consent.privacy_restrictions`,
`consent.processing_legal_bases` (versionada); del lado `authz`:
`ClinicalAccessGrantsRepository`, `CareRelationshipsRepository`,
`PatientLegalRepresentationsRepository`.

**Endpoints involucrados:** 12 en `consent` (UC-07-01 a UC-07-12,
[`docs/modules/consent.md`](../modules/consent.md)) + evaluación de decisión en `authz`
(`EvaluateDecisionDto` → `DecisionResponseDto`).

**Eventos producidos/consumidos:** evento `granted` al capturar consentimiento; invalidación de
caché de decisión del PDP tras revocación (`InvalidateCacheDto`) — ver
eventos (Fase 11 — pendiente al momento de escribir este flujo).

**Permisos:** captura y retiro por el propio `PATIENT` o su representante legal; evaluación de
decisión y break-the-glass restringidos a roles clínicos con alcance verificado.

**Fallos posibles:** `403 FORBIDDEN` (rol insuficiente), acceso denegado por PDP pese a rol válido
(alcance clínico no vigente — no es un error, es la regla funcionando).

**Evidencia en pruebas:** `src/modules/authz/services/authz-pdp.service.spec.ts`,
`src/modules/authz/services/authz-clinical.service.spec.ts` (existencia verificada en
`git status`/estructura del repositorio).

**Métricas operativas:** no instrumentadas de forma dedicada en esta fase — candidato para
`docs/observability/service-level-objectives.md` (Fase 14): tasa de accesos denegados por PDP,
latencia de evaluación de decisión.
