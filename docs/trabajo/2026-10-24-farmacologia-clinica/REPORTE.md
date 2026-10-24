# Reporte — Vademécum de farmacología clínica (monografías por ATC 5)

- Fecha: 2026-10-24 (actualizado 15:40 UTC) · Plan: [PLAN.md](./PLAN.md) · Ramas: `justin/seed-clinical-pharmacology` (PR #679 y #705 ya mergeados en `dev`; esta actualización va en un PR nuevo, sin mergear)
- Peldaño de evidencia alcanzado:
  - `VERIFIED` para la carga del corpus openFDA + GSRS en un Postgres 16 desechable: filas, tamaño, idempotencia y retiro de filas superadas.
  - `TESTED` para el resto.
  - No llega a `REGRESSION_VERIFIED`: CIMA y RxNav siguen bloqueados y no se corrió la suite completa.
- Avance: 20 HECHO / 28 microtareas = **71 %**. Quedan 2 A MEDIAS y 6 BLOQUEADO.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | La monografía por secciones cabe sin DDL | `grep -n -i unique database/SQL/03_terminology/04_indexes.sql` | ningún índice único sobre `concept_properties` |
| H1.S1.M2 | Ramas hermanas comprobadas | `git branch -r \| grep -E "seed-(diseases\|drug-treatments)"` | vacío |
| H2.S1.M1–M3, M5, M6 | Secciones literales; CIMA (fixture real); openFDA, GSRS y streaming con datos REALES | `node --test …/clinical-pharmacology/test/*.test.mjs` | 20/20 |
| H2.S2.M3 | Descarga openFDA | `NODE_USE_ENV_PROXY=1 node fetch-openfda.mjs` | 14/14 particiones, export 2026-10-23, sha256 en meta |
| H2.S2.M4 | Descarga y normalización GSRS | `NODE_USE_ENV_PROXY=1 node fetch-gsrs.mjs` | 167 385 registros leídos (= declarados); 4 730 ATC 5 |
| H2.S3.M1 | Armado | `node --max-old-space-size=8192 build-monographs.mjs` | evidencia/13: 1 033 monografías, 18 853 secciones, 143 s |
| H2.S3.M2 | Carga idempotente a escala | `load-clinical-pharmacology.mjs` ×4 | evidencia/11: 1 696 / 969 / 1 682 / 24 137 / 199 → 0 → reemplazo 18 853 → 0 |
| H2.S3.M3 | Cobertura | `coverage-report.mjs` | evidencia/14 |
| H2.S3.M4 | Validación de enlaces | `validate-links.mjs` | evidencia/12: 199 ATC 5 de `vademecum` con monografía y `concept_map` |
| H2.S3.M5 | Datos normalizados en git | `pack-data.mjs` | `data/`: monografías 20,9 MB gz (1 parte), GSRS 4,7 MB gz, MANIFEST con sha256 |
| H3.S1.M1 | Pasada 0 | build + coverage | universo inicial 483 ATC 5 |
| H3.S1.M3 | Pasada 1: openFDA + GSRS | build + coverage | +1 033 ATC 5 con monografía, +18 853 secciones |
| H4.S1.M2 | Registro de pasadas | — | `docs/seed-research/clinical-pharmacology.md` |
| H4.S1.M3 | Gates sobre el `dev` actual | `yarn typecheck`, `yarn lint`, `node --test` | exit=0, exit=0, verde (ver «Evidencia») |
| H4.S1.M4 | PR | — | PR nuevo contra `dev` (link en la descripción de la sesión) |
| H4.S1.M5 | Plan y reporte | — | este directorio |

## A medias

### H2.S1.M4 — Parsers RxNav
- Qué anda: parsers defensivos (forma desconocida → vacío) y probados con objetos sintéticos.
- Qué no anda: no hay respuestas reales; `rxnav.nlm.nih.gov` sigue en 403.
- Qué falta exactamente: correr `NODE_USE_ENV_PROXY=1 node fetch-rxnorm.mjs --limit-atc 5`, guardar las respuestas como fixture y validar `idtype=ATC`.
- Dónde quedó: `lib/rxnorm.mjs`, `fetch-rxnorm.mjs`.

### H4.S1.M1 — Licencias
- Qué anda:
  - openFDA declara su licencia (`meta.license`) y su aviso (`meta.disclaimer`); el aviso viaja literal en cada sección.
  - La licencia de CIMA está citada desde 2026-09-30.
- Qué no anda: no se pudieron leer las páginas de licencia (`open.fda.gov` y las demás en 403).
- Qué falta exactamente: abrir cada página citada en `SOURCES.md` y marcarla verificada con fecha.
- Dónde quedó: `tools/terminology-import/clinical-pharmacology/SOURCES.md`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M1 `fetch-cima` / H3.S1.M2 pasada CIMA | BLOQUEADO | Habilitar `cima.aemps.es` |
| H2.S2.M2 `fetch-rxnorm` / H3.S1.M5 pasada RxNav | BLOQUEADO | Habilitar `rxnav.nlm.nih.gov`; destraba 26 744 etiquetas ambiguas |
| H3.S1.M4 pasadas 3–6 | BLOQUEADO | `dailymed.nlm.nih.gov`, `www.ema.europa.eu`, `www.minsalud.gob.bo` |
| H3.S2.M1 enlace con ramas hermanas | BLOQUEADO | Que existan `justin/seed-drug-treatments` y `justin/seed-diseases` |

## Evidencia

Salidas literales en [`evidencia/`](./evidencia/):

- 01–10: primera sesión.
- 11: carga completa e idempotencia.
- 12: validación de enlaces.
- 13: armado de la pasada 1.
- 14: cobertura de la pasada 1.

Extractos:

```
# 13-build-pasada-1-openfda-gsrs.txt
"monographs": 1033, "sections": 18853
"scanned": 262901, "humanRxOrOtc": 82884, "withoutUnii": 1522,
"gsrs": { "unique": 21570, "who-atc-50-series": 4267, "ambiguous": 26744, "none": 28778, "unknown-unii": 3 }

# 11-postgres-carga-completa-openfda.txt
1.ª: "concepts": 1696, "designations": 969, "relationships": 1682, "properties": 24137, "vademecumMaps": 199  (9 s)
2.ª: todo 0 (4 s)
aviso agregado: "prunedProperties": 18853, "properties": 18853 ; siguiente: 0 / 0
propiedades openFDA sin aviso: 0
```

## No cubierto

- No hay texto en castellano: CIMA está bloqueada y las secciones de openFDA están en inglés (no se traducen).
- Los niveles ATC 1–4 no tienen nombre: sólo los publica CIMA en castellano, y los de la OMS no se copian.
- El cruce con el catálogo de productos (`medicines-*.ndjson`) no se midió en esta sesión.
- `yarn build`, `yarn test` completo, `yarn docs:validate` y `yarn docs:build` no se corrieron. No hay cambios en `src/`.
- La carga no se hizo contra la base real del stack: sólo contra el DDL del módulo 03 en una base desechable con conceptos internos mínimos.

## Desvíos del plan

- El plan se escribió después del código (ver PLAN.md).
- RxNav seguía bloqueado. Se agregó el GSRS de la FDA (por openFDA) como puente UNII ↔ WHO-ATC, sólo por códigos. No estaba en el plan original; queda como microtareas H2.S1.M6 y H2.S2.M4.
- La regla de referencia de openFDA cambió: ahora se elige Rx antes que OTC **dentro de cada vía**. Antes una Rx intravenosa borraba la única etiqueta oral (OTC) del paracetamol.
- Los ids de las secciones ahora incluyen la huella del valor completo, no sólo del texto. Así un cambio de procedencia (p. ej. el aviso) reemplaza la fila; está medido en evidencia/11.
- PR #705 se mergeó a las 14:12 UTC. Esta pasada va en un PR nuevo, sobre el `dev` actual.

## Riesgos residuales

- **openFDA advierte que sus datos no están validados** («assume all results are unvalidated»). El aviso va en cada sección; quien muestre estas secciones debe mostrarlo.
- **La regla de las series 50/70** se basa en la convención de numeración de la ATC de la OMS, no en una marca por sustancia. En 4 267 etiquetas eligió el código < 50 frente a candidatos ≥ 50. Una sustancia cuyo único código válido fuera ≥ 50 no se enlazaría (queda ambigua, no mal enlazada).
- **La posología (4.2 / `dosage_and_administration`)** es contenido profesional; no debe mostrarse a pacientes.
- **`concept_properties` creció de 71 MB a 146 MB** tras un reemplazo masivo, por las tuplas muertas. Correr `VACUUM` después de recargas grandes.

## Decisiones y ambigüedades

- Concepto por código ATC de los 5 niveles en `clinical-pharmacology`, versión única `1`; la versión real de cada documento va en cada sección.
- Nombre mostrado, en este orden:
  1. el de la LINAME (ES);
  2. si no hay, el de la sustancia en el GSRS (EN), sólo para ATC 5 de un solo principio;
  3. si tampoco, el código.
- Etiquetas ambiguas: no se enlazan. Se cuentan y se listan las más frecuentes en el registro de pasadas.
- Ambigüedades 1–4 del plan siguen abiertas para confirmar con Justin y el propietario.
