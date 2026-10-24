# Reporte — Procedimientos y tratamientos no farmacológicos: fase 2 y pasadas con la red abierta

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/seed-procedures-treatments` (reiniciada desde `dev` tras el merge de #689; #721 mergeó hasta la pasada 6 y las pasadas 7+ van en un PR nuevo, con la rama rebasada sobre `dev`)
- Peldaño de evidencia alcanzado: `TESTED` en el importador (20 tests dirigidos en verde, build determinista) y carga verificada en PostgreSQL 16 desechable con idempotencia medida. No `VERIFIED` de punta a punta: el modelo vigente no puede guardar la procedencia de las relaciones (las relaciones solo se cargaron en la base con la tabla propuesta).
- Avance: 13 / 17 microtareas HECHO (76,5 %). Estado vivo: se reescribe en cada pasada.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H5.S1.M1 | Claves de las hermanas desde sus `data/` en git | `cut -f1 keys.tsv \| sort \| uniq -c` | mondo 27 695, mesh 9 320, orphanet 11 645, uberon 13 412, fma 100 077, … |
| H5.S1.M2 | Fase 2 sobre el corpus de la fase 1 | `validate-siblings.mjs --keys` | enfermedad 250/250; sitio 439/453 (424 por xref Uberon) |
| H5.S1.M3 | Fase 2 sobre el corpus final (pasada 6) | ídem | enfermedad 33 428/42 453 (78,7 %); sitio 79 624/79 638 |
| H6.S1.M1 | Rama reiniciada desde `dev` | `git log --oneline origin/dev..HEAD` | solo commits nuevos |
| H6.S1.M2 | MeSH 2026 clasificado por árbol | `node --test …` | 31 110 descriptores; exclusión farmacológica por subárbol |
| H6.S1.M3 | ClinicalTrials.gov → «en estudio» | `fetch-ctgov.mjs` + `build.mjs` | 464 253 estudios intervencionales → 34 083 relaciones con todos los NCT (cifra tras H6.S2.M1) |
| H6.S2.M1 | Clasificación MeSH depurada | `node --test …` | 19/19; E05 y conceptos de tiempo/estrategia fuera |
| H6.S2.M2 | Pasada 6: Cochrane (MEDLINE) | `fetch-pubmed.mjs --subset cochrane` (3 particiones por fecha, 17 554/17 554) + `build.mjs` | +171 procedimientos, +8 075 relaciones (5 610 pares nuevos) |
| H6.S2.M4 | Pasada 7: guías de práctica clínica (MEDLINE) | `fetch-pubmed.mjs --subset guidelines` (47 particiones por fecha de alta, 42 934 artículos de revista de 44 031; los 1 097 restantes son libros de Bookshelf) + `build.mjs` | +240 procedimientos, +25 469 relaciones (19 404 pares nuevos) |
| H5.S1.M3 (pasada 7) | Fase 2 sobre el corpus de la pasada 7 | `validate-siblings.mjs --keys` | enfermedad 52 913/67 922 (77,9 %; 754 MeSH de condición sin concepto); sitio 79 624/79 638 |
| H6.S1.M4 | ICD-10-PCS → parte del cuerpo por definición | `build.mjs` | 79 256 códigos declarados = expandidos = válidos en el archivo de orden; 79 169 relaciones (87 de eje «Qualifier» fuera) |
| H6.S1.M5 | NCIt oficial 26.09d | `build.mjs` | 450 roles (vs 438 de la OBO Edition), 16 relaciones nuevas, 0 R180 |
| H6.S1.M7 | Cargador con los code systems nuevos | `load.mjs --apply` ×2 en dos bases (corpus de la pasada 6) | DDL canónico: 84 414 conceptos + 590 802 propiedades, 2.ª corrida 0. Con tabla propuesta + claves reales de las hermanas: 113 052 relaciones + 113 095 procedencias, 2.ª corrida 0 |
| H6.S1.M9 | PR contra `dev`, listo para revisión, sin mergear | `mcp__github__create_pull_request` | https://github.com/mdavila-2001/mantra-core-health-api/pull/721 |
| Gate | `corepack yarn lint` | `NODE_OPTIONS=--max-old-space-size=8192` | exit 0 |
| Gate | tests dirigidos | `node --test tools/terminology-import/procedures-treatments/test/*.test.mjs` | 20/20 |
| Gate | determinismo | `build.mjs` ×2 + `sha256sum -c`; `snapshot.mjs` ×2 | idéntico |

## A medias
### H6.S2.M3 — Saturación con la red abierta
- Qué anda: pasadas 5 (fuentes grandes), 6 (Cochrane) y 7 (guías de práctica clínica) registradas y respaldadas; ICHI, ICD-11, NNAC, CUPS, NICE, CIE-10-ES y MRCOC evaluadas con motivo.
- Qué no anda: todavía no hay dos pasadas seguidas con 0 desde que se abrió la red.
- Qué falta exactamente: pasada 8 (ensayos controlados aleatorizados publicados en MEDLINE, descarga en curso: 673 366 registros) y pasadas con registros de ensayos fuera de ClinicalTrials.gov, hasta dos con 0.
- Dónde quedó: tabla de pasadas de `docs/seed-research/procedures-treatments.md`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H6.S1.M8 | BLOQUEADO (typecheck) | `corepack yarn typecheck` falla en `dev` por 4 errores TS2300 en `src/modules/insurance/insurance-patient-settlement.module.ts` (import duplicado tras el merge de #717). Este PR no toca `src/`. |
| Relaciones en la base | BLOQUEADO | Que el modelo adopte la tabla de procedencia (propuesta en la bitácora) |

## Evidencia
```
validate-siblings.mjs --keys (corpus de la pasada 7)
procedure-disease: relationships 67922 · resolved 52913 · unresolved 15009 · objectsWithoutConcept 754
procedure-site:    relationships 79638 · resolved 79624 · viaPublishedSiteMap 440 · unresolved 14

validate-siblings.mjs --keys (corpus de la pasada 6)
procedure-disease: relationships 42453 · resolved 33428 · unresolved 9025 · objectsWithoutConcept 700
procedure-site:    relationships 79638 · resolved 79624 · viaPublishedSiteMap 440 · unresolved 14

load.mjs --apply, base con tabla propuesta y claves de las hermanas
1.ª: concepts 84414 · properties 590802 · relationships 113052 · provenance 113095 · unresolved 9039
2.ª: concepts 0 · properties 0 · relationships 0 · provenance 0
```

## No cubierto
- La base desechable usó las **claves** de las hermanas (códigos reales de sus `data/`), no sus importadores completos.
- `node_modules` se instaló con `xlsx@0.18.5` del registro npm (el tarball de `cdn.sheetjs.com` fijado en `yarn.lock` no estaba accesible al instalar); `package.json` y `yarn.lock` no se tocaron.

## Desvíos del plan
- La clasificación MeSH de la pasada 5 contaba métodos de investigación (E05) y conceptos de tiempo/estrategia como procedimientos; se depuró en la pasada 6 y las cifras de la 5 quedaron corregidas (ClinicalTrials.gov: 41 094 → 34 083).
- Pasada 8: el primer intento de descarga de ensayos aleatorizados lo frenó el chequeo de suma de particiones (435 206 contra 673 366): los tramos mensuales terminaban en el día 31 y PubMed responde 0 («No items found») a una fecha inexistente como `2015/04/31`. Se corrigió con el último día real del mes; el chequeo cumplió su función.
- Pasada 7: `fetch-pubmed-cochrane.mjs` se generalizó a `fetch-pubmed.mjs --subset <cochrane|guidelines|rct>`; las particiones pasaron de `[PDAT]` (se solapaban: 47 122 contra 44 031) a `[EDAT]` (fecha de alta, única por registro), y bajan a mes y día cuando un año supera 10 000.
- Cochrane entra por MEDLINE (indexación MeSH de NLM) porque el sitio de Cochrane responde 403; solo metadatos, sin texto de las revisiones.
- Wikidata P924 se agregó como fuente **colaborativa** (no oficial) con un tipo propio (`collaborative-referenced`) y solo con referencia real; la propuesta para el modelo suma esa clase de afirmación.
- ClinicalTrials.gov: las páginas crudas (~70 MB, cambian a diario) no se suben; se sube el extracto exacto que usa el normalizador (`data/raw/ctgov/`).

## Riesgos residuales
- ClinicalTrials.gov relaciona intervención y condición **del mismo estudio**, no de la misma intervención: un estudio con varias intervenciones produce pares con cada una. El tipo lo dice («registrados juntos») y nunca es «indicado».
- 754 MeSH de condición quedan sin concepto hasta que `seed-diseases` (o la sesión de síntomas) los cargue.

## Decisiones y ambigüedades
- ICD-10-PCS y MeSH de procedimiento se crean desde esta sesión (nadie los cargó), resolviendo por `internal_code`. A confirmar con Justin.
- Dos propuestas de procedencia (esta y la de `seed-drug-treatments`) documentadas juntas para que elija el repo del modelo.
