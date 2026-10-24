# Reporte — Carril 16, fase 2: protección al paciente (REQ-16-026, 028 a 034)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/lane16-patient-protection` (base `origin/dev`, con `dev` integrado el 2026-10-24)
- Peldaño de evidencia alcanzado: `TESTED` para todo el alcance. Además, el flujo con servicios reales quedó `VERIFIED` contra PostgreSQL 18 desechable (reclamo, factura, doble cobro, carrera, consentimiento, objeción, pausa). **No es `REGRESSION_VERIFIED`**: la capa HTTP no se ejercitó y la suite de integración completa y la CI del PR no corrieron todavía.
- Avance: 27 HECHO / 30 microtareas = 90,0 % (calculado). Dos A MEDIAS (H2.S3.M1 y H6.S3.M1) y una DESCARTADA (H4.S2.M2).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H0 | Worktree desde `origin/dev` y baseline | `yarn typecheck`; `yarn test src/modules/insurance src/architecture src/common/audit-trail` | exit 0; 50 suites, 782 pruebas (`evidencia/00-baseline-*.txt`) |
| H1 | Cotización previa sin efectos: `quoteLine` (modo lectura, sin lock), `ClaimQuoteService`, `POST /insurance-claims/quote` | `yarn test .../claim-coverage-policy.spec.ts` y `.../claim-quote.service.spec.ts` | 56 y 19 pruebas en verde; la cotización real no escribe filas (`h6-integration-local-run*.txt`) |
| H2.S1 | Regla pura `enforcePatientBilling` con propiedad `paciente + aseguradora = monto` (20 000 casos), puerto y adaptador a billing | `yarn test src/modules/insurance/domain/patient-billing-enforcer.spec.ts`; `yarn test src/architecture/module-layering.spec.ts` | 28 pruebas; guardarraíl de capas en verde |
| H2.S2 | `ClaimPatientInvoiceService`: un `FOR UPDATE` primero, importe del servidor, 403 idéntico ante reclamo ajeno o inexistente, 23505 convertido en 422 | `yarn test .../claim-patient-invoice.service.spec.ts` | 40 pruebas con el validador; integración: factura de 140 de un reclamo de 500, repetición en 422, 5 rondas en paralelo (una factura y un 422), bloqueo real por el índice único convertido en 422 |
| H3 | `PatientConsentValidator` con doble en memoria (correcto, límite, inválido) y adaptador que falla cerrado | `yarn test .../patient-consent-validator.spec.ts` | en verde; integración: 422 sin aceptación, 201 con aceptación del mismo importe, 422 con otro importe |
| H4.S1, H4.S2 (M1, M3), H4.S3 | Objeción del paciente idempotente, despacho por actor, pausa derivada del cobro, aviso al paciente | `yarn test .../patient-charge-objection.service.spec.ts`, `.../insurance-controllers.spec.ts`, `src/modules/billing` | 18 pruebas del servicio; billing 20 suites y 129 pruebas; integración: objeción en paralelo devuelve la misma disputa, otro paciente recibe el mismo 403, el pago se rechaza con la objeción abierta y se libera al resolverla |
| H5 | `@Audited` y `@NotAudited` en las rutas nuevas, baseline 721 a 719, 4 eventos y su sección del catálogo | `yarn test src/common/audit-trail/audit-trail-coverage.spec.ts`; `yarn docs:asyncapi:validate` | en verde, exit 0 |
| H6.S1 | Test de integración contra PostgreSQL real | `yarn test:integration --testPathPatterns=lane16-patient-invoice-flow` | **19 de 19 en 4 corridas seguidas** contra PostgreSQL 18 desechable (`h6-integration-local-run1..4.txt`); en la primera versión contra la base compartida las 19 pruebas pasaron pero la suite falló en la limpieza (`h6-integration-run2.txt`; ver Residuo) |
| H6.S2 | Gates del repo tras integrar `dev` | `yarn typecheck`; `yarn lint --max-warnings=0`; `yarn build`; `yarn test:cov`; `yarn alovida:guardrails` | exit 0 en todos; `Tests: 1 skipped, 10912 passed, 10913 total`, `Test Suites: 1 skipped, 884 passed`; umbrales de cobertura cumplidos (statements 75,93 %, branches 69,92 %, functions 62,18 %, lines 76,89 %); guardrails `bloqueantes: 0` |
| H6.S2.M2 | Contrato OpenAPI, documentos de endpoints, módulos, datos y Postman regenerados | `node tools/openapi/generate-openapi.mjs` y los generadores de docs, luego `git diff --exit-code -- openapi docs/modules docs/data docs/postman` | exit 0 (`h6-parity-diff.txt`); `docs:openapi:lint`, `docs:openapi:request-bodies:test`, `docs:coverage` y el chequeo de cambios incompatibles contra `origin/dev` en verde |

## A medias

### H2.S3.M1 — Guard de billing contra servicios ya reclamados
- Qué anda: `POST /billing/invoices:issue-from-encounter` rechaza con 422 `INVOICE_LINE_SERVICE_ALREADY_CLAIMED` toda factura que declare un `claimId`, antes de abrir transacción. Probado en `invoices.service.spec.ts`.
- Qué no anda: no hay rechazo cuando se factura como particular el mismo servicio ya reclamado sin declarar el reclamo.
- Qué falta exactamente: un vínculo fiable entre la línea de factura y el reclamo del mismo servicio. Los reclamos no guardan el encuentro y `invoice_lines.insurance_claim_line_id` nunca se escribió antes de esta fase, así que un cruce por concepto de servicio bloquearía a todo paciente con un reclamo histórico sin factura vinculada. Se resuelve guardando el encuentro en el reclamo (cambio de modelo) o acotando por ventana de tiempo (decisión del propietario).
- Dónde quedó: rama `marcelo/lane16-patient-protection`, `src/modules/billing/services/invoices.service.ts`. REQ-16-029, segundo punto, queda A MEDIAS.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H6.S3.M1 | A MEDIAS | Que el workflow `Documentación` vuelva a ejecutarse en los PR contra `dev` (ver Estado del PR) |
| H4.S2.M2 | DESCARTADO | Reemplazado por `@PlatformTenantOptional('PATIENT')`. Lo decidí yo al descubrir el riesgo (ver Desvíos en el plan) |
| REQ-16-030, persistencia | BLOQUEADO | PR del modelo con la tabla de aceptaciones (`.puml`, SQL, entidad); luego un adaptador real en lugar de `NoPatientChargeAcceptanceAdapter` |
| REQ-16-031 | TODO | Lectura del desglose para el portal del paciente |
| REQ-16-032, avisos | TODO | Resolutor de personal de la práctica y canal de correo |

## Evidencia

Salidas completas en [`evidencia/`](./evidencia/). Extractos literales:

```text
$ yarn test src/modules/insurance/domain/patient-billing-enforcer.spec.ts
Tests:       28 passed, 28 total

$ yarn test:integration --testPathPatterns=lane16-patient-invoice-flow --runInBand   (PostgreSQL 18 desechable, corrida 2 de 4)
Tests:       19 passed, 19 total
LANE16 limpieza (marca LANE16-400e5c43): reclamos conservados = 17, facturas conservadas = 9, beneficios restantes = 0. Lo conservado tiene historial en audit.* (sólo inserción) y no se fuerza.

$ yarn test:cov
Test Suites: 1 skipped, 884 passed, 884 of 885 total
Tests:       1 skipped, 10912 passed, 10913 total

$ node tools/openapi/check-breaking.mjs --base <openapi de origin/dev> --head openapi/openapi.json --exceptions tools/openapi/breaking-changes-exceptions.json
Sin cambios incompatibles no aprobados en el contrato OpenAPI.

$ git diff --exit-code -- openapi/openapi.yaml openapi/openapi.json openapi/ENDPOINTS.md openapi/endpoints docs/modules docs/data docs/postman
exit=0
```

## Desvíos del plan

Los seis desvíos están en [PLAN.md](./PLAN.md#desvíos-del-plan). Dos más surgieron después:

7. **Se quitaron dos imports duplicados de `src/modules/insurance/insurance-patient-settlement.module.ts`.** El archivo está roto en `origin/dev` por dos PR fusionados (`Identifier 'LinkedOrderDataRepository' has already been declared`): rompía `yarn typecheck`, `yarn build` y la carga de `AppModule` (dos suites de pruebas). Es ajeno a este carril, bloqueaba mis gates, el arreglo son dos líneas y lo cubre el typecheck. Se declara también en el PR.
8. **`InsuranceModule` provee `InvoicesRepository` directo** en lugar de importar `BillingModule` y exportarlo. El import cambiaba el orden en que Nest descubre los módulos y con él el de todo el contrato OpenAPI (22 000 líneas de diff). Hay precedente en el mismo módulo (`PersonAccountLinksRepository`). `billing.module.ts` quedó idéntico a `dev`.

Observaciones fuera de alcance, no arregladas: un enlace roto de `docs:links` en `docs/trabajo/2026-10-24-farmacologia-clinica/REPORTE.md` (`./evidencia/` sin `index.md`); aritmética con `Number()` preexistente en `invoices.service.ts` y `payments-received.service.ts`.

## Estado del PR

PR: https://github.com/mdavila-2001/mantra-core-health-api/pull/722 (base `dev`, no draft). Cabeza del último push de código: `0a8474fb`.

```text
$ gh pr view 722 --json isDraft,mergeable,mergeStateStatus     (2026-10-24, justo después del último push de código)
{"isDraft":false,"mergeStateStatus":"BLOCKED","mergeable":"MERGEABLE"}

$ gh pr checks 722
no checks reported on the 'marcelo/lane16-patient-protection' branch

$ gh pr view 722 --json isDraft,mergeable,mergeStateStatus,headRefOid     (minutos después, GitHub recalculando)
{"headRefOid":"0a8474fb728120af2a00ea537b8da2a4fdb11012","isDraft":false,"mergeStateStatus":"UNKNOWN","mergeable":"UNKNOWN"}
```

- **Sin conflictos con `dev`** tras dos integraciones (la primera abrió el PR con conflicto en artefactos generados porque `dev` avanzó; se resolvió y se regeneró todo).
- **CI no reporta.** El workflow `Documentación` no corre en este repositorio desde 2026-10-22: no hay checks en este PR ni en el #721, y las últimas corridas de `gh run list --workflow docs.yml` son del 22 de octubre y están en `failure`. No es una falla de esta rama, pero el criterio de `pr-mergeable-gate` (checks en verde) **no se puede demostrar**: por eso la entrega es A MEDIAS y no HECHO.
- `BLOCKED` es la protección de la rama a la espera de checks.
- Mientras tanto la verificación local replicó los pasos de ese workflow que se pueden correr sin MongoDB, Redis, OpenSearch ni MinIO completos: typecheck, lint con cero advertencias, build, `test:cov`, guardrails, generación del contrato OpenAPI, `git diff --exit-code` de los artefactos, `docs:openapi:lint`, `docs:asyncapi:validate`, `docs:coverage`, chequeo de cambios incompatibles y el test de integración nuevo. `docs:links` falla por un enlace de otro carril (ver Desvíos).

## No cubierto

Lo que se hizo pero **no** se probó, distinto de lo pendiente:

- **La capa HTTP de las rutas nuevas.** Guards, pipes de validación, interceptores de tenant y de
  auditoría, el 200/201 de cada ruta y la serialización de los DTO no se ejercitaron por HTTP. Lo que hay:
  specs del controlador (delegación, roles, despacho por actor, `@PlatformTenantOptional`),
  `audit-trail-coverage.spec.ts` (cada ruta con `@Audited` o `@NotAudited`) y la regeneración de OpenAPI.
  El integración llama a los servicios reales, no al endpoint.
- **El outbox y el aviso al paciente.** Los eventos y el aviso se probaron contra dobles que registran la
  llamada: no se verificó que la fila de `messaging.domain_events` ni la notificación se persistan.
- **La propiedad del perfil del paciente.** El puerto de propiedad es un doble en el integración. Su
  adaptador real (`ProfileOwnershipService`) ya existía y no se tocó.
- **La aceptación del paciente (REQ-16-030).** No existe tabla: el adaptador real falla cerrado y el «sí
  aceptó» es un doble en memoria. Lo verificado es la regla, no la persistencia.
- **RLS.** Ninguna prueba corrió con `RLS_ENFORCE=true`. La rama del paciente corre en contexto de sistema
  (por `@PlatformTenantOptional`) y la propiedad la garantiza la regla de aplicación, no la base.
- **La suite completa de integración** (`yarn test:integration --ci`). Necesita MongoDB, Redis,
  OpenSearch y MinIO; sólo se corrió el spec nuevo, contra PostgreSQL desechable.
- **Apelación que levanta la pausa.** `AppealsService.decide` inserta una decisión inmutable por trigger y
  no se puede retirar de una base compartida. El integración levanta la pausa con el mismo cambio de
  estado que hace el servicio (`DISPUTE_RESOLVED`); el servicio en sí no se ejercitó en esa prueba.
- **Dunning y estados de cuenta** no consultan la pausa derivada (ver Decisiones).
- **Servicios reclamados que se facturan como particulares sin declarar el reclamo** (REQ-16-029,
  segundo punto): no hay rechazo (ver Desvíos).
- **Corrida de CI.** El workflow se evalúa recién con el PR.

## Residuo en la base compartida de desarrollo

Una corrida del integración contra la base de `.env` (Neon, base `alovida`) dejó datos sintéticos que **no
se pueden borrar** sin saltarse controles de inmutabilidad, y no se saltaron:

- `audit.invoices_history` e `audit.insurance_claims_history` son de sólo inserción y las filas de historial
  referencian a las facturas y los reclamos, que por eso no se pueden borrar.
- `insurance.claim_appeal_decisions` bloquea `DELETE` por trigger.

Quedaron, todos con la marca `LANE16-67806b38` en `claim_identifier` y `member_identifier`: 17 reclamos con
sus 17 líneas, 9 facturas con sus 9 líneas, 1 cobertura, 1 disputa y 1 decisión de apelación, vinculados a
un paciente y a una práctica ya existentes en la base. Se retiraron lo que sí se podía: los 2 beneficios
(alteraban el cotizador de un plan real), los pagos y la factura auxiliar sin historial. Quién administre la
base decide si los purga con su proceso. El spec se rediseñó después para no repetirlo: crea sus propios
padres, no usa la apelación y su limpieza es de mejor esfuerzo; **no se volvió a correr contra esa base**.
Las 4 corridas de la versión final fueron contra un PostgreSQL 18 desechable en Docker.

## Riesgos residuales

- La rama del paciente de `POST /insurance-claims/:id/disputes` corre sin tenant del actor y, con RLS
  activo, en contexto de sistema. Si algún día se exige contexto de tenant para pacientes, hay que
  resolverlo desde la práctica del reclamo.
- Personal con el rol `PATIENT` además del suyo: para él la ruta omite la resolución de tenant y el
  controlador la repite como el guard. Un rol acotado a organización (BILLING_OPERATOR, que no está
  sembrado en ningún lado) no autorizaría en esa ruta para quien además sea paciente.
- Facturar al paciente con parte 0 se rechaza (`NOTHING_TO_CHARGE_PATIENT`): decisión mía, sin
  confirmar.
- Reclamos vinculados recotizados contra el tope de la aprobación previa: puede informar un motivo
  engañoso (falla cerrado). Ver Desvíos.
- `issueFromEncounter` ahora rechaza cualquier factura que traiga `claimId`: es un cambio de contrato
  de una ruta existente (422 donde antes se aceptaba). Documentado en OpenAPI y en el PR.
- El catálogo de eventos ya estaba desactualizado (140 sitios reales frente a 79 declarados) y no
  listaba `InsuranceClaimDecided`; sólo se agregó la sección de los 4 eventos nuevos.

## Decisiones y ambigüedades

Decisiones del propietario tomadas en la sesión de planificación (2026-10-24): rutas con el prefijo del
módulo y disputa extendida (D1); emisión en insurance por un puerto a billing (D2); consentimiento tras un
puerto con persistencia bloqueada (D3); auditoría con `@Audited` más eventos (D4).

A confirmar con el propietario del carril (supuesto tomado):

1. Reclamos vinculados sin parte persistida: se recotiza con `at = submittedAt` y, si no cubre, queda como
   cobro particular con consentimiento. Alternativa: 422 `PATIENT_SHARE_UNAVAILABLE`.
2. Segunda emisión de una línea: 422 con el id de la factura existente, no 200 idempotente.
3. Parte del paciente en 0: se rechaza.
4. Aprobación previa PARTIAL: se informa como aprobada con su tope (default de `requirements.md`).
5. La pausa del cobro sólo se aplica en `payments-received:apply`; dunning y estados de cuenta no la
   consultan.
6. Categoría del aviso in-app: `CLINICAL` (el contrato de avisos no tiene una familia de facturación).
7. Actores de `patient-invoice`: BILLING, FINANCE y SUPERADMIN con el alcance de su práctica.
8. Sin plazo de objeción (el propietario no lo definió: no vence) y sin texto libre en la objeción.
9. `yarn test:module-layering` y `--include` no existen: el guardarraíl es
   `src/architecture/module-layering.spec.ts` y el filtro es `--testPathPatterns`.
10. Pendiente de otro PR: tabla de aceptaciones en el modelo (`.puml` → SQL → entidad → adaptador real),
    desglose en el portal del paciente (REQ-16-031), aviso a personal de la práctica y a la aseguradora y
    correo (REQ-16-032), y rechazo de servicios ya reclamados por concepto de servicio (requiere guardar el
    encuentro en el reclamo).
