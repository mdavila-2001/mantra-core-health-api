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
  5. eEML (CC BY 3.0 IGO): la licencia excluye el uso «In conjunction with the advertising or promotion of commercial products». Supuesto: una app clínica no es publicidad. Confirmar con el propietario.
  6. AEMPS exige «mencionar la fecha de la última actualización»; 788 fichas de CIMA no la publican. Supuesto: se publican con `versionUnpublished` y la fecha de consulta. Confirmar con el propietario.

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
**Estado:** EN CURSO (DailyMed y CIMA exhaustiva descargando)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Catálogo de secciones + extracción literal (texto, tablas) | Texto = `htmlToText` de la fuente; tablas celda a celda | test «las secciones son el texto literal…» verde | HECHO |
| H2.S1.M2 | Normalizador CIMA (referencia determinista, cita) | Con fixture real 15419, cita con nº reg., sección y versión | tests CIMA verdes | HECHO |
| H2.S1.M3 | Normalizador openFDA | Con una partición REAL, secciones por campo con set_id/versión | `test/gsrs-openfda-real.test.mjs` verde | HECHO |
| H2.S1.M4 | Parsers RxNav | Con respuestas REALES, ATC 5 → RxCUI → UNII | `test/fixtures/rxnav-real/` + test verde | HECHO |
| H2.S1.M5 | Monografía + plan de carga | 5 niveles, IS_A, ids estables y únicos | test «plan de carga» verde | HECHO |
| H2.S1.M6 | Puente GSRS (UNII → fracción activa → WHO-ATC) + lector en streaming | Con sustancias reales: sal → ATC del principio; combinación sólo con su combinación | `test/gsrs-openfda-real.test.mjs` verde | HECHO |
| H2.S1.M7 | Normalizador EMA («Medicines output») | Sólo uso humano autorizado; ATC 5 de la EMA; cita en cada fila | test «EMA real» verde | HECHO |
| H2.S1.M8 | Parser SPL de DailyMed (identidad, UNII ACTI*, secciones LOINC) | Con un SPL real, UNII activos sin los inactivos | test con `dailymed-spl-349fa84e.xml` verde | HECHO |
| H2.S1.M9 | Normalizador eEML de la OMS | ATC 5 de la OMS; sin ATC no enlaza; CIE-11, atribución y advertencia en cada fila | test «eEML real» verde | HECHO |
| H2.S2.M1 | `fetch-cima.mjs` (fichas de referencia + maestra ATC) | Baja fichas completas de todas las referencias | evidencia/17 | HECHO |
| H2.S2.M2 | `fetch-rxnorm.mjs` | Baja el puente de cada ATC 5 del universo | evidencia/16 | HECHO |
| H2.S2.M3 | `fetch-openfda.mjs` | Baja todas las particiones con sha256 | 14/14 particiones | HECHO |
| H2.S2.M4 | `fetch-gsrs.mjs` | Baja y normaliza las sustancias GSRS | 167 385 = declarados | HECHO |
| H2.S2.M5 | `fetch-ema.mjs` | Baja el informe con sha256 y fecha de generación | `cache/ema/fetch.meta.json` | HECHO |
| H2.S2.M6 | `fetch-dailymed.mjs` | Identidad de las 17 729 SPL candidatas | `fetch.meta.json` sin `plan: true` | EN CURSO |
| H2.S2.M7 | `fetch-eml.mjs` | 1 132 recomendaciones de la portada | evidencia/19: 1 132/1 132, 0 fallos | HECHO |
| H2.S2.M8 | `fetch-cima.mjs --granularity product` | Las 22 506 fichas de todos los titulares | log con 22 506/22 506 | EN CURSO |
| H2.S3.M1 | `build-monographs.mjs` | Arma monografías desde la caché, sin red | evidencia/19 exit 0 | HECHO |
| H2.S3.M2 | `load-clinical-pharmacology.mjs` idempotente | 2.ª carga: 0 nuevas, 0 borradas | evidencia/11 y 21 | HECHO |
| H2.S3.M3 | `coverage-report.mjs` | Informe por nivel ATC, fuente, catálogo y huecos | evidencia/20 | HECHO |
| H2.S3.M4 | `validate-links.mjs` | Detecta ATC 5 sin monografía | evidencia/21 | HECHO |
| H2.S3.M5 | `pack-data.mjs` | Lo normalizado en `data/` gz < 45 MB por parte, con MANIFEST | `data/MANIFEST.json`: 4 partes, la mayor 39,9 MB | HECHO |
| H2.S3.M6 | Lectura de NDJSON > 512 MB | Cobertura, carga y empaquetado leen 549 MB sin `ERR_STRING_TOO_LONG` | test `ndjsonLines` + evidencia/20 | HECHO |

## H3 — Protocolo de saturación
**CA:** Dado el universo de ATC 5, cuando dos pasadas seguidas con fuentes nuevas aportan 0, entonces se declara saturado.
**DoD:** tabla de pasadas en `docs/seed-research/clinical-pharmacology.md`.
**Estado:** EN CURSO (5 pasadas con aporte > 0; 6 y 7 descargando)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Pasada 0: fuentes del repo | Universo medido | evidencia/01 | HECHO |
| H3.S1.M3 | Pasada 1: openFDA + GSRS | ATC 5 y secciones nuevas medidas | evidencia/13–14: 1 033 / 18 853 | HECHO |
| H3.S1.M5 | Pasada 2: RxNav | Ídem | evidencia/16: +104 (−7) / +2 252 | HECHO |
| H3.S1.M2 | Pasada 3: CIMA | Ídem | evidencia/17: +1 432 / +46 100 | HECHO |
| H3.S1.M6 | Pasada 4: EMA | Ídem | evidencia/18: +59 / +1 401 | HECHO |
| H3.S1.M7 | Pasada 5: eEML de la OMS | Ídem | evidencia/19: +88 / +1 568 | HECHO |
| H3.S1.M8 | Pasada 6: DailyMed | Ídem | build con y sin `--no-dailymed` | EN CURSO |
| H3.S1.M9 | Pasada 7: CIMA exhaustiva | Ídem | build `--granularity product` | EN CURSO |
| H3.S1.M10 | Dos pasadas seguidas con 0 | Dos filas seguidas en 0 | registro de pasadas | TODO |
| H3.S2.M1 | Validar enlace con `drug-treatments` (ya en `dev`) | Se mide por código cuántos fármacos llegan a una monografía | evidencia/22 | HECHO |

## H4 — Documentación y entrega
**CA:** Dado el PR, cuando lo lee alguien que no vio la sesión, entonces sabe qué hay, qué falta y por qué.
**DoD:** archivos en disco + PR abierto + gates.
**Estado:** HECHO para el estado de la pasada 5

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | `SOURCES.md` con licencias verificadas | Cada licencia de fuente usada confirmada en su página, con fecha | lectura de cada página (2026-10-24) | HECHO |
| H4.S1.M2 | Registro de pasadas | Pasadas y descartes escritos | archivo en disco | HECHO |
| H4.S1.M3 | typecheck, lint, build, tests | exit 0 | evidencia/23–27 | HECHO |
| H4.S1.M4 | PR contra `dev` sin mergear | PR abierto | URL del PR | HECHO |
| H4.S1.M5 | PLAN.md + REPORTE.md | En disco | este archivo | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red de la sesión bloquea todas las fuentes | Sin datos: no hay monografías ni saturación | Ocurrió hasta la tarde del 2026-10-24; resuelto para CIMA, RxNav, DailyMed, EMA y eEML |
| Corpus > 512 MB | `readNdjson` falla | `ndjsonLines` (H2.S3.M6) |
| Parsers openFDA/RxNav sin datos reales | Pueden fallar en la primera corrida | Parsers defensivos (vacío ante forma desconocida); agregar fixtures reales en la primera corrida |
| Volumen jsonb (HTML + texto por sección) | Tamaño de la base | Medir en la primera carga real y registrarlo con su tamaño |
