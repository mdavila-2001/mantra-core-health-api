> **AVANCE (API): 26 / 30 microtareas — 86,7 %.** 2 a medias (int-spec real: causa raíz de
> `test:integration` sin confirmar, spec escrito sin correr), 1 descartada con causa
> (`docs:data:sync`) y 2 en este cierre (artefactos OpenAPI/Postman pendientes, PR).

# Reporte — Tarea 4 · certificación de campañas preventivas (API)

- **Predecesor:** Tarea 4 ya mergeada a `dev` (modelo #31, API #469, front #710) el 26/09.
- **Rama:** `marcelo/feat-insurance-prevention-campaigns-api` sobre `origin/dev` @ `710e6f1a`.
- **Plan:** [`PLAN.md`](PLAN.md) (H0–H5; este reporte cubre H0–H2, lo que corresponde a este repo).
- **Contrato:** [`docs/contracts/insurer-preventive-campaigns.md`](../../contracts/insurer-preventive-campaigns.md) (v1.1).

## Completado

| Hito | Qué quedó |
|---|---|
| H0 · arranque | Identidad git fijada, rama creada desde `origin/dev`, `yarn typecheck` corregido a exit 0 (`riskScore` string en `reproducciones.spec.ts`, ajeno a campañas) |
| H1.S1 · Neon | Patch `v4223` aplicado por el endpoint directo, dos pasadas idempotentes: `insurance` 29→31 tablas, 14 índices, 12 FK, 2 CHECK. Los 15 conceptos `CAMPAIGN_*` ya estaban sembrados |
| H1.S3 · catálogo ORM | `yarn orm:catalog` regenerado y acotado a mano al schema `insurance` (+12 FK, +14 índices); `audit-fidelity.mjs` en 0 hallazgos de campañas |
| H2.S1 · rutas y roles | `@Controller(['insurance/campaigns','insurance-campaigns'])`, `GET active` (pública), `GET my-benefits`, `INSURANCE_OPERATOR` con membresía activa |
| H2.S2 · CA-02 | 403 auditado (`INSURANCE_CAMPAIGN_ACCESS_DENIED`) contra campaña de otra aseguradora y contra todo 403 de administración; validación de membresía de red ajena (422) |
| H2.S3 · edición y vencimiento | `PATCH :id` en DRAFT/PAUSED, `effectiveStatus` derivado por fecha sin cron |
| H2.S4.M1 · ValidationPipe | `insurance-campaigns.controller.spec.ts` nuevo, 20 casos |
| H2.S4.M4 · regresión | `yarn typecheck` exit 0 (repetido tres veces); `yarn test src/modules/insurance src/common/seed`: 48 suites / 628 tests, exit 0 |
| H2.S5.M2 · defectos | `docs/progress/REGISTRO-DEFECTOS.md`: B-10 cerrado (cita `b660a187`), B-16 y B-17 nuevas |

## A medias

- **H2.S4.M2 — causa raíz de `test:integration`, resultado nuevo y distinto del que traía B-16.**
  Con `node_modules/.cache/mikro-orm` limpio, `insurance-plan-administration.int-spec.ts` corrió
  777 s contra Neon real (llegó a conectar: `postgresql://neondb_owner@ep-shy-snow-acyd0u4s-pooler…`)
  y falló con **`MetadataError: Metadata for entity InsuranceCampaignPartners not found`** — ya
  no el `CatalogConcepts` genérico que documentaba B-16 hasta ahora. La entidad que no resuelve es
  la que este mismo trabajo agregó. No se investigó la causa exacta (`TsMorphMetadataProvider`
  fallando al analizar `insurance_campaign_partners.entity.ts`, orden de descubrimiento, o algo
  más) ni se intentó arreglar: **no correspondía tocar más código de verificación en este cierre**.
  Evidencia completa en `evidencia/02-api-h2/int-spec-repro.txt`. `docs/progress/REGISTRO-DEFECTOS.md` (B-16)
  queda con la causa vieja; hay que actualizarlo con este hallazgo más preciso antes de intentar
  correr el int-spec de campañas.
- **H2.S4.M3 — `test/integration/insurance-campaigns.int-spec.ts`.** Escrito completo (8 casos:
  CA-01, aislamiento entre aseguradoras, CA-02.b auditado, 404 real, `INSURANCE_OPERATOR`, CA-04,
  edición, CA-02.e), sobre la plantilla de `insurance-plan-administration.int-spec.ts`. **No se
  ejecutó contra Neon**: rung de evidencia `WRITTEN`, no `TESTED`.

## Pendiente

| Ítem | Estado | Qué lo destraba |
|---|---|---|
| H2.S5.M1 — Regenerar OpenAPI/Postman/docs de módulos | `TODO` | Requiere Neon arriba y la app compilada; no se corrió en este cierre |
| H2.S5.M3 — Abrir PR contra `dev` | `EN CURSO` (se abre con este mismo commit) | — |
| H3–H5 del `PLAN.md` (front dev, mockup, cierre transversal) | `TODO` | Fuera de este repo; PRs aparte |

## Evidencia

En [`evidencia/`](evidencia/):
- `00-partida/`: estado de partida (git log de los 4 repos, PRs mergeados, Neon sin tablas de campaña).
- `01-neon/`: patch aplicado dos veces, conteos antes/después, log de fidelidad post-reinicio.
- `01-catalogo/`: `orm-catalog.txt`, `audit-fidelity.txt` (+ `fidelity-audit.json`), `test-seed.txt`
  (19 suites/170 tests del value set nuevo), `docs-data-sync.txt` (corrido y **no** commiteado, ver desvíos).
- `02-api-h2/`: `typecheck-h2-final.txt` (exit 0), `test-insurance-h2-completo.txt` y
  `test-insurance-seed-post-lint.txt` (48 suites/628 tests), `lint-h2.txt`/`lint-fix-h2.txt`,
  `int-spec-repro.txt` (diagnóstico de B-16, inconcluso).
- `pr/`: estado de los PR según GitHub (bóveda #84; este PR se agrega al abrirse).

## No cubierto

- El int-spec nuevo no se ejerció contra Postgres real: los 8 casos son código escrito, no
  comportamiento observado.
- `database/SQL` no se refrescó con `db:vendor` (deriva previa documentada en D-5 del contrato,
  ajena a esta tarea).
- Cobertura global (`test:cov`): no se volvió a medir; ya estaba bajo el umbral en `origin/dev`
  antes de este trabajo.
- Sin ejercitar contra la API real desde el front (eso corre en el PR del front).

## Desvíos del plan

1. **`docs:data:sync` se corrió y se revirtió.** Regeneraba secciones enteras de `data_catalog`/
   `qa_execution` (deriva de documentación preexistente, no de esta tarea) y una descripción
   desactualizada de `quotations`. Se dejó fuera del commit; el diff de `orm:catalog` sí se
   conservó porque quedó acotado a `insurance`.
2. **`fix_vault_fk.py` destapó 285 notas FK ajenas** (pharma_lab, audit, authz, iam,
   data_catalog, scheduling, qa_execution, clinical, community, profiles, accounting) al
   regenerar la bóveda para las 12 de campañas. Quedaron en un `git stash` local del repo de la
   bóveda, fuera de cualquier PR; declarado en B-10/docs/progress/REGISTRO-DEFECTOS.md.
3. **`xlsx-parser.ts`/`.spec.ts` se reformatearon solos** con `yarn lint --fix` sin haber sido
   pedidos (archivo ajeno, pre-existente, fuera de esta tarea) y se revirtieron antes de commitear.
4. **No se regeneraron los artefactos OpenAPI/Postman** (H2.S5.M1): exige Neon arriba y compilar
   la app; se prioriza cerrar el PR y dejarlo declarado como pendiente en vez de demorar el cierre.

## Riesgos residuales

| Riesgo | Impacto |
|---|---|
| Alias `insurance-campaigns` sin retirar | Dos rutas activas para el mismo recurso hasta que el front y los artefactos migren |
| `test:integration` con resultado real desconocido para este módulo | El aislamiento por tenant y la auditoría CA-02 no están verificados contra Postgres real, sólo con `EntityManager` mockeado |
| `database/SQL` con deriva propia sin refrescar | Documentado, no introducido por esta tarea |

## Decisiones y ambigüedades

Ver §9 del contrato v1.1 (`insurer-preventive-campaigns.md`): A16 (`INSURANCE_ADMIN` ≡ OWNER/ADMIN),
A17 (edición sólo en `DRAFT`/`PAUSED`), D-6 (CA-02 responde 403 auditado, revierte la v1.0). Todas
tomadas con el usuario en la sesión del 26/09.
