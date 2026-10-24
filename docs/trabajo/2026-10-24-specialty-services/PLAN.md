# Plan — Servicios médicos exhaustivos por especialidad

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (sólo lectura de `mantra-core-health-model` y `mantra-core-health`) · Predecesor: carril 22 (FT-22, `billing.service_catalog` con «Cita médica») y carril 23 / FX-6 (`VS_BO_MEDICAL_PROCEDURE`, nomenclador importable)
- Resultado observable: para cada especialidad de `VS_MEDICAL_SPECIALTY`, `GET /terminology/value-sets/:id/$expand?includeProperties=true` sobre `VS_SPECIALTY_SERVICES_<CÓDIGO>` devuelve sus servicios, cada uno con fuente, código, versión, URI y la evidencia que lo ata a la especialidad.
- Kill-test: un servicio del corpus cuya relación con la especialidad no tenga una regla de `rules.json` que cite el texto de la fuente; o una segunda carga que inserte filas.

## Alcance

- IN: `src/common/seed/data/specialty-services/`, `tools/terminology-import/specialty-services/`, `docs/seed-research/specialty-services.md`, este directorio de trabajo.
- OUT: DDL y migraciones (ADR-0021); el seed de arranque; el catálogo `billing.service_catalog` de cada práctica; los análisis de laboratorio (otra sesión); archivos compartidos con las otras tres sesiones (no se tocan).
- Ambigüedades registradas:
  - «Rama `justin/seed-specialty-services`» vs. la rama designada por la sesión (`claude/festive-goldberg-wq7o2f`). Supuesto: se usa la designada (las instrucciones de la sesión prohíben empujar a otra). Confirmar con Justin si quiere renombrarla.
  - «Las especialidades ya sembradas»: el comentario de la API dice 36; el paquete del modelo trae 63. Supuesto: las 63 del modelo (es lo que siembra la base real).
  - «Servicios de los carriles 22/23»: el 22 es el catálogo por práctica (FT-22) y el 23 el nomenclador `VS_BO_MEDICAL_PROCEDURE`. Supuesto: el nomenclador es el catálogo global a relacionar, sin duplicarlo.

## H1 — Corpus con evidencia

**CA:** Dado el arancel boliviano, FONASA MLE 2026 y CUPS, cuando se arma el corpus, entonces cada servicio trae ≥ 1 especialidad del modelo con su regla de evidencia, y lo que la fuente atribuye a especialidades ausentes queda contado como hueco.
**DoD:** `node tools/terminology-import/specialty-services/build-specialty-services.mjs --report` → exit 0, `unmatched = 0`; `node --test "tools/terminology-import/specialty-services/test/*.test.mjs"` → 9/9.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Foto de `VS_MEDICAL_SPECIALTY` del modelo | 63 códigos únicos con commit de origen | `corepack yarn test src/common/seed/data/specialty-services` → verde | HECHO |
| H1.S1.M2 | Reglas de evidencia (`rules.json`) | Toda especialidad nombrada existe en la foto; toda equivalencia no literal tiene nota | ídem | HECHO |
| H1.S2.M1 | FONASA verificado contra el PDF oficial del repo | 596/596 iguales; un desacuerdo aborta | build → `checkedAgainstPdf: 596`, `problems: []` | HECHO |
| H1.S2.M2 | CUPS cruzado entre dos copias | Sólo entra lo coincidente o lo de una sola copia; nunca lo contradicho | test «CUPS: entra lo que las dos copias dicen igual…» | HECHO |
| H1.S3.M1 | Barrido de frases de prestador sin regla | `unmatched = 0` | build | HECHO |

## H2 — Carga idempotente sin DDL

**CA:** Dado un Postgres con el DDL del repo, cuando se corre el cargador dos veces, entonces la primera inserta el plan y la segunda inserta 0 en todas las tablas.
**DoD:** `load-specialty-services.mjs --apply` ×2 contra un Postgres desechable; conteos antes/después en `evidencia/`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Plan puro (`lib/load-plan.mjs`) | Ids deterministas; sin `concept_maps` | test «plan: ids deterministas…» | HECHO |
| H2.S1.M2 | Cargador con dry-run por defecto | Sin `--apply` no abre conexión | `load-specialty-services.mjs` → «Dry-run: nada se escribió» | HECHO |
| H2.S2.M1 | Carga real y re-carga | 2.ª corrida = 0 filas | `evidencia/carga-2-idempotencia.txt` | HECHO |

## H3 — Saturación documentada

**CA:** Dado el protocolo, cuando se registran las pasadas, entonces hay dos seguidas con 0 nuevos para toda especialidad y cada fuente descartada tiene motivo.
**DoD:** `docs/seed-research/specialty-services.md` con pasadas 1–5, cobertura por especialidad, huecos y propuesta al modelo; `SOURCES.md` con hash y licencia por fuente.
**Estado:** HECHO

## H4 — Gates

**CA:** typecheck, lint y specs dirigidos en verde.
**DoD:** `corepack yarn typecheck`, `corepack yarn lint`, `corepack yarn test src/common/seed/data/specialty-services`, `node --test …` → exit 0.
**Estado:** HECHO

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sitios oficiales bloqueados por la red de la sesión | Fuentes por copias de terceros | Cotejo contra una fuente independiente (PDF oficial del repo, segunda copia); hash fijado; transporte declarado en `SOURCES.md` |
| `cdn.sheetjs.com` bloqueado: `yarn install --immutable` falla | Sin dependencias no hay gates | Instalación local con `xlsx@0.18.5` de npm y `package.json`/`yarn.lock` restaurados antes del commit (no se versiona el cambio) |
| Sin daemon de Docker: no se puede arrancar la API con Mongo/Redis | `seed:boot` no corre | Postgres 16 local con el DDL real y el paquete de terminología real del modelo; los conceptos que siembra la API se simulan con sus mismos ids (declarado) |
