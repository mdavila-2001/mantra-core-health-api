# Reporte — Procedimientos y tratamientos no farmacológicos: fase 2 y pasadas con la red abierta

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/seed-procedures-treatments` (reiniciada desde `dev` tras el merge de #689)
- Peldaño de evidencia alcanzado: `TESTED` en el importador (17 tests dirigidos en verde, build determinista) y carga verificada en PostgreSQL 16 desechable con idempotencia medida. No `VERIFIED` de punta a punta: el modelo vigente no puede guardar la procedencia de las relaciones (las relaciones solo se cargaron en la base con la tabla propuesta).
- Avance: 9 / 12 microtareas HECHO (75,0 %). Estado vivo: se reescribe en cada pasada.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H5.S1.M1 | Claves de las hermanas desde sus `data/` en git | `cut -f1 keys.tsv \| sort \| uniq -c` | mondo 27 695, mesh 9 320, orphanet 11 645, uberon 13 412, fma 100 077, … |
| H5.S1.M2 | Fase 2 sobre el corpus de la fase 1 | `validate-siblings.mjs --keys` | enfermedad 250/250; sitio 439/453 (424 por xref Uberon) |
| H5.S1.M3 | Fase 2 sobre el corpus final | ídem | enfermedad 33 274/41 389 (80,4 %); sitio 79 624/79 638 |
| H6.S1.M1 | Rama reiniciada desde `dev` | `git log --oneline origin/dev..HEAD` | solo commits nuevos |
| H6.S1.M2 | MeSH 2026 clasificado por árbol | `node --test …` | 31 110 descriptores; exclusión farmacológica por subárbol |
| H6.S1.M3 | ClinicalTrials.gov → «en estudio» | `fetch-ctgov.mjs` + `build.mjs` | 464 253 estudios intervencionales → 41 094 relaciones con todos los NCT |
| H6.S1.M4 | ICD-10-PCS → parte del cuerpo por definición | `build.mjs` | 79 256 códigos declarados = expandidos = válidos en el archivo de orden; 79 169 relaciones (87 de eje «Qualifier» fuera) |
| H6.S1.M5 | NCIt oficial 26.09d | `build.mjs` | 450 roles (vs 438 de la OBO Edition), 16 relaciones nuevas, 0 R180 |
| H6.S1.M7 | Cargador con los code systems nuevos | `load.mjs --apply` ×2 en dos bases | DDL canónico: 84 500 conceptos + 591 408 propiedades, 2.ª corrida 0. Con tabla propuesta + claves reales de las hermanas: 112 898 relaciones + 112 941 procedencias, 2.ª corrida 0 |
| Gate | `corepack yarn lint` | `NODE_OPTIONS=--max-old-space-size=8192` | exit 0 |
| Gate | tests dirigidos | `node --test tools/terminology-import/procedures-treatments/test/*.test.mjs` | 17/17 |
| Gate | determinismo | `build.mjs` ×2 + `sha256sum -c`; `snapshot.mjs` ×2 | idéntico |

## A medias
### H6.S1.M6 — Fuentes restantes
- Qué anda: evaluadas ICHI e ICD-11 (exigen cuenta), Cochrane (403), NNAC (no responde), CUPS, NICE y CIE-10-ES (sin aporte por código).
- Qué no anda: falta la pasada 6 con fuentes independientes nuevas (p. ej. coocurrencias MEDLINE de NLM, Europe PMC para huecos) y la 7 si la 6 aporta.
- Qué falta exactamente: dos pasadas seguidas con 0 tras la apertura de la red.
- Dónde quedó: tabla de pasadas de `docs/seed-research/procedures-treatments.md`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H6.S1.M8 | BLOQUEADO (typecheck) | `corepack yarn typecheck` falla en `dev` por 4 errores TS2300 en `src/modules/insurance/insurance-patient-settlement.module.ts` (import duplicado tras el merge de #717). Este PR no toca `src/`. |
| H6.S1.M9 | TODO | Abrir el PR tras el push de esta pasada |
| Relaciones en la base | BLOQUEADO | Que el modelo adopte la tabla de procedencia (propuesta en la bitácora) |

## Evidencia
```
validate-siblings.mjs --keys (corpus final)
procedure-disease: relationships 41389 · resolved 33274 · unresolved 8115 · objectsWithoutConcept 701
procedure-site:    relationships 79638 · resolved 79624 · viaPublishedSiteMap 440 · unresolved 14

load.mjs --apply, base con tabla propuesta y claves de las hermanas
1.ª: concepts 84500 · properties 591408 · relationships 112898 · provenance 112941 · unresolved 8129
2.ª: concepts 0 · properties 0 · relationships 0 · provenance 0
```

## No cubierto
- La base desechable usó las **claves** de las hermanas (códigos reales de sus `data/`), no sus importadores completos.
- `node_modules` se instaló con `xlsx@0.18.5` del registro npm (el tarball de `cdn.sheetjs.com` fijado en `yarn.lock` no estaba accesible al instalar); `package.json` y `yarn.lock` no se tocaron.

## Desvíos del plan
- Wikidata P924 se agregó como fuente **colaborativa** (no oficial) con un tipo propio (`collaborative-referenced`) y solo con referencia real; la propuesta para el modelo suma esa clase de afirmación.
- ClinicalTrials.gov: las páginas crudas (~70 MB, cambian a diario) no se suben; se sube el extracto exacto que usa el normalizador (`data/raw/ctgov/`).

## Riesgos residuales
- ClinicalTrials.gov relaciona intervención y condición **del mismo estudio**, no de la misma intervención: un estudio con varias intervenciones produce pares con cada una. El tipo lo dice («registrados juntos») y nunca es «indicado».
- 701 MeSH de condición quedan sin concepto hasta que `seed-diseases` (o la sesión de síntomas) los cargue.

## Decisiones y ambigüedades
- ICD-10-PCS y MeSH de procedimiento se crean desde esta sesión (nadie los cargó), resolviendo por `internal_code`. A confirmar con Justin.
- Dos propuestas de procedencia (esta y la de `seed-drug-treatments`) documentadas juntas para que elija el repo del modelo.
