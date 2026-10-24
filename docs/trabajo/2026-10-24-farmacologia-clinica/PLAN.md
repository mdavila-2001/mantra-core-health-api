# Plan — Vademécum de farmacología clínica (monografías por ATC 5)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: catálogo universal de medicamentos (`build-medicine-catalog.mjs`, 2026-10-01) y corte S3 del glosario (`encyclopedia/s3-farmacos`)
- Resultado observable: en `terminology.*`, para cada principio activo (ATC 5), las secciones literales de su ficha técnica oficial (indicaciones, posología, contraindicaciones, advertencias, interacciones, reacciones adversas con frecuencia, embarazo/lactancia, sobredosis, mecanismo, farmacocinética, formas y vías) con fuente, documento, versión, URL, fecha y cita por sección.
- Kill-test: `psql -c "select count(*) from terminology.concept_properties where property_code like 'pharmacology_section_%'"` en una base cargada; si da 0, no está hecho.

> **Desvío:** este plan se escribió **después** del código. `AGENTS.md` (que exige plan previo)
> no estaba en la rama de arranque de la sesión y se descubrió al recibir la orden de subir todo.
> Se escribe igual, con el estado real de cada microtarea.

## Alcance

- IN: `tools/terminology-import/clinical-pharmacology/` (código, pruebas, `SOURCES.md`, `data/`), `docs/seed-research/clinical-pharmacology.md`, un párrafo agregado al final de `tools/terminology-import/README.md`, este directorio.
- OUT: `src/` (ningún cambio en la API), DDL/migraciones (ADR-0021), el code system `vademecum` y el catálogo de productos (sólo se enlazan por código), relaciones fármaco→enfermedad (las carga `justin/seed-drug-treatments`), enfermedades (`justin/seed-diseases`).
- Ambigüedades registradas:
  1. Rama: el pedido dice `justin/seed-clinical-pharmacology`; el entorno asignó `claude/fervent-galileo-t68vaj`. Supuesto: se trabaja en la primera y se empuja el mismo commit a las dos. Confirmar con Justin.
  2. Posología: el corte S3 la prohíbe para pacientes; este pedido la exige. Supuesto: se incluye marcada `audience: 'professional'` y fuera de los value sets del glosario. Confirmar con el propietario.
  3. Granularidad: una ficha de referencia por (VTM, vías) por defecto; `--granularity product` para todas. Confirmar con el propietario si quiere todas las fichas de todos los titulares.
  4. Orden nueva del propietario (vía sesión «Mejora de seeders médicos»): versionar lo normalizado en `data/` (gz, < 50 MB por archivo); los crudos no. Cambia el «fuentes fuera de git» del brief sólo para lo normalizado.

## H1 — Discovery y encaje en el modelo
**CA:** Dado el módulo 03, cuando se diseña la monografía, entonces cabe sin DDL o se reporta la propuesta.
**DoD:** lectura de `database/SQL/03_terminology/*.sql` + carga real en H2.S3.M2.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Verificar que una sección por fila cabe en `concept_properties` | No hay índice único por (concepto, código) y `value_json` es jsonb | `grep -n -i unique database/SQL/03_terminology/04_indexes.sql` → ninguno sobre `concept_properties` | HECHO |
| H1.S1.M2 | Comprobar ramas hermanas | Se sabe si existen | `git branch -r \| grep -E "seed-(diseases\|drug-treatments)"` → vacío | HECHO |

## H2 — Importador
**CA:** Dado lo descargado, cuando se corre build + load, entonces quedan monografías literales con procedencia, y la segunda carga inserta 0.
**DoD:** `node --test …/clinical-pharmacology/test/*.test.mjs` verde + carga doble en Postgres desechable.
**Estado:** A MEDIAS (fetchers sin correr: red bloqueada)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Catálogo de secciones + extracción literal (texto, tablas) | Texto = `htmlToText` de la fuente; tablas celda a celda | test «las secciones son el texto literal…» verde | HECHO |
| H2.S1.M2 | Normalizador CIMA (referencia determinista, cita) | Con fixture real 15419, cita con nº reg., sección y versión | tests CIMA verdes | HECHO |
| H2.S1.M3 | Normalizador openFDA | Con una partición REAL, secciones por campo con set_id/versión | test con partición real | A MEDIAS |
| H2.S1.M4 | Parsers RxNav | Con respuestas REALES, ATC 5 → RxCUI → UNII | test con respuestas reales | A MEDIAS |
| H2.S1.M5 | Monografía + plan de carga | 5 niveles, IS_A, ids estables y únicos | test «plan de carga» verde | HECHO |
| H2.S2.M1 | `fetch-cima.mjs` | Baja fichas completas de todas las referencias | correrlo → `fetch.meta.json` | BLOQUEADO |
| H2.S2.M2 | `fetch-rxnorm.mjs` | Baja el puente de cada ATC 5 del universo | correrlo → `fetch.meta.json` | BLOQUEADO |
| H2.S2.M3 | `fetch-openfda.mjs` | Baja todas las particiones con sha256 | correrlo → `fetch.meta.json` | BLOQUEADO |
| H2.S3.M1 | `build-monographs.mjs` | Arma monografías desde la caché, sin red | `node build-monographs.mjs` exit 0 | HECHO |
| H2.S3.M2 | `load-clinical-pharmacology.mjs` idempotente | 2.ª carga: 0 nuevas, 0 borradas | evidencia/06 | HECHO |
| H2.S3.M3 | `coverage-report.mjs` | Informe por nivel ATC, fuente, catálogo y huecos | evidencia/02 | HECHO |
| H2.S3.M4 | `validate-links.mjs` | Detecta ATC 5 sin monografía en relaciones de otros code systems | evidencia/07 (relación simulada) | HECHO |
| H2.S3.M5 | `pack-data.mjs` | Lo normalizado en `data/` gz < 45 MB por parte, con MANIFEST | test «pack-data» + evidencia/04 | HECHO |

## H3 — Protocolo de saturación
**CA:** Dado el universo de ATC 5, cuando dos pasadas seguidas con fuentes nuevas aportan 0, entonces se declara saturado.
**DoD:** tabla de pasadas en `docs/seed-research/clinical-pharmacology.md`.
**Estado:** BLOQUEADO (red)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Pasada 0: fuentes del repo | Universo medido | evidencia/01 | HECHO |
| H3.S1.M2 | Pasada 1: CIMA | ATC 5 y secciones nuevas medidas | fila en el registro | BLOQUEADO |
| H3.S1.M3 | Pasada 2: RxNav + openFDA | Ídem | fila en el registro | BLOQUEADO |
| H3.S1.M4 | Pasadas 3–6 (CIMA exhaustiva, DailyMed, EMA/FTN, maestra) | Dos ceros seguidos | filas en el registro | BLOQUEADO |
| H3.S2.M1 | Validar enlace con `seed-drug-treatments`/`seed-diseases` | `validate-links` sobre sus datos | evidencia | BLOQUEADO |

## H4 — Documentación y entrega
**CA:** Dado el PR, cuando lo lee alguien que no vio la sesión, entonces sabe qué hay, qué falta y por qué.
**DoD:** archivos en disco + PR abierto + gates.
**Estado:** A MEDIAS

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | `SOURCES.md` con licencias verificadas | Cada licencia confirmada en su página | lectura de cada página | A MEDIAS |
| H4.S1.M2 | Registro de pasadas | Pasadas y descartes escritos | archivo en disco | HECHO |
| H4.S1.M3 | typecheck, lint, specs dirigidos | exit 0 | evidencia/08–10 | HECHO |
| H4.S1.M4 | PR contra `dev` sin mergear | PR abierto | URL del PR | HECHO |
| H4.S1.M5 | PLAN.md + REPORTE.md | En disco | este archivo | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red de la sesión bloquea todas las fuentes | Sin datos: no hay monografías ni saturación | Código listo y probado; hosts listados en `SOURCES.md` para habilitar |
| Parsers openFDA/RxNav sin datos reales | Pueden fallar en la primera corrida | Parsers defensivos (vacío ante forma desconocida); agregar fixtures reales en la primera corrida |
| Volumen jsonb (HTML + texto por sección) | Tamaño de la base | Medir en la primera carga real y registrarlo con su tamaño |
