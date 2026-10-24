# Plan — Carril 16 · Fase 2: protección al paciente (REQ-16-026, 028 a 034)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `marcelo/lane16-patient-protection`, base `origin/dev` ab5fb64c) · Predecesor: PR #671 (corte 1: `coverage-split.ts`, `claim-coverage-policy.ts`) y PR #672 (vínculo factura ↔ línea de reclamo)
- Resultado observable: una persona de facturación de la práctica cotiza un cobro sin efectos, emite la factura al paciente por exactamente la parte calculada por el servidor, y nunca dos veces; un paciente dueño del reclamo lo objeta y el cobro queda en pausa hasta que se resuelve.
- Kill-test: dos `POST /insurance-claims/:id/patient-invoice` en paralelo sobre la misma línea, contra Postgres real. Dos 201, o `count(*) = 2` en `billing.invoice_lines`, significa NO hecho.

## Alcance
- IN: módulo `insurance` (domain, application, infrastructure, presentation, module, README); cambios acotados en `billing` (export de `InvoicesRepository`, dos consultas, guard en `issueFromEncounter`, pausa en `payments-received`, dos motivos); `notifications.contract.ts` (+1 destino); baseline de auditoría; specs; un int-spec; artefactos generados (OpenAPI, endpoints, módulos, data, Postman); `asyncapi` y catálogo de eventos (4 eventos).
- OUT: frontend; roles globales y `role-mapping.ts`; esquema/DDL/modelo (ADR-0021); refactor de `ClaimCoveragePolicy` más allá de modo lectura + `quoteLine`; `MyClaimsService`; dunning y estados de cuenta; correo; portal del paciente (REQ-16-031); la aritmética `Number()` preexistente de billing (se anota).
- Decisiones del propietario (2026-10-24): D1 rutas con prefijo `insurance-claims` (`POST /quote`, `POST /:id/patient-invoice`, disputa existente extendida); D2 emisión en insurance vía puerto a billing + guard mínimo en `issueFromEncounter`; D3 consentimiento tras puerto con adaptador fail-closed, persistencia BLOQUEADA hasta el PR del modelo; D4 `@Audited` + eventos de outbox con motivo e importes.
- Ambigüedades registradas (supuesto → a quién confirmar: propietario del carril):
  1. Reclamos vinculados sin parte persistida → se recotiza con `at = submittedAt`; no cubierto → particular con consentimiento. Alternativa: 422 `PATIENT_SHARE_UNAVAILABLE`.
  2. Segunda emisión → 422 `PATIENT_INVOICE_ALREADY_ISSUED`, no 200 idempotente.
  3. El guard por concepto de servicio en `issueFromEncounter` puede dar falso positivo. Alternativa: solo por `claimId`.
  4. Aprobación previa PARTIAL se informa APPROVED con tope.
  5. La pausa solo se aplica en `payments-received:apply`.
  6. Categoría del aviso in-app: `CLINICAL`.
  7. Actores de `patient-invoice`: BILLING/FINANCE/SUPERADMIN con alcance de práctica.
  8. Con `RLS_ENFORCE=true`, la rama paciente y las tx `REQUIRES_NEW` no llevan tenant: se verifica en integración.
  9. `yarn test:module-layering` y `--include` no existen: se usa el spec de capas y `--testPathPatterns`.

## H0 — Arranque y baseline
**CA:** Dado el worktree desde `origin/dev`, cuando se corre el baseline, entonces typecheck y los specs de insurance, arquitectura y auditoría están en verde antes de cualquier edición.
**DoD:** salidas en `evidencia/00-baseline-*.txt`.
**Estado:** EN CURSO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H0.S1.M1 | Worktree + `yarn install --immutable` | `node_modules` presente, lockfile intacto | `yarn install --immutable` → exit 0 | HECHO |
| H0.S1.M2 | Baseline typecheck | sin errores | `yarn typecheck` → exit 0 | HECHO |
| H0.S1.M3 | Baseline specs dirigidos | verdes | `yarn test src/modules/insurance src/architecture src/common/audit-trail` → 0 fallos | HECHO |

## H1 — Cotización previa (REQ-16-026)
**CA:** Dado un reclamo con línea de 500 Bs, beneficio 80 % y copago 50, cuando BILLING cotiza, entonces recibe 200 con paciente 140.00 y aseguradora 360.00, estado de aprobación previa y `canSubmit`, y no se escribe ni se bloquea nada. Un PATIENT recibe 403.
**DoD:** specs de política y del servicio en verde; `memory.locks` vacío en `quoteLine`; los casos de `evaluate` sin cambios.
**Estado:** TODO

### H1.S1 — Modo lectura de la política
**CA:** `quoteLine` reutiliza las reglas de `evaluate` sin lock ni excepción. **DoD:** spec de política. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `assertPriorAuthorization(..., lock)` | `evaluate` sigue bloqueando; el modo lectura no | `yarn test src/modules/insurance/application/services/claim-coverage-policy.spec.ts` → casos previos verdes | HECHO |
| H1.S1.M2 | `quoteLine` captura el 422 tipificado | cada motivo devuelve estado y términos | mismo spec, casos nuevos por motivo | HECHO |

### H1.S2 — Servicio, DTO y ruta
**CA:** `POST /insurance-claims/quote` responde 200 con el mismo gate que el envío directo. **DoD:** specs y typecheck. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S2.M1 | `ClaimQuoteDto` y `ClaimQuoteResultDto` | validación y Swagger | `yarn typecheck` → 0 | HECHO |
| H1.S2.M2 | `ClaimQuoteService` | autorización idéntica a submit; sin transacción | `yarn test src/modules/insurance/application/services/claim-quote.service.spec.ts` | HECHO |
| H1.S2.M3 | Ruta con `@NotAudited` | responde 200 | spec de auditoría + int-spec | A MEDIAS — ruta y spec de auditoría verdes; falta el int-spec (H6.S1.M1) |

## H2 — Factura al paciente exacta y sin doble cobro (REQ-16-028, 029)
**CA:** Dado un reclamo enviado, cuando se emite la factura al paciente, entonces el servidor arma la línea con su parte y la vincula a la línea del reclamo; si el cliente declara otro monto, 422 `PATIENT_INVOICE_AMOUNT_MISMATCH`; la segunda emisión o la paralela, 422 `PATIENT_INVOICE_ALREADY_ISSUED` con una sola fila.
**DoD:** specs de dominio con propiedad `paciente + aseguradora = total`; spec del caso de uso (orden de locks, IDOR, 23505 a 422); int-spec con concurrencia.
**Estado:** TODO

### H2.S1 — Regla pura y puerto
**CA:** la regla se prueba sin base de datos y billing se alcanza solo por un puerto. **DoD:** specs y spec de capas. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `domain/patient-billing-enforcer.ts` + spec | tabulares del propietario y 20 000 casos | `yarn test src/modules/insurance/domain/patient-billing-enforcer.spec.ts` | TODO |
| H2.S1.M2 | Puerto `PATIENT_BILLING_PORT` + adaptador | única importación de billing desde insurance | `yarn test src/architecture/module-layering.spec.ts` | TODO |
| H2.S1.M3 | Export de `InvoicesRepository` e `insuranceClaimLineId` en `createLine` | línea con vínculo persistido | `yarn typecheck` | TODO |

### H2.S2 — Caso de uso y ruta
**CA:** un solo lock, primero, y 422 tipificado ante cada rechazo. **DoD:** spec del servicio. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S2.M1 | `ClaimPatientInvoiceService` | 403 idéntico en IDOR; lock antes de leer facturas | `yarn test src/modules/insurance/application/services/claim-patient-invoice.service.spec.ts` | TODO |
| H2.S2.M2 | 23505 de la línea a 422, fuera de la tx | otra única se relanza | mismo spec | TODO |
| H2.S2.M3 | Ruta y DTO `patient-invoice` | 201 y `@Audited` | spec de cobertura de auditoría | TODO |

### H2.S3 — Guard de billing
**CA:** `issueFromEncounter` rechaza servicios ya reclamados. **DoD:** spec de invoices. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S3.M1 | Guard por `claimId` y por servicio reclamado | 422 con motivo propio | `yarn test src/modules/billing/services/invoices.service.spec.ts` | TODO |

## H3 — Consentimiento para cobro particular (REQ-16-030)
**CA:** Dado un servicio no cubierto o sin aprobación previa válida, cuando se factura como particular sin aceptación previa por el mismo importe, entonces 422 `PATIENT_CONSENT_REQUIRED`.
**DoD:** spec del validador con doble en memoria en tres niveles; adaptador real BLOQUEADO (tabla en el modelo).
**Estado:** TODO

### H3.S1 — Validador y puerto
**CA:** cuatro resultados distinguibles. **DoD:** spec. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Puerto y `PatientConsentValidator` | VALID, MISSING, AMOUNT_DIFFERS, NOT_BEFORE_CHARGE | `yarn test src/modules/insurance/application/services/patient-consent-validator.spec.ts` | TODO |
| H3.S1.M2 | Adaptador fail-closed | siempre `null` | mismo spec | TODO |

## H4 — Objeción del paciente y pausa (REQ-16-032, 033)
**CA:** Dado un PATIENT dueño del reclamo, cuando objeta, entonces 201 y repetirlo devuelve la misma disputa; otro paciente recibe el 403 de un id inexistente; mientras esté abierta, `payments-received:apply` sobre la factura vinculada da 422 `PAYMENT_RECEIVED_INVOICE_ON_HOLD`.
**DoD:** specs de servicio, `claims.service` y billing; int-spec.
**Estado:** TODO

### H4.S1 — Conceptos y repositorio
**CA:** la objeción no se confunde con la apelación. **DoD:** typecheck y spec. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Conceptos de objeción | ids deterministas | `yarn typecheck` | TODO |
| H4.S1.M2 | `findOpenDispute` con filtro de tipo | apelación y objeción no se pisan | `yarn test src/modules/insurance/application/services/claims.service.spec.ts` | TODO |

### H4.S2 — Servicio y ruta
**CA:** el despacho es por actor, nunca por `initiatedBy`. **DoD:** specs. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S2.M1 | `PatientChargeObjectionService` | propiedad por puerto; REVERSED a 422 | `yarn test src/modules/insurance/application/services/patient-charge-objection.service.spec.ts` | TODO |
| H4.S2.M2 | `openDispute` con tenant declarado | `@TenantAgnostic` sin romper la rama de práctica | `yarn test src/modules/insurance/application/services/claims.service.spec.ts` | TODO |
| H4.S2.M3 | Ruta despacha por `isPatientOnlyActor` | PATIENT objeta, práctica apela | `yarn test src/modules/insurance/domain/actor-kind.spec.ts` + int-spec | TODO |

### H4.S3 — Pausa y aviso
**CA:** el pago se rechaza con objeción abierta y se libera al resolverla. **DoD:** spec de billing. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S3.M1 | Pausa derivada en `payments-received` | 422 con objeción abierta | `yarn test src/modules/billing/services/payments-received.service.spec.ts` | TODO |
| H4.S3.M2 | Aviso in-app al paciente | nunca lanza | spec del servicio | TODO |

## H5 — Auditoría y eventos (REQ-16-034)
**CA:** Dado cualquier ruta nueva, entonces lleva `@Audited` (o `@NotAudited` con razón) y cada intento rechazado publica un evento tipificado con motivo e importes, sin texto clínico.
**DoD:** `yarn test src/common/audit-trail/audit-trail-coverage.spec.ts` con `BASELINE_SIZE` 719; `yarn docs:asyncapi:validate`.
**Estado:** TODO

### H5.S1 — Decoradores y eventos
**CA:** cobertura de auditoría completa y eventos documentados. **DoD:** specs y validación. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Decoradores y baseline | 2 entradas menos | `yarn test src/common/audit-trail/audit-trail-coverage.spec.ts` | TODO |
| H5.S1.M2 | 4 eventos en asyncapi y catálogo | validan | `yarn docs:asyncapi:validate` | TODO |

## H6 — Integración, gates y entrega
**CA:** Dado Postgres real, cuando corre el flujo completo, entonces pasan cotización, envío, factura, doble cobro, paralelo, discrepancia, aprobación previa, objeción, pausa e IDOR.
**DoD:** `yarn build && yarn test:integration --testPathPatterns=lane16-patient-invoice-flow`; `yarn typecheck`; `yarn lint --max-warnings=0`; `yarn test`; `yarn alovida:guardrails`; documentos regenerados sin diff; `REPORTE.md`; PR contra `dev`; salida literal de `gh pr view` y `gh pr checks`.
**Estado:** TODO

### H6.S1 — Integración
**CA:** flujo real sobre datos sintéticos `LANE16-*`. **DoD:** comando de integración. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | `lane16-patient-invoice-flow.int-spec.ts` | limpieza, sin TRUNCATE | `yarn test:integration --testPathPatterns=lane16-patient-invoice-flow` | TODO |

### H6.S2 — Gates
**CA:** los pasos de CI pasan en local. **DoD:** comandos del DoD del hito. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S2.M1 | Typecheck, lint, build, test, guardrails | verdes | `yarn typecheck && yarn lint --max-warnings=0 && yarn build && yarn test && yarn alovida:guardrails` | TODO |
| H6.S2.M2 | Regenerar OpenAPI, endpoints, módulos, data, Postman | sin diff | `git diff --exit-code -- openapi docs/modules docs/data docs/postman` | TODO |

### H6.S3 — Entrega
**CA:** PR mergeable con evidencia. **DoD:** salida de `gh`. **Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S3.M1 | `REPORTE.md` y PR contra `dev` | mergeable, checks en verde | `gh pr view <n> --json isDraft,mergeable,mergeStateStatus` y `gh pr checks <n>` | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| La `.env` apunta a la base compartida de desarrollo | datos ajenos tocados | solo datos `LANE16-*`, limpieza en `afterAll`, sin TRUNCATE ni `audit.*` |
| `docs:openapi:generate` exige arranque completo | no regenerar artefactos | usar la `.env`; si falla por insumo ajeno, simular y declarar (regla 65) |
| check-breaking por renombre del esquema de disputa | CI rojo | entrada en `breaking-changes-exceptions.json` |
| Tabla de aceptaciones inexistente | REQ-16-030 sin persistencia real | adaptador fail-closed; BLOQUEADO hasta el PR del modelo |
| Deadlock | doble cobro o cuelgue | un solo `FOR UPDATE` sobre el reclamo, primero; sin lock de aprobación previa |
