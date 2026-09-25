# Contrato — Liquidación aseguradora ↔ profesional: exclusiones formales y lotes periódicos (H8 · MED-E13..E16)

- Versión: 1.0 · Fecha: 2026-09-24 · Estado: **propuesta para confirmación** de los propietarios nombrados en el HANDOFF §H8 del plan médico (Billing/Reporting y propietario del contrato de aseguradora). No es un acuerdo aceptado hasta que ellos lo firmen; los supuestos van marcados con su ambigüedad (`A0`–`A7`, definidas en [PLAN.md](../trabajo/2026-09-24-insurance-exclusions-settlement-contracts/PLAN.md)).
- Alcance: `mantra-core-health-api` módulo `insurance` (26). Sin cambios de DDL: toda pieza de esquema deseable se declara en §9 como handoff al dueño de `mantra-core-health-model`.
- Idioma: el documento está en castellano; los identificadores de código, columnas, rutas y campos JSON están en inglés y se citan tal cual.

## 1. Propósito y trazabilidad

Este contrato resuelve la fila «Factura, cobertura y lotes periódicos» del `HANDOFF.md` §H8 del plan médico (`AlovidaPromptManager/planes/02-medical-module-plan-b57dfd316c4d/HANDOFF.md`, copia idéntica en `mantra-core-health/docs/work/`), que dejaba **bloqueada** la liquidación de consultas y teleconsultas con seguro a la espera de: emisor/destinatario, cobertura e importes separados, calendario semanal/quincenal/mensual, idempotencia, reversión y cancelación, sin simular pago.

| Fuente | Qué exige | Dónde lo cubre este contrato |
|---|---|---|
| `📋 Registro de procesos por módulo.md` §6.2 ítems 1–4 (líneas 589–594 de la copia local) | La app responde APROBADO / NO APROBADO **indicando la cláusula del contrato y la excepción de la póliza**; al paciente sólo le interesa saber por qué no se aprobó | §3, §4, §5 |
| Ídem §2.7 ítem 4 (líneas 350–352) | La parte de la aseguradora se factura a la compañía **semanal, quincenal o mensualmente**; el médico saca un informe de lo facturado al seguro, con deducible y sin seguro | §7, §8, §12 |
| HANDOFF §H8 · MED-E13 | Emisor y destinatario correctos; sin fingir cobro | §2, §11 |
| HANDOFF §H8 · MED-E14 | Cobertura por consulta con importes del paciente y de la aseguradora separados | §3, §4, §12 (lo que sigue pendiente) |
| HANDOFF §H8 · MED-E15 | Calendario semanal/quincenal/mensual, idempotencia, reversión y cancelación | §7, §8, §9, §10 |
| HANDOFF §H8 · MED-E16 | Informe del profesional sin duplicar importes | §7 (totales), §12 (DTO) |
| MATRIX `RP-MED-L0264` (A MEDIAS), `L0265` (BLOQUEADO), `L0266` (A MEDIAS) | Los tres incisos del médico sobre facturación al seguro | §12 |
| Prompt Tarea 3 (2026-09-24) CA-3.1..CA-3.4 | Conciliación exacta, lote periódico, cláusula obligatoria, anti-tampering | §3, §4, §6, §7 |

Ambigüedad **A0**: el prompt cita el Registro en las líneas 488–491; en la copia local esas líneas pertenecen al módulo de análisis médicos. Se citan las líneas de la copia local.

## 2. Actores

| Actor | Cómo se identifica en el sistema | Qué puede hacer bajo este contrato |
|---|---|---|
| **Aseguradora** (pagador) | Tenant de tipo pagador; su fila en `insurance.insurance_carriers` se resuelve por `CatalogRepository.findCarrierByTenantId`. La administración activa se comprueba con `TenantAdministrationService.assertCanAdminister` vía `LinkedClaimAccessService.assertInsurer` | Adjudicar (`POST /insurance-claims/:id/adjudications`), publicar la EOB (`POST /insurance-claims/:id/eob`), revertir (`POST /insurance-claims/:id/reversals`), **generar el lote de corte** (`POST /practitioner-settlement-batches`) y leerlo |
| **Profesional / prestador** (emisor del reclamo y destinatario del lote) | `insurance_claims.billing_provider_entity_id` + `billing_provider_type_concept_id`: `BILLING_PROVIDER_TYPE_PRACTICE` → `practice.practices` (el consultorio o la clínica del médico); `…_PHARMACY` → farmacia; `…_DIAGNOSTIC_UNIT` → unidad diagnóstica. El alcance de lectura del prestador es el de `ClaimsReadService` (prácticas y unidades diagnósticas activas del tenant) | Presentar el reclamo, leer su detalle con el desglose (`GET /insurance-claims/:id`), **leer sus lotes** (`GET /practitioner-settlement-batches[/:id]`) |
| **Paciente** (titular de la cobertura) | `insurance.patient_coverages.patient_profile_id`; el actor se resuelve por el vínculo persistente de cuenta, nunca por un `pid` declarado (`PatientSettlementService`) | Ver la liquidación publicada de su pedido (`insuranceSettlement`) con las exclusiones y su cláusula |
| **Plataforma** | `SECURITY_ADMIN` / `SUPERADMIN` | Acceso administrativo transversal ya existente; este contrato no le agrega escrituras |
| **Billing / Reporting** (propietarios del handoff) | Personas | Confirmar §7–§11 y decidir lo que §12 deja abierto |

Ambigüedad **A4**: el HANDOFF habla del «médico». El mecanismo se define por `providerEntityId` + tipo de facturador y por eso cubre también farmacias y unidades diagnósticas sin cambiar nada; el nombre «practitioner» en rutas y DTOs conserva el foco del H8.

## 3. Vocabulario de importes y ecuación de conciliación

Todos los importes son **cadenas decimales exactas** (`numeric` de PostgreSQL). Se suman y comparan con `sumarDecimales` / `mismosDecimales` (`src/common/money/decimal-money.ts`, `BigInt` sobre la representación literal). **Está prohibido** pasar por `Number`, `parseFloat` o `toFixed` en cualquier paso de este contrato. La moneda es `insurance_claims.currency_concept_id`, que debe coincidir con la del plan (`insurance_plans.currency_concept_id`).

| Campo del contrato | Columna de origen | Significado |
|---|---|---|
| `totalBilledAmount` | `insurance_claims.total_amount` = Σ `insurance_claim_lines.billed_amount` | Lo que el prestador facturó por la atención |
| `totalApprovedAmount` | `claim_adjudication_versions.total_approved_amount` = Σ `claim_line_adjudications.approved_amount` | **Cubierto por la aseguradora**: lo que la aseguradora transfiere al prestador en el corte de lote |
| `totalPatientAmount` | `claim_adjudication_versions.total_patient_amount` = Σ `claim_line_adjudications.patient_amount` | **Copago / coaseguro / deducible confirmado**: lo que el prestador percibe del paciente en consulta o teleconsulta. Es responsabilidad adjudicada, no un saldo tras pagos |
| `totalDeniedAmount` | `claim_adjudication_versions.total_denied_amount` = Σ `claim_line_adjudications.denied_amount` | **Excluido**: ítems que la póliza no cubre. **No es deuda del paciente** ni crédito del prestador; queda sin asignar hasta una nueva versión o una apelación |

Ecuación obligatoria, por línea y por versión:

```text
billed_amount(línea)  = approved_amount + patient_amount + denied_amount
totalBilledAmount     = totalApprovedAmount + totalPatientAmount + totalDeniedAmount
```

En escritura la garantiza `validateLinkedClaimSettlement` (`linked-claim-validation.ts`: 422 si no cuadra). En lectura la vuelve a comprobar `buildClaimSettlementBreakdown` (`claim-settlement-breakdown.ts`) y expone `reconciled: boolean`; una lectura que no cuadra **se muestra con la alerta**, nunca redondeada para que cierre.

## 4. Exclusiones formales

Cada ítem denegado o con importe excluido viaja al paciente y al prestador con exactamente estos campos (`PatientInsuranceSettlementExclusionDto` y `ClaimExclusionDto`):

| Campo | Origen | Regla |
|---|---|---|
| `claimLineId` | `insurance_claim_lines.id` | Identifica la línea de servicio |
| `itemId` | `inventory_reservation_line_id` / `diagnostic_study_offering_id` / `service_concept_id` | Identifica la prestación o el fármaco |
| `itemName` | Nombre del producto, del estudio ofertado o `display` del concepto | Legible para el paciente |
| `amount` | `claim_line_adjudications.denied_amount` | Importe rechazado exacto |
| `policyClauseReference` | `claim_line_adjudications.policy_clause_reference` (v4.2.9) | **Obligatoria** cuando la decisión es `LINE_DECISION_DENIED` o `denied_amount > 0`. Es la referencia contractual visible: código estable seguido de la cita, por ejemplo `EXCL-PREEXIST-01 · Cláusula 4.1: preexistencia declarada al afiliarse`. El catálogo de códigos por aseguradora pertenece a su configuración de «lo que aprueba y no aprueba» (Registro §6.2 ítem 1) y no lo define este contrato |
| `denialRationale` | `claim_line_adjudications.denial_rationale` | Explicación comprensible del rechazo según póliza. Recomendada; `null` se muestra como «No informada» |

Consecuencias:

- **Escritura**: una adjudicación con exclusión y `policyClauseReference` vacía o en blanco responde **422** (`validateLinkedClaimSettlement`).
- **Lectura**: si una fila histórica llegó sin cláusula (adjudicaciones anteriores a v4.2.9 o reclamos sin pedido), la disponibilidad degrada a **`UNDER_REVIEW`**: la EOB no se presenta como cargo confirmado ni se publica al paciente como definitiva (`projectPatientSettlement`, `buildClaimSettlementBreakdown`).
- `reason_concept_id` (motivo tipificado) sigue existiendo y sigue sin catálogo real (P-16-4); complementa, no reemplaza, a la cláusula.

## 5. Ciclo del reclamo y estados

```text
CLAIM_SUBMITTED ──adjudicate──▶ CLAIM_ADJUDICATED ──publishEob──▶ (EOB_PUBLISHED) ──[hecho externo]──▶ CLAIM_PAID
       │                              │  ▲                                  │
       │                              │  └── adjudicate (versión N+1) ◀─────┘  (corrección: nunca edita N)
       │                              └──reverse──▶ CLAIM_REVERSED
```

- Conceptos (`insurance.concepts.ts`): `CLAIM_SUBMITTED`, `CLAIM_ADJUDICATED`, `CLAIM_PAID`, `CLAIM_REVERSED`, `ADJUDICATION_APPROVED` / `ADJUDICATION_DENIED` (versión), `LINE_DECISION_APPROVED` / `LINE_DECISION_DENIED` (línea), `EOB_PUBLISHED`.
- Versiones: `claim_adjudication_versions.adjudication_version` es 1..N y `supersedes_version_id` apunta a la anterior. La **vigente** es la que nadie sucede (`ClaimsReadService.currentVersion`); la cadena debe ser lineal (`projectPatientSettlement` degrada a `UNDER_REVIEW` ante saltos o duplicados).
- EOB: `patient_explanations_of_benefit` referencia reclamo + versión + `patient_profile_id` de la cobertura real; `published_at` es el instante que gobierna el corte (§8).
- Disponibilidad de la liquidación (idéntica para paciente y prestador):

| `availability` | Cuándo | Qué se muestra |
|---|---|---|
| `AVAILABLE` | Versión vigente con EOB publicada, cadena lineal, ecuación conciliada, toda exclusión con cláusula, reclamo `CLAIM_ADJUDICATED` o `CLAIM_PAID` | Los cuatro importes y las exclusiones |
| `PENDING_PUBLICATION` | Hay versión vigente sin EOB (incluye la versión N+1 recién creada) | «La aseguradora todavía no publicó la liquidación» |
| `UNDER_REVIEW` | Reclamo revertido, EOB duplicada o sin fecha, descuadre, exclusión sin cláusula, moneda o cobertura inconsistentes | «En revisión; el cargo al paciente no está confirmado» — y en el detalle del prestador, los importes con la alerta |
| `NOT_AVAILABLE` | No hay reclamo | Nada |

## 6. Inmutabilidad y corrección (CA-3.4)

1. `claim_adjudication_versions`, `claim_line_adjudications`, `patient_explanations_of_benefit` y `claim_reversals` son **append-only**. No existe ni existirá `PUT`/`PATCH`/`DELETE` bajo `/insurance-claims/:id/adjudications|eob|reversals`; el spec de controladores lo afirma.
2. Publicar la EOB de una versión que ya la tiene responde **409** (`ConflictException`, `ClaimsService.publishEob`).
3. Toda corrección de importes, copagos o cláusulas **después** de publicar se hace con `POST /insurance-claims/:id/adjudications`: crea la versión N+1 con `supersedes_version_id = N`, el reclamo vuelve a `CLAIM_ADJUDICATED`, la EOB de N deja de proyectarse (`PENDING_PUBLICATION`) hasta que se publique la de N+1, y N queda íntegra en `adjudicationHistory`.
4. Revertir sólo admite la versión vigente y deja `CLAIM_REVERSED` (`claim_reversals` con `idempotency_key` opcional). Un reclamo revertido nunca vuelve a `AVAILABLE`; se presenta un reclamo de reemplazo.
5. Las precondiciones de negocio responden **422** (`PreconditionFailedException`, `HttpStatus.UNPROCESSABLE_ENTITY`). Ambigüedad **A2**: el CA-3.4 menciona 412; el proyecto no usa 412 y este contrato no lo introduce.

## 7. Elegibilidad del lote de liquidación

Un lote (`PractitionerSettlementBatch`) agrupa, para una aseguradora y un prestador, los reclamos que quedaron **firmes** en un período. Un reclamo entra en el lote sólo si cumple **todas**:

| # | Regla | Motivo de exclusión (`excludedClaims[].reason`) |
|---|---|---|
| 1 | `insurance_claims.insurance_carrier_id` = aseguradora del lote y `billing_provider_entity_id` = prestador del lote | (no se carga) |
| 2 | `status_concept_id` ∈ {`CLAIM_ADJUDICATED`, `CLAIM_PAID`} | `NOT_ADJUDICATED` / `REVERSED` |
| 3 | No existe fila en `claim_reversals` para el reclamo | `REVERSED` |
| 4 | La versión vigente tiene EOB con `status_concept_id = EOB_PUBLISHED` y `published_at` no nulo | `EOB_NOT_PUBLISHED` |
| 5 | `published_at` cae dentro del período del lote (§8) | `OUT_OF_PERIOD` |
| 6 | `currency_concept_id` del reclamo = moneda del lote (la del primer reclamo elegible; un lote es monomoneda) | `CURRENCY_MISMATCH` |
| 7 | La ecuación de §3 concilia y toda exclusión trae cláusula | `NOT_RECONCILED` |
| 8 | El reclamo no figura en ningún otro lote de liquidación (cualquier estado) | `ALREADY_BATCHED` |

Los excluidos se **informan** con su motivo; no se inventan importes para ellos. Totales del lote (todos con `sumarDecimales`):

| Campo del lote | Definición | Rótulo para el profesional |
|---|---|---|
| `totals.totalBilledAmount` | Σ `totalBilledAmount` de los incluidos | Facturado en el período |
| `totals.totalApprovedAmount` | Σ `totalApprovedAmount` | **Total a transferir por la aseguradora** |
| `totals.totalPatientAmount` | Σ `totalPatientAmount` | **Total copagos percibidos en consulta** |
| `totals.totalDeniedAmount` | Σ `totalDeniedAmount` | **Total exclusiones aplicadas** |
| `totals.totalReversalAdjustmentAmount` | Σ (−`totalApprovedAmount`) de los reclamos que ya fueron incluidos en un lote anterior de la misma aseguradora y prestador y después fueron revertidos (§10) | Ajustes por reversión |

Ningún importe se cuenta dos veces: un reclamo pertenece a un solo lote (§9) y los ajustes van en su propio total, nunca netos dentro de `totalApprovedAmount`.

## 8. Calendario de corte

La cadencia es un **parámetro obligatorio** que declara la aseguradora al generar el lote (`cadence`), sin valor por defecto (ambigüedad **A3**: el plan médico pide no fijar unilateralmente semana/quincena/mes; este contrato ofrece las tres y deja la elección al acuerdo aseguradora–prestador). El período se deriva del `periodStart` declarado (fecha civil, zona `America/La_Paz`, la misma que usa `withinDates` en `linked-claim-access.service.ts`):

| `cadence` | `periodStart` admitido | `periodEnd` derivado |
|---|---|---|
| `WEEKLY` | Cualquier fecha | `periodStart + 6 días` |
| `BIWEEKLY` | Día 1 o día 16 del mes | Día 15, o último día del mes |
| `MONTHLY` | Día 1 del mes | Último día del mes |

Un `periodStart` no alineado responde **422**. El período es cerrado en ambos extremos en fechas civiles: incluye las EOB publicadas desde `periodStart 00:00:00` hasta `periodEnd 23:59:59.999` hora de La Paz. Ambigüedad **A5**: el criterio temporal es la **fecha de publicación de la EOB** (lo que quedó firme), no la fecha de envío ni la de atención.

Los cortes son independientes entre cadencias: no se mezclan lotes semanales y mensuales del mismo par en el mismo intervalo salvo que la aseguradora lo decida; la unicidad de §9 impide de todos modos que un reclamo caiga en dos.

## 9. Idempotencia y unicidad

1. **Clave natural** del lote: (`insurance_carrier_id`, `provider_entity_id`, `period_start`, `period_end`). Repetir `POST /practitioner-settlement-batches` con la misma clave **no crea otro lote**: responde el existente con `200` y `replayed: true` (la primera vez, `201` y `replayed: false`). No hace falta clave de idempotencia del cliente porque la clave natural ya lo es.
2. **Serialización**: la generación toma `SELECT pg_advisory_xact_lock(hashtext('practitioner-settlement-batch:' || carrier || ':' || provider))` dentro de la transacción (mismo patrón que `AuditLogRepository` y `CredentialsRepository`), y recién después busca por clave natural y por reclamos ya incluidos. Dos generaciones concurrentes del mismo par se resuelven en una creación y un replay.
3. **Un reclamo, un lote**: antes de incluir, se consultan los `insurance_reconciliation_items` existentes de esos reclamos; el que ya figura se excluye con `ALREADY_BATCHED`.
4. **Persistencia** (ambigüedad **A6**): se reutilizan `insurance.insurance_reconciliation_batches` e `insurance.insurance_reconciliation_items` — mismo grano aseguradora × prestador × período — con estados propios `SETTLEMENT_BATCH_ISSUED` y `SETTLEMENT_ITEM_INCLUDED`, distintos de los de la conciliación manual UC-26-13 (`RECON_BATCH_OPEN`, `RECON_ITEM_MATCHED`). Columnas: `total_claimed_amount` = facturado, `total_approved_amount` = a transferir, `expected_amount` (ítem) = aprobado del reclamo; **`total_paid_amount` y `accepted_amount` no se escriben nunca** (§11).
5. **Handoff al dueño del modelo** (no se aplica en este carril; la garantía queda en servicio hasta entonces):

```sql
-- Propuesta v4.2.2x — unicidad de lote por clave natural y de reclamo por lote de liquidación.
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_batch_natural_key
  ON insurance.insurance_reconciliation_batches (insurance_carrier_id, provider_entity_id, period_start, period_end)
  WHERE status_concept_id = '<uuid determinista de insurance:SETTLEMENT_BATCH_ISSUED>';
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_item_claim
  ON insurance.insurance_reconciliation_items (insurance_claim_id)
  WHERE status_concept_id = '<uuid determinista de insurance:SETTLEMENT_ITEM_INCLUDED>';
```

## 10. Reversión y cancelación después del corte

- Un lote emitido es **inmutable**: no se edita, no se recalcula, no se borra. No existe endpoint de modificación.
- Si un reclamo incluido en un lote se revierte después del corte, el lote donde entró no cambia. El **siguiente** lote del mismo par lo informa en `reversalAdjustments[]` (`claimId`, `claimIdentifier`, `previousBatchId`, `reversedAt`, `adjustmentAmount` negativo) y lo suma en `totals.totalReversalAdjustmentAmount`. El reclamo revertido no vuelve a ser elegible; su reemplazo entra por elegibilidad normal.
- Cancelar un reclamo antes de adjudicar lo deja fuera de todo lote (regla 2 de §7). Cancelar un pedido de farmacia o una orden diagnóstica retira la vigencia de la liquidación del paciente (`matchesLinkedClaimSnapshot`) y por lo tanto el reclamo queda `UNDER_REVIEW` → `NOT_RECONCILED`.
- Anular un **lote** emitido por error es una decisión de negocio sin tomar (`DECISION_REQUIRED`): requiere definir quién puede, con qué constancia y cómo se reexpiden sus reclamos. Fuera de este contrato.

## 11. Contención financiera (regla del H8: «sin simular pago»)

1. Este contrato **no mueve dinero**. El lote es un resumen de corte (estado de cuenta), no una orden de pago ni un comprobante bancario.
2. No se escribe `insurance_reconciliation_batches.total_paid_amount`, ni `insurance_reconciliation_items.accepted_amount` / `variance_amount`, ni se transiciona ningún reclamo a `CLAIM_PAID`: ese estado sólo puede fijarlo un hecho externo de tesorería con su propia evidencia, fuera de este carril.
3. Los DTOs de este contrato **no tienen** ninguna propiedad cuyo nombre contenga `paid`, `payment`, `receipt`, `voucher` ni `qr`; el spec de controladores lo comprueba.
4. La pantalla puede rotular «Total a transferir por la aseguradora» porque es lo adjudicado; no puede decir «pagado», «transferido» ni «cobrado».
5. Prohibido generar comprobantes, QR o recibos a partir del lote (Registro §2.7 y `DECISIONS.md` del plan médico: «no simular pagos, recibos ni puntos/comisiones»).

## 12. Endpoints, DTOs, roles y resolución de H8

### Endpoints

| Método y ruta | Quién | Respuesta | Errores |
|---|---|---|---|
| `POST /practitioner-settlement-batches` | Administración activa de la aseguradora (`assertInsurer` contra `insuranceCarrierId` del cuerpo) | `201` + `PractitionerSettlementBatchDto` (nuevo) · `200` + mismo DTO con `replayed: true` (clave natural repetida) | `403` (sin administración o aseguradora ajena, mismo cuerpo que inexistente) · `422` (`periodStart` desalineado) |
| `GET /practitioner-settlement-batches/:id` | Administración de la aseguradora del lote **o** tenant del prestador con `providerEntityId` en su alcance (prácticas y unidades diagnósticas activas) | `200` + `PractitionerSettlementBatchDto` | `403` uniforme para ajeno e inexistente |
| `GET /practitioner-settlement-batches?providerEntityId&from&to` | Ídem; la aseguradora ve los de su carrier (filtro opcional por prestador), el prestador los suyos | `200` + `{ items: PractitionerSettlementBatchDto[] }` ordenados por `periodStart` descendente | `403` si el tenant no tiene prácticas ni unidades y no administra una aseguradora |

Los tres van con `@Roles()` vacío y autorizan en el servicio por pertenencia (mismo criterio que las escrituras vinculadas de `ClaimsController`); `SUPERADMIN` entra por el comodín del guard.

### DTOs

```ts
GeneratePractitionerSettlementBatchDto {
  insuranceCarrierId: uuid;
  providerEntityId: uuid;
  cadence: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  periodStart: 'YYYY-MM-DD';
}

PractitionerSettlementBatchDto {
  id: uuid; insuranceCarrierId: uuid; carrierName: string;
  providerEntityId: uuid; providerTypeCode: string;          // BILLING_PROVIDER_TYPE_*
  cadence; periodStart: 'YYYY-MM-DD'; periodEnd: 'YYYY-MM-DD';
  currencyCode: string | null; status: 'SETTLEMENT_BATCH_ISSUED';
  generatedAt: ISO-8601; replayed: boolean;
  totals: { totalBilledAmount; totalApprovedAmount; totalPatientAmount; totalDeniedAmount; totalReversalAdjustmentAmount };
  claims: [{ claimId; claimIdentifier; adjudicationVersion; eobPublishedAt; totalBilledAmount; totalApprovedAmount; totalPatientAmount; totalDeniedAmount; exclusionsCount }];
  excludedClaims: [{ claimId; claimIdentifier; reason }];   // §7
  reversalAdjustments: [{ claimId; claimIdentifier; previousBatchId; reversedAt; adjustmentAmount }]; // §10
}
```

`ClaimDetailDto` (`GET /insurance-claims/:id`) gana `settlement: ClaimSettlementBreakdownDto { availability, totalBilledAmount, totalApprovedAmount, totalPatientAmount, totalDeniedAmount, reconciled, exclusions: ClaimExclusionDto[] }` y `eob: { id, publishedAt } | null`, con la misma semántica de §3–§5 que ya tiene `PatientInsuranceSettlementDto`.

### Resolución del handoff H8

| Punto del H8 | Estado con este contrato |
|---|---|
| Emisor / destinatario | Definidos (§2): el prestador emite, la aseguradora adjudica y publica; el lote nombra a los dos por id |
| Cobertura e importes separados | Definidos y verificados (§3–§4) para reclamos con pedido; **para la consulta médica el camino de creación no existe** (`CreateClaimDto` no admite `encounterId`, MATRIX L0264). El carril que lo cree debe usar `validateLinkedClaimSettlement` en adjudicación y publicación, exactamente como los reclamos con pedido |
| Calendario semanal/quincenal/mensual | Definido e implementado (§8), pendiente de confirmar A3/A5 |
| Idempotencia | Clave natural + cerrojo (§9); índice único propuesto al modelo |
| Reversión y cancelación | Definidas (§10); anulación de lote = decisión de negocio |
| Sin simular pago | Garantizado (§11) y comprobado por spec |
| Informe del médico (L0266) | El DTO del lote trae los tres totales y el detalle por reclamo; la **pantalla** del profesional y su integración con Contabilidad quedan para otro carril |
| Lectura del lote por farmacias | El alcance de lectura del prestador cubre prácticas y unidades diagnósticas (lo que existe hoy); resolver la farmacia del tenant queda pendiente |

Ambigüedades abiertas para confirmar: **A1** (rutas en inglés), **A2** (412), **A3** (cadencia obligatoria sin default), **A5** (fecha de EOB como criterio), **A6** (tablas reutilizadas e índices), **A7** (endurecer también la escritura de reclamos genéricos sin pedido).
