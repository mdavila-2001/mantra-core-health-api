# Plan — Cobertura en los reclamos vinculados y bitácora de cada decisión (P0, slice 2)

- Fecha: 2026-10-23 · Repos afectados: `mantra-core-health-api` · Predecesor: PR #671
  (`justin/p0-claim-coverage-validation`, slice 1: `splitCoveredAmount` y `ClaimCoveragePolicy` en
  el cobro directo)
- Nota de proceso: este plan se escribió **después** del código (desvío de AGENTS.md §2.1,
  registrado en el reporte). Refleja el alcance que se pidió y el que se ejecutó.
- Resultado observable: una farmacia o una unidad de diagnóstico que cobra a la aseguradora un
  pedido recibe un 422 con `details.reason` si el plan del paciente no cubre el servicio, exige una
  aprobación previa que falta o no alcanza, o si declara una parte del paciente distinta a la del
  plan. Si el cobro se acepta, la línea guarda la parte del paciente que calculó el servidor. En
  `audit_log` queda una fila por decisión.
- Kill-test: un reclamo de farmacia de un medicamento sin beneficio en el plan se crea igual (201),
  o un rechazo no deja fila en `audit_log`.

## Alcance
- IN: `src/modules/insurance/application/services/claims.service.ts` (camino vinculado y bitácora);
  sus specs; un helper de pruebas compartido; `docs/guides/patient-coverage-copays.md` (el contrato
  de `patientResponsibilityAmount` cambia).
- OUT: DDL y migraciones (ADR-0021); módulos de prácticas y organizaciones (los toca otra sesión);
  la adjudicación vinculada; deducible y tope anual (decisión del propietario del 2026-10-23); los
  errores de lint que ya trae la base en seed, pharmacy_inventory y profiles.
- Ambigüedades registradas:
  1. `audit_log` no tiene columna de detalle. Supuesto: el motivo del rechazo va codificado en
     `action` (`INSURANCE_CLAIM_COVERAGE_REJECTED:<reason>`, conjunto cerrado) y el desglose al log
     estructurado. Confirmar con Justin si hace falta sellarlo en la cadena WORM (requiere DDL).
  2. La guía permitía declarar `patientResponsibilityAmount = 0` en los reclamos vinculados.
     Supuesto: misma semántica que el cobro directo, así que un `0` que no coincide con el plan se
     rechaza. Confirmar con Justin.
  3. Sobre qué recurso se sella un rechazo, si todavía no hay reclamo. Supuesto: el pedido
     (`inventory_reservation` / `service_request`) o, en el cobro directo, `patient_coverage`.

## H1 — La política del slice 1 rige en los caminos vinculados
**CA:** Dado un pedido de farmacia o de diagnóstico, cuando se presenta su reclamo, entonces se
acepta solo si el plan lo cubre y la parte del paciente que se guarda es la que calcula el servidor.
**DoD:** `corepack yarn test --testPathPatterns=insurance` en verde · `corepack yarn typecheck` → 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Evaluar la política en la rama vinculada con el servicio y el monto del pedido y el plan de `coverageForOrder` | Un servicio sin beneficio da 422 `SERVICE_NOT_COVERED` en farmacia y en diagnóstico | `jest claims-linked-coverage` → pasa | HECHO |
| H1.S1.M2 | Guardar en las líneas vinculadas la parte del paciente calculada | La línea creada lleva `patientResponsibilityAmount: '140.00'` para 500 con 80 % y copago 50 | idem | HECHO |
| H1.S1.M3 | Que la política juzgue la parte declarada (quitar el "solo 0" de `canonicalLines`) | `0` declarado da `PATIENT_SHARE_MISMATCH`; `140` declarado se acepta | idem | HECHO |
| H1.S1.M4 | En el replay idempotente, comparar la parte declarada con la guardada | Typecheck y specs de replay en verde | `jest claims-linked.service` → pasa | HECHO |
| H1.S2.M1 | Probar cada razón de rechazo relevante por camino | 9 razones × 2 orígenes en verde | `jest claims-linked-coverage` → pasa | HECHO |

## H2 — Cada decisión queda en la bitácora
**CA:** Dado un alta de reclamo, cuando la política acepta o rechaza, entonces `audit_log` recibe
una fila con quién, qué recurso, el resultado y, si fue rechazo, el motivo, sin datos del paciente.
**DoD:** specs con aserciones sobre el puerto de auditoría en verde.
**Estado:** A MEDIAS (el desglose no queda en la cadena WORM; ver ambigüedad 1)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Sellar `INSURANCE_CLAIM_COVERAGE_APPLIED` en la transacción del alta | `record` recibe la transacción del alta con `entity: insurance_claim` | `jest claims-linked-coverage` → pasa | HECHO |
| H2.S1.M2 | Sellar el rechazo en una transacción propia, después del rollback | `record` recibe una segunda transacción con `success: false` | idem | HECHO |
| H2.S1.M3 | Que una falla de la bitácora no oculte el 422 | El 422 llega igual y se loguea el error | idem | HECHO |
| H2.S1.M4 | Desglose (%, copago, montos, autorización) al log estructurado, sin PHI | `logger.info` recibe el desglose por línea | idem | HECHO |
| H2.S1.M5 | Desglose sellado en `audit_log` | Fila WORM con el desglose | requiere DDL | BLOQUEADO |
| H2.S2.M1 | Bitácora también en el cobro directo | Spec del cobro directo con aserciones de bitácora | `jest claims-coverage-wiring` → pasa | HECHO |

## H3 — Gates
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H3.M1 | Typecheck | `corepack yarn typecheck` → 0 | HECHO |
| H3.M2 | Lint completo | `corepack yarn lint --max-warnings=0` → 0 | BLOQUEADO (la base ya falla, ver reporte) |
| H3.M3 | Lint de los archivos tocados | `npx eslint --max-warnings=0 <archivos>` → 0 | HECHO |
| H3.M4 | Int-specs contra Postgres | `yarn test:integration` | BLOQUEADO (no hay Postgres en la nube) |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Productos de farmacia sin `medicationConceptId` | Pasan a dar 422 `CLAIM_LINE_SERVICE_REQUIRED` | Es la regla P0; queda documentado en el PR |
| Clientes que mandan `patientResponsibilityAmount: 0` | Pasan a dar 422 `PATIENT_SHARE_MISMATCH` | Guía actualizada; confirmar con Justin |
| Sin Postgres en la nube | El lock y la transacción aparte no se ejercitan contra la base | Int-spec pendiente |
