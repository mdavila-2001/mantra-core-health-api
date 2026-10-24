# Plan — Cuidados de enfermería: importador de terminología con procedencia

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `justin/seed-nursing-care`, desde `origin/dev` 08a7ff8a) · Predecesor: `2026-09-30-glosario-es-importadores` (deja «Cuidados de enfermería» sin aportes)
- Resultado observable: quien corre `node tools/terminology-import/nursing-care/load-nursing-care.mjs --apply` contra una base con el esquema del modelo ve en `terminology.*` las escalas de valoración, valoraciones y procedimientos de enfermería con su jerarquía, su licencia y su procedencia por fila; el glosario (`glossary-category-care`) deja de estar vacío.
- Kill-test: `SELECT count(*) FROM terminology.catalog_concepts cc JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id JOIN terminology.code_systems cs ON cs.id = v.code_system_id WHERE cs.internal_code LIKE 'nursing-%' OR cs.internal_code = 'openehr-ckm'` → 0 filas = no está hecho; una segunda corrida que inserte > 0 = no es idempotente.

## Alcance
- IN: `tools/terminology-import/nursing-care/` (importador, librerías, tests, `SOURCES.md`, `README.md`), `docs/seed-research/nursing-care.md` (bitácora de pasadas y cobertura), este directorio (`PLAN.md`, `REPORTE.md`), una línea aditiva en `package.json` (script de tests) si hace falta.
- OUT: DDL, migraciones, `synchronize`; entidades y servicios de `src/`; los demás importadores y el corpus del glosario (`TERM_LAYERS`); fichas clínicas existentes; el repo del modelo; las ramas de las otras sesiones (no se pushea ningún merge de validación).
- Ambigüedades registradas:
  - A1. La sesión pide la rama `justin/seed-nursing-care`; el arnés de la sesión nombra otra rama de desarrollo. Supuesto: se usa la rama del pedido del propietario (es la que nombra el PR esperado). Confirmar con Justin.
  - A2. `AGENTS.md` exige `PLAN.md`/`REPORTE.md` en `docs/trabajo/`; el pedido limita los archivos propios a tres rutas. Supuesto: `docs/trabajo/2026-10-24-seed-nursing-care/` es un directorio nuevo, propio y aditivo, y la regla de la casa gana (AGENTS §1).
  - A3. La red del contenedor rechaza casi todos los hosts de fuentes (omahasystem.org, NLM, Europe PMC, openEHR CKM web, ICN, RNAO, NICE, OMS, ministerios). Se usa lo alcanzable: GitHub (espejo oficial de openEHR CKM), registro npm (paquete `hl7.terminology`) y búsqueda web del lado del servidor **sólo para descubrir fuentes y verificar licencias**. Ningún dato que pase por un resumen de modelo se carga.
  - A4. Las traducciones al castellano de los arquetipos son las publicadas en CKM por traductores nombrados: se cargan como designación con su autor y se marcan «traducción publicada en openEHR CKM», nunca como traducción oficial de la escala.
  - A5. Una escala con aviso de copyright de terceros en su propio arquetipo se carga sólo con metadatos (nombre, propósito, uso, aviso, referencias, enlace LOINC de la raíz); sus ítems y respuestas no. Sin aviso de terceros se cargan ítems y respuestas con puntaje, bajo CC-BY-SA, con la atribución por fila. Confirmar con legal el alcance de *share-alike*.
  - A6. El subconjunto «enfermería» de CKM es una regla de texto documentada (navegación), no juicio clínico; el sistema de códigos completo se carga entero.
  - A8. (agregada en curso, 2026-10-24) Orden del propietario, transmitida por la sesión coordinadora «Mejora de seeders médicos»: todo debe quedar subido, incluidos los datos normalizados, comprimidos y en partes de menos de 50 MB; los crudos pesados no. Cambia el «fuentes fuera de git» del pedido original para los normalizados. Supuesto: se versionan los normalizados en `tools/terminology-import/nursing-care/data/` y los crudos se reproducen con `fetch-sources.mjs` (commits y tarball fijos). Los crudos de CKM no se suben porque contienen ítems con copyright de terceros.
  - A7. (agregada en curso) Los arquetipos ISO 13606 del Ministerio de Sanidad (CMDIC) no declaran licencia. Supuesto: se cargan con estado `official-publication-license-not-stated` y la base legal (RD 1093/2010; art. 13 TRLPI). Confirmar con el propietario y, por escrito, con el Ministerio.

## H1 — Corpus normalizado con procedencia por fila
**CA:** Dado el espejo de CKM en un commit fijo y el paquete `hl7.terminology@7.0.1`, cuando se corre el *build*, entonces sale NDJSON con un concepto por arquetipo, elemento y respuesta, cada uno con fuente, id de origen, versión, URI, fecha y licencia, y un reporte de cobertura con conteos reales.
**DoD:** `node tools/terminology-import/nursing-care/build-nursing-care.mjs` termina 0 y escribe `nursing-care/coverage.json`; `node --test tools/terminology-import/nursing-care/test/` en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Parser ADL 1.4 (ODIN + cADL liviano) | lee concepto, traducciones, descripción, `other_details`, términos por idioma, ordinales y enlaces de un arquetipo real | `node --test …/test/adl.test.mjs` → pass | HECHO |
| H1.S1.M2 | Clasificación de licencia del contenido por arquetipo | Braden → `third-party-copyright`; un arquetipo sin aviso → `cc-by-sa-no-third-party-notice` | test dirigido → pass | HECHO |
| H1.S1.M3 | Normalización CKM → filas (arquetipo/elemento/respuesta, jerarquía, ES/EN) | ids estables; hijos apuntan a su padre | test dirigido → pass | HECHO |
| H1.S2.M1 | Registro de terminologías de enfermería (HL7 THO NamingSystem) | CCC, ICNP, NANDA-I, NIC, NOC, PNDS, Omaha con OID/URI verbatim | test dirigido → pass | HECHO |
| H1.S3.M1 | `fetch-sources.mjs` (clon fijo + tarball npm con SHA-256) | cache fuera de git con `.meta.json` | corrida → exit 0 | HECHO |
| H1.S3.M2 | `build-nursing-care.mjs` + `coverage.json` | conteos reales por tipo | corrida → exit 0 | HECHO |

## H2 — Carga idempotente a `terminology.*`
**CA:** Dada una base con el esquema del modelo y los conceptos internos sembrados, cuando se corre la carga dos veces, entonces la primera inserta N filas y la segunda 0.
**DoD:** Postgres desechable con `database/SQL` + conceptos internos; dos corridas con salida pegada.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Plan de carga puro (tuplas) | ids deterministas únicos | `load-nursing-care.mjs` (dry-run) → exit 0 | HECHO |
| H2.S1.M2 | Enlaces por código a LOINC (`concept_maps`) resueltos en la base | sólo destinos existentes; faltantes contados | corrida `--apply` | HECHO |
| H2.S1.M3 | Membresías del glosario `care` para conceptos raíz con nombre ES | miembros en `glossary-category-care` | consulta SQL | HECHO |
| H2.S2.M1 | Carga real + idempotencia en Postgres desechable | 2.ª corrida = 0 filas | salida pegada en REPORTE | HECHO |

## H3 — Saturación, relaciones y entrega
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Bitácora de pasadas en `docs/seed-research/nursing-care.md` | dos pasadas seguidas con 0 nuevos, o hueco documentado por fuente | archivo presente | HECHO |
| H3.S1.M2 | Script de validación de enlaces con ramas hermanas (`link-check.mjs`) | listo; ramas ausentes → pendiente declarado | corrida → exit 0 | HECHO |
| H3.S2.M1 | `corepack yarn typecheck` y `corepack yarn lint` | exit 0 | salida pegada | HECHO |
| H3.S1.M3 | (agregada) Fuente CMDIC del Ministerio de Sanidad (ISO 13606) | 58 arquetipos, informe de enfermería con sus ranuras | test dirigido + carga | HECHO |
| H3.S2.M2 | PR contra `dev` (sin mergear) + `REPORTE.md` | PR abierto | URL | HECHO |
| H3.S3.M1 | (agregada, A8) `pack-data.mjs`: normalizados gzip en `data/` con `MANIFEST.json` | partes < 50 MB; misma entrada → mismos bytes | `node …/pack-data.mjs` dos veces → `sha256sum` idéntico | HECHO |
| H3.S3.M2 | (agregada, A8) `load-nursing-care.mjs --from-repo-data` | dada una base limpia y sin build local, la carga desde `data/` da los mismos conteos y la 2.ª corrida 0 | `evidencia/load-desde-data-versionada.txt` | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Hosts de fuentes bloqueados por la red del contenedor | Omaha, CCC, ICNP, guías y normas no se pueden descargar | hueco documentado con URL y licencia; pedir al propietario habilitar dominios |
| Copyright de terceros en escalas | cargar contenido sin permiso | regla A5: sólo metadatos |
| *Share-alike* de CC-BY-SA 3.0/4.0 | obligación sobre obras derivadas | atribución por fila y nota para legal |
| SNOMED CT en enlaces de arquetipos | Bolivia no es miembro | no se cargan; sólo se cuentan |
