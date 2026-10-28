# Plan — Consentimiento informado dirigido y derivaciones a servicios específicos (API)

- Fecha: 2026-10-28 · Repos afectados: `mantra-core-health-api` (este) · Predecesor: v4.2.62 (`siat_mode`)
- Contrato común: `CONTRATO.md` de la sesión (§1 esquema, §2 API).
- Resultado observable: un médico registra un consentimiento informado **dirigido** a una
  receta, orden de estudio, derivación, procedimiento o plan de cuidados, lo lista, lo lee y
  lo revoca; y emite una derivación tipada a un servicio específico (profesional, tenant,
  sede o destino externo), la lee, la responde con motivo de rechazo y registra la
  contrarreferencia.
- Kill-test: `POST /referrals` con `informedConsentId` de otro paciente devuelve 201.

## Alcance
- IN: patch `database/SQL/patches/2026-10-28_v4266_*.sql`; espejo DDL en
  `database/SQL/07_consent` y `database/SQL/18_clinical_ext`; entidades, DTOs, repositorios,
  servicios, controladores y specs de `consent` (consentimiento de tratamiento) y
  `clinical_ext` (derivaciones).
- OUT: el resto del desfase `database/` ↔ modelo (cds_rule_versions, 05_constraints) — se
  anota, no se resincroniza; autorización de los endpoints existentes `GET /referrals` y
  `PATCH /referrals/:id/respond` (sin cambios de política); OpenAPI generado (requiere infra).
- Ambigüedades registradas:
  - `status`/`decision` de `TreatmentInformedConsentResponseDto` eran concept ids; el contrato
    los pide legibles. Supuesto: pasan a legibles y los ids quedan en `statusConceptId` /
    `decisionConceptId` (no hay consumidores en front ni móvil). Confirmar con quien orquesta.
  - `POST /consent/treatment-informed-consents` era sólo `SECURITY_ADMIN`; el contrato lo hace
    la entrada del front clínico. Supuesto: se abre a `CLINICIAN`/`PRACTITIONER` con el
    paciente y el tenant salidos del encuentro y `assertCanWriteHistory`, igual que la ruta
    por encuentro (CL-77). `SECURITY_ADMIN` conserva su comportamiento.

## H1 — Esquema
**CA:** Dado el patch v4266, cuando se aplica dos veces, entonces no falla y deja las columnas
nullable de §1. **DoD:** revisión del SQL (sin Postgres en la sesión: no se ejecutó). **Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Patch idempotente | ADD COLUMN IF NOT EXISTS + CHECK en DO $$ | lectura del archivo | HECHO |
| H1.S1.M2 | Espejo DDL 07/18 | columnas e índices en 02/04/90 | `git diff --stat database/` | HECHO |

## H2 — Consentimiento dirigido
**CA:** Dado un médico con escritura sobre la historia, cuando registra/lista/lee/revoca, entonces
se cumplen las reglas de §2 con reasons estables. **DoD:** `yarn test src/modules/consent` verde. **Estado:** HECHO

## H3 — Derivaciones a servicios específicos
**CA:** Dado un médico, cuando crea una derivación tipada con consentimiento, entonces se valida
destino ≥1, resumen y servicio, y el consentimiento (mismo paciente, ACCEPTED, no revocado).
**DoD:** `yarn test src/modules/clinical_ext` verde. **Estado:** HECHO

## H4 — Gates
**DoD:** `yarn lint`, `yarn typecheck`, `yarn build`, tests de los módulos tocados. **Estado:** HECHO

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin Postgres ni infra | no se ejercita el camino real | se declara `TESTED`, no `VERIFIED` |
| `yarn install` bloqueado por proxy | sin gates | `COREPACK_NPM_REGISTRY` |
