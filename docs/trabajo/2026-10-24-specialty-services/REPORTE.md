# Reporte — Servicios médicos exhaustivos por especialidad

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/festive-goldberg-wq7o2f` (desde `origin/dev` @ `08a7ff8a`)
- Peldaño de evidencia alcanzado: `TESTED` para el importador y las reglas; `VERIFIED` para la carga (Postgres desechable con el DDL real, carga real, persistencia consultada, re-carga = 0). No `REGRESSION_VERIFIED`: no corrió la suite completa ni la API.
- Avance: 9 / 9 microtareas HECHO (100 %); hitos H1–H4 HECHO.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M2 | Foto de las 63 especialidades del modelo y reglas de evidencia validadas | `corepack yarn test --runInBand src/common/seed/data/specialty-services` | `Tests: 13 passed, 13 total` |
| H1.S2.M1 | FONASA (copia npm) cotejada contra el PDF oficial del repo | `build-specialty-services.mjs` | `checkedAgainstPdf: 596`, `problems: []` |
| H1.S2.M2 | CUPS: cruce de dos copias | `build-specialty-services.mjs` | `agreed 7085 · onlyA 2716 · onlyB 574 · disagree 223` |
| H1.S3.M1 | Toda frase de prestador tiene regla | `build-specialty-services.mjs` | `unmatched: 0` |
| H1 | Corpus | `build-specialty-services.mjs --report` | 4 843 servicios, 4 923 relaciones, 52/63 especialidades |
| H1 (tests) | Reglas, cruces, corpus y plan | `node --test "tools/terminology-import/specialty-services/test/*.test.mjs"` | `# pass 10 · # fail 0` |
| H2.S1.M2 | Dry-run sin base | `load-specialty-services.mjs` | plan: 1 148 conceptos, 7 139 propiedades, 4 923 relaciones, 52 value sets |
| H2.S2.M1 | Carga real + idempotencia | `load-specialty-services.mjs --apply` ×3 | 1.ª inserta el plan entero; 2.ª y 3.ª insertan 0 en las 8 tablas |
| H2.S3.M1 | Corpus versionado en `data/` y carga sin armado local, en una base nueva | `load-specialty-services.mjs --apply` ×2 con `SPECIALTY_SERVICES_BUILD_DIR` vacío | 1.ª: plan entero; 2.ª: 0 (`evidencia/carga-desde-data-versionada.txt`) |
| H3 | Saturación documentada | — | `docs/seed-research/specialty-services.md` (pasadas 1–5), `SOURCES.md` |
| H4 | Gates | `corepack yarn typecheck` · `corepack yarn lint` | `exit=0` · `exit=0` |
| Regresión dirigida | Tests existentes de `tools/terminology-import` | `node --test "tools/terminology-import/test/*.test.mjs" "…/specialty-services/test/*.test.mjs"` | `# tests 43 · # pass 43 · # fail 0` |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Fuentes oficiales directas (FONASA PDF, CUPS SISPRO) | BLOQUEADO | Red con acceso a fonasa.gob.cl y sispro.gov.co: reemplazar el transporte en `lib/sources.mjs` y re-armar (los ids no cambian). |
| Especialidades faltantes en el modelo (Neurocirugía, Cirugía Plástica, Cirugía Cardiovascular y de Tórax, …) | BLOQUEADO | Cambio en `mantra-core-health-model` (`VS_MEDICAL_SPECIALTY`). Lista completa en el registro de investigación. Al cargarlas, re-correr el importador. |
| Nomenclador PAMI (Argentina) | BLOQUEADO | Verificar la licencia del dataset en datos.gob.ar. |
| Carga contra una base real (dev/test) | TODO | Correr `--apply` con `.env` de ese entorno después del paquete del modelo y del arranque de la API. |

## Evidencia

```
$ node tools/terminology-import/specialty-services/build-specialty-services.mjs
"records": 4843, "relations": 4923,
"fonasa": { "rows": 2515, "checkedAgainstPdf": 596 },
"cups": { "copyA": 10024, "copyB": 7882, "agreed": 7085, "onlyA": 2716, "onlyB": 574, "disagree": 223 },
"gaps": 80, "unmatched": 0
```

Filas por tabla (Postgres 16 desechable; antes · 1.ª carga · 2.ª carga) — `evidencia/filas-antes-despues.txt`:

```
concepts|6153      concepts|7301      concepts|7301
designations|1618  designations|2766  designations|2766
properties|0       properties|7139    properties|7139
relationships|0    relationships|4923 relationships|4923
value_sets|50      value_sets|102     value_sets|102
vs_members|888     vs_members|5811    vs_members|5811
batches|0          batches|3          batches|3
```

2.ª y 3.ª carga (`evidencia/carga-2-idempotencia.txt`, `evidencia/carga-3-tras-cambio.txt`):

```
{'concepts': 0, 'designations': 0, 'properties': 0, 'relationships': 0, 'valueSets': 0, 'valueSetVersions': 0, 'valueSetMembers': 0, 'batches': 0}
```

Consulta de punta a punta (Cardiología, con su evidencia): `evidencia/consulta-cardiologia.txt`.

Gates:

```
$ NODE_OPTIONS="--use-openssl-ca --max-old-space-size=8192" corepack yarn typecheck   → exit=0   (evidencia/typecheck.txt)
$ NODE_OPTIONS="--use-openssl-ca --max-old-space-size=8192" corepack yarn lint        → exit=0   (evidencia/lint.txt)
$ python3 -m mkdocs build --strict                                                    → exit=1, 2 avisos ajenos a este cambio:
  WARNING - MERMAID2 - Cannot check URL, no Internet access? (https://unpkg.com/mermaid@10.4.0/...)
  WARNING - Doc file 'architecture/module-layout.md' contains a link '../../src/modules/scheduling/README.md' ... not found
```

Con el heap por defecto (2 GB) `typecheck` y `lint` mueren por falta de memoria
en este contenedor; con 8 GB pasan. Ninguno de los dos avisos de MkDocs viene de
los documentos nuevos.

### Gates completos en una Mac local (2026-10-24, rama en `7e4268b3`)

Corridos con red y con `yarn install --immutable` (exit 0: acá `cdn.sheetjs.com`
responde). MkDocs con las versiones fijadas en `docs/requirements.txt`, las mismas
que instala CI.

```
$ corepack yarn build                      → exit=0, 26 s; dist/src/main.js generado          (evidencia/build.txt)
$ corepack yarn test --maxWorkers=50% --ci → 872/874 suites, 10 717/10 719 pruebas; 1 fallo   (evidencia/test-completo.txt)
$ corepack yarn docs:build                 → exit=1, 1 aviso                                  (evidencia/docs-build.txt)
$ corepack yarn docs:validate              → exit=1 en redocly lint: 3 errores + 1 aviso      (evidencia/docs-validate.txt)
$ corepack yarn docs:asyncapi:validate     → exit=0, 0 errores                                (evidencia/docs-asyncapi-validate.txt)
$ corepack yarn docs:coverage              → exit=0, 723 páginas, 70 módulos                  (evidencia/docs-coverage.txt)
$ corepack yarn docs:links                 → exit=0, 2 965 enlaces, 0 rotos                   (evidencia/docs-links.txt)
```

Ninguno de los tres rojos viene de este PR. La rama solo cambia `src/` dentro de
`src/common/seed/data/specialty-services/`, y `git diff origin/dev` sobre
`openapi/`, `asyncapi/`, `docs/architecture/` y `mkdocs.yml` da vacío:

- **`yarn test`:** `glossary-articles.catalog.spec.ts`. El artículo
  `hipertension-arterial` tiene 1 892 palabras y el mínimo es 2 000. Los datos de
  esa prueba son los mismos que en `dev`.
- **`docs:build`:** el enlace roto de `architecture/module-layout.md` a
  `src/modules/scheduling/README.md`, que está ahí desde `2a804f9e`
  (2026-10-09). El aviso de Mermaid de la corrida cloud no aparece porque acá hay
  red.
- **`docs:validate`:** el `openapi/openapi.yaml` versionado tiene 3 operaciones
  sin `security`:
  - `POST /iam/auth/upload-registration-signature-image`
  - `GET /public/profiles/o/{slug}/services`
  - `GET /public/profiles/f/{slug}/products`

  El aviso es el `example` de `SetSiteContactPhoneDto.contactPhone`. Por el `&&`
  del script, las otras tres etapas se corrieron por separado.

## No cubierto

- **La API no corrió.** Sin daemon de Docker no hubo Mongo/Redis/OpenSearch para `seed:boot`. En la base de prueba, los conceptos que siembra la API (estado activo, idioma, designación preferida, `REL_SPECIALTY`) y los 4 408 conceptos de `VS_BO_MEDICAL_PROCEDURE` se insertaron con **sus mismos ids** por un arnés (no versionado); `VS_MEDICAL_SPECIALTY` sí vino del paquete real del modelo (`03_terminology.seeds.json`, commit `eceb98f2`, sin sus 30 `concept_properties`, que el enum rechaza).
- **El endpoint `GET /terminology/value-sets/:id/$expand`** no se ejercitó sobre los value sets nuevos: se leyó su código (lee `value_set_members` de la versión vigente, que es lo que se carga) pero no se llamó.
- **Dependencias:** `yarn install --immutable` falla porque `xlsx` se resuelve desde `cdn.sheetjs.com` (bloqueado). Para los gates se instaló `xlsx@0.18.5` de npm y se restauraron `package.json` y `yarn.lock`; el typecheck corrió contra esa versión, no contra la 0.20.3 del lockfile.

## Desvíos del plan

- Rama: se trabajó en `claude/festive-goldberg-wq7o2f` (la que asigna la sesión) y no en `justin/seed-specialty-services`.
- Pedido de otra sesión («iterar con /loop hasta que sea imposible encontrar más»): las pasadas se hicieron en esta misma sesión y se cortaron por el protocolo (dos pasadas seguidas sin aportes). Un `/loop` repetiría las mismas búsquedas contra la misma red bloqueada; queda anotado para retomarlo con red abierta.

- Datos en git: el brief pedía «fuentes fuera de git». Por una orden posterior del propietario, transmitida por la sesión «Mejora de seeders médicos» («que terminen su trabajo y lo lleven todo a la nube»), el **corpus normalizado** se versiona comprimido en `tools/terminology-import/specialty-services/data/` (303 KB + 7 KB, con `MANIFEST.json` y SHA-256 por parte). Las **fuentes crudas** siguen fuera de git: se vuelven a bajar con URL, versión y SHA-256 fijos.

## Riesgos residuales

- FONASA: 27 de 29 grupos dependen de una copia de terceros verificada sólo en los grupos 03/04.
- CUPS: versión no declarada por ninguna copia; 12 servicios vienen de una sola copia (`review-status = single-copy`).
- Arancel SCZ: 60 filas relacionadas son OCR sospechoso (`ocr-suspect`); ya estaban así en `VS_BO_MEDICAL_PROCEDURE`.
- Los títulos de grupo FONASA se corroboraron por conteo contra una página no oficial.

## Decisiones y ambigüedades

- **Relación sin DDL:** `concept_relationships` servicio → especialidad con `REL_SPECIALTY` (concepto que la API ya siembra; misma dirección que el glosario: «el origen lo atiende la especialidad destino»). La procedencia de cada relación va en `concept_properties` (`specialty-service:evidence`) porque la tabla de relaciones no tiene columnas para eso — propuesto al modelo.
- **Sin mapeos entre nomencladores:** no se escribe `concept_maps`. La única deduplicación entre fuentes es por texto normalizado idéntico y sólo se usa para contar.
- **Arancel boliviano:** se reusan sus conceptos (no se duplican); si no existen en la base, sus relaciones se saltean y se informa.
- **Laboratorio fuera:** FONASA grupo 03 se excluye porque lo cubre la sesión de análisis.
- **Huecos, no reasignaciones:** una especialidad que el modelo no tiene nunca cae en la más parecida.
