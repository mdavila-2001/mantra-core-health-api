# Reporte — Transparencia de exclusiones, desglose de liquidación y contrato de lotes aseguradora–profesional (Tarea 3 · H8 / MED-E13..E16)

> **AVANCE: 9 / 25 — 36,0 %.** (microtareas `HECHO` sobre el total del `PLAN.md`; 2 más quedan `BLOQUEADO` con causa documentada, no escondidas como pendientes comunes).

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `mantra-core-health-api@marcelo/feat-practitioner-settlement-batches-api` (worktree aislado del scratchpad de la sesión; `origin/dev` en `ee075615` al crearla — incluye el PR #457 ya mergeado de la sesión anterior).
- Peldaño de evidencia alcanzado: `TESTED` para H1–H3 (salidas literales de `yarn test`/`yarn typecheck`/`yarn eslint` pegadas abajo). `BLOQUEADO`, no `TESTED`, para la verificación HTTP end-to-end (H2.S1.M4 y, parcialmente, H3.S1.M5), por la causa documentada en «No cubierto».

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | *(de la sesión anterior)* Contrato canónico H8, ahora en v1.1 | `grep -c '^## ' docs/contracts/insurer-practitioner-settlement-batches.md` | `12` |
| H1.S1.M2 | *(de la sesión anterior)* README del módulo enlaza el contrato | `grep -c insurer-practitioner-settlement-batches src/modules/insurance/README.md` | `≥ 1` |
| H2.S1.M1 | *(de la sesión anterior)* `buildClaimSettlementBreakdown` (función pura, 11 tests) | `yarn test src/modules/insurance/services/claim-settlement-breakdown.spec.ts` | `11 passed` |
| H2.S1.M2 | *(de la sesión anterior)* `ClaimDetailDto.settlement`/`.eob` cableados en `GET /insurance-claims/:id` | `yarn test src/modules/insurance/services/claims-read.service.spec.ts` | `passed` |
| H2.S1.M3 | **Nuevo.** Inmutabilidad de la EOB (CA-3.4) con evidencia: `services/claims-immutability.spec.ts` (409 al re-publicar, versión N+1 con `supersedesVersionId`, 422 al revertir versión no vigente, revertir la vigente sí funciona) + afirmación en `insurance-controllers.spec.ts` de que `ClaimsController` sólo declara `POST` (metadata `METHOD_METADATA` de Nest, ningún `PUT/PATCH/DELETE`) | `yarn test src/modules/insurance/services/claims-immutability.spec.ts src/modules/insurance/controllers/insurance-controllers.spec.ts` | `4 + 19 passed` |
| H3.S1.M1 | **Nuevo.** Conceptos `SETTLEMENT_BATCH_ISSUED`, `SETTLEMENT_ITEM_INCLUDED`, `SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT` (v1.1) | `grep -c 'SETTLEMENT_BATCH_ISSUED\|SETTLEMENT_ITEM_INCLUDED\|SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT' src/modules/insurance/insurance.concepts.ts` | `3` |
| H3.S1.M2 | **Nuevo.** Dominio puro `services/practitioner-settlement-batch.ts`: calendario (`resolveSettlementPeriod`/`inferSettlementCadence`), fechas civiles en La Paz, y `selectSettlementClaims` con las seis reglas de elegibilidad + ajustes por reversión | `yarn test src/modules/insurance/services/practitioner-settlement-batch.spec.ts` | `18 passed` |
| H3.S1.M3 | **Nuevo.** `PractitionerSettlementBatchesService`: `generate` (cerrojo + replay idempotente), `getById`/`list` (autorización aseguradora-o-prestador: prácticas, unidades diagnósticas o farmacias del tenant) | `yarn test src/modules/insurance/services/practitioner-settlement-batches.service.spec.ts` | `8 passed` |
| H3.S1.M4 | **Nuevo.** Tres endpoints (`POST /`, `GET /:id`, `GET /`), cinco DTOs, sin roles de clase, cableado en el módulo; verificado que ninguna propiedad de los DTOs contiene `paid/payment/receipt/voucher/qr` | `yarn test src/modules/insurance/controllers/insurance-controllers.spec.ts` · `yarn typecheck` | `passed` · exit `0` |

## A medias

Ninguna microtarea ejecutada quedó a medias: lo que se tocó se cerró con su DoD demostrado. Lo que no se llegó a hacer está en Pendiente o Bloqueado, no acá.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M5 (parcial) | BLOQUEADO | Regenerar OpenAPI/Postman/`docs/endpoints`/`docs/modules` exige arrancar `AppModule` completo contra una base viva (`node tools/openapi/generate-openapi.mjs`, tras `yarn build`). No se ejecutó en esta sesión: después del incidente de Neon (ver Riesgos residuales) se decidió no volver a tocar esa base, y levantar Postgres local está fuera de lo que el usuario autorizó para esta sesión. El build compilado sí evita el bug de `ts-morph` (usa `entities`, no `entitiesTs`) — es técnicamente viable, sólo falta la base para arrancar |
| H4 completo — front (`insurance-claim-detail`, molécula `patient-insurance-settlement`, tipos, maqueta, `core/money/decimal-strings`) | TODO | Ningún archivo de `mantra-core-health` se tocó en esta sesión. El worktree `C:/wt/front-exclusions` sigue creado y actualizado a `origin/dev` (`0343aaec`), con dependencias instaladas |
| H5 — E2E Playwright y doble revisión | TODO | Depende de H4 |
| H6 (API) — regenerar contrato, gates finales y PR | A MEDIAS | Este PR se abre con typecheck/lint/tests en verde; falta la regeneración de OpenAPI (ver H3.S1.M5) |
| H6 (front) | TODO | Depende de H4/H5 |

## Evidencia

```text
$ yarn test src/modules/insurance
Test Suites: 27 passed, 27 total
Tests:       380 passed, 380 total
Time:        ~23 s

$ yarn typecheck
(sin salida; exit 0)

$ yarn eslint src/modules/insurance
(sin salida; exit 0)

$ grep -c 'SETTLEMENT_BATCH_ISSUED\|SETTLEMENT_ITEM_INCLUDED\|SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT' src/modules/insurance/insurance.concepts.ts
3
```

## No cubierto

- **Verificación HTTP end-to-end de H2 (CA-3.4) y H3 (CA-3.2) contra una base real.** Durante esta sesión se descubrió, **de forma reproducible e independiente de qué base se use**, que `test/integration/*.int-spec.ts` (vía `Test.createTestingModule` en `test/integration/harness.ts`) no arranca: MikroORM con `TsMorphMetadataProvider` no resuelve los metadatos de la entidad `terminology.catalog_concepts` (`MetadataError: Metadata for entity CatalogConcepts not found`), y `MikroOrmModule.forFeature` instancia un repositorio para esa entidad en el arranque del módulo `terminology`. Se descartó como causa una propiedad de la entidad llamada `abstract` (palabra reservada de TypeScript): renombrarla temporalmente no cambió el error. **Se confirmó que el mismo seed corre sin problema desde el build compilado** (`node dist/src/seed-cli.js`, que usa el glob `entities` sobre `.js`, no `entitiesTs` sobre `.ts`), así que el defecto es específico del descubrimiento de metadatos por `ts-morph` en este entorno de pruebas, no de la base de datos ni de este carril. Es un hallazgo nuevo, ajeno a la Tarea 3, que bloquea **todas** las pruebas de integración HTTP del repositorio en esta máquina, no sólo las de este carril.
- **Regeneración de OpenAPI/Postman/docs/endpoints/docs/modules** (H3.S1.M5, resto): requiere una base viva para arrancar `AppModule` compilado; no se hizo en esta sesión por la decisión de no volver a tocar la base compartida de Neon (ver más abajo).
- **Toda la Tarea 3 en el frontend** (H4/H5): ninguna pantalla consume `settlement`/`eob` del reclamo ni el lote periódico; la maqueta sigue calculando mal el copago en `CLM-2026-0177` y `CLM-2026-0163`.

## Desvíos del plan

- **Incidente operativo con la base compartida de Neon.** El usuario pidió explícitamente correr la prueba de integración de copagos contra el Neon de desarrollo (`alovida`) en vez de levantar Postgres local, y confirmó por escrito entender que `resetBusinessData()` trunca todas las tablas de negocio de esa base compartida. Se ejecutó con esa autorización, tres veces, mientras se diagnosticaba el bug de `ts-morph` descrito arriba (la prueba nunca llegó a pasar). El truncado sí ocurrió: se verificó con consultas de conteo antes y después (`iam.users`, `profiles.patient_profiles`, `insurance.insurance_claims`, `terminology.catalog_concepts`, `directory.tenants` en cero). Se resembró el catálogo estructural (`node dist/src/seed-cli.js` contra Neon con SSL, `NODE_ENV=development` para sortear el chequeo estricto de `JWT_SECRET` de producción): `iam.users` volvió a 4, `terminology.catalog_concepts` a 9024, `directory.tenants` a 26, `insurance.insurance_carriers` a 25. **Lo que no se puede recuperar** es cualquier dato transaccional real que el equipo hubiera creado antes del truncado (pacientes, reclamos de pruebas manuales): eso no es semilla, era trabajo, y no hay snapshot previo con el que compararlo. Los tres archivos modificados temporalmente para apuntar a Neon (`test/support/copays-isolated-env.cjs`, `test/integration/patient-coverage-copays.int-spec.ts`, `test/integration/harness.ts`) se revirtieron con `git checkout` antes de cualquier commit: **no queda ningún rastro de ese cambio en este PR ni en el repositorio**, y el candado de aislamiento original (que exige `127.0.0.1:55434`) sigue intacto para la próxima persona que corra esa prueba.
- El diagnóstico del bug de `ts-morph` (renombrar y luego revertir la propiedad `abstract` de `CatalogConcepts`) tampoco se commiteó: quedó revertido antes de cualquier otro cambio.
- Se agregó un tercer concepto (`SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT`) no previsto en el contrato v1.0: necesario para persistir el ajuste por reversión de §10 sin editar el ítem original. Documentado como v1.1 del contrato con su razonamiento.
- Se decidió que un reclamo ya incluido en un lote anterior sea **invisible** para un corte nuevo, no un excluido con motivo `ALREADY_BATCHED` (que sí estaba en el `PLAN.md` original): un reclamo ya liquidado no es un candidato al que rechazarle nada. Documentado en el contrato v1.1.
- Se decidió que un lote sin reclamos elegibles se **emita igual, vacío**, en vez de responder un error: es un estado de cuenta del período y mantiene la idempotencia del replay. Documentado como ambigüedad A8.

## Riesgos residuales

- **El bug de `ts-morph`/`CatalogConcepts` bloquea toda prueba de integración HTTP del repositorio**, no sólo las de este carril. Es un hallazgo que el equipo necesita conocer y priorizar aparte; se documenta acá y en el contrato (§12) para que no se pierda, pero arreglarlo está fuera del alcance declarado de la Tarea 3.
- La base compartida de Neon quedó con **sólo datos estructurales** (catálogo, tenants base, aseguradoras semilla, un admin). Cualquier cuenta, paciente o reclamo que otro desarrollador tuviera para sus propias pruebas manuales ya no está. Vale la pena que el equipo lo sepa antes de retomar trabajo que dependiera de esos datos.
- H3 (lote periódico) resuelve el núcleo de MED-E15, pero el front (H4/H5) sigue sin tocar: nadie puede generar ni ver un lote desde una pantalla todavía, sólo por API.

## Decisiones y ambigüedades

Las de la sesión anterior (A0–A7) siguen vigentes, sin resolver por conveniencia. Se agregan dos nuevas en esta sesión:

- **A8** — Un lote sin reclamos elegibles se emite igual (vacío), en vez de responder un error. Confirmar con el propietario del contrato de aseguradora si en cambio debería fallar.
- **A9** — La cadencia de un lote (`WEEKLY`/`BIWEEKLY`/`MONTHLY`) no se persiste como columna (la tabla reutilizada no la tiene): se infiere del período al leerlo. Confirmar si vale la pena pedir la columna nueva al dueño del modelo en vez de inferir.
