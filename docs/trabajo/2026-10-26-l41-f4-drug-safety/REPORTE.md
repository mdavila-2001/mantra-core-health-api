# Reporte — TAREA-41 F4: seguridad del fármaco con cita literal

- Fecha: 2026-10-26 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/l41-f4-drug-safety-dev` (sobre `origin/dev`),
  `justin/l41-f4-drug-safety-test` (sobre `origin/test`)
- Peldaño de evidencia alcanzado: **TESTED**. Tests dirigidos en verde sobre fixtures reales. **La carga en base
  (`--load`, `--load --dry-run`) NO se ejecutó**: en este entorno no hay Postgres ni `cima.ndjson`.
- Avance: 11 / 12 microtareas HECHO (91,7 %) al escribir este reporte; H4.S1.M2 (push + PR) EN CURSO.
  F4.4 (LINAME) queda **BLOQUEADO** con evidencia; la carga de interacciones 4.5 queda **BLOQUEADA** (ver Pendiente).

Se continuó el commit WIP `af13a79b` (agente interrumpido, sin verificar), no se reinició. Se verificó todo lo que
afirmaba y se corrigió lo que no se sostenía (ver Desvíos).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Los 7 fixtures son la respuesta literal de CIMA | GET en vivo + comparación | `IDENTICAL` ×7 (evidencia/fuentes.txt) |
| H1.S1.M2 | Aviso legal AEMPS citado literal; sin límite publicado; política 1 petición/≥1 s en `sources.json`, leída por el importador | `curl` aviso legal, `pdftotext` del manual | cita coincide; grep de límites sin coincidencias |
| H1.S2.M1 | 4.6 sólo hacia designaciones fijas de embarazo/lactancia | `node --test` | `ok` «F4.2 4.6: sólo hacia embarazo/lactancia» |
| H1.S2.M2 | 4.3 / 4.5 / 4.8 sobre fichas reales de amoxicilina (62437) y simvastatina (65198) | `node --test` | `ok` ×9 tests F4.2 |
| H1.S2.M3 | «- Ciclosporina:» ya no se toma como cita | `node --test` | `ok` «simvastatina — Está contraindicada…» |
| H1.S3.M1 | Spec F4.5 «Dosis: nunca» (6 tests) | `node --test` | `ok` ×6 tests F4.5 |
| H2.S1.M1 | `lactmedSafety` + lector del corpus (sólo el resumen de LactMed) | `node --test` | `ok` ×4 tests F4.3 |
| H2.S1.M2 | Code system `nlm-lactmed` y lote propio en `--load` | `node --check import-cima.mjs` | `EXIT=0` |
| H2.S1.M3 | Términos NCBI/NLM verificados y registrados | `curl` + `node --test` | citas coinciden; `ok` «LactMed y LINAME registrados» |
| H3.S1.M1 | Búsqueda de LINAME en minsalud.gob.bo registrada | `curl …com_finder…` | sólo 2018-2020; 2022/2024/2025 «No se han encontrado resultados» |
| H4.S1.M1 | Gates | ver Evidencia | todos `EXIT=0` |

## A medias
### H4.S1.M2 — Commits, push y PR
- Qué anda: commits limpios sobre `origin/dev` y `origin/test`.
- Qué no anda: —
- Qué falta exactamente: push de las dos ramas y apertura de los dos PR; los enlaces se agregan a este reporte.
- Dónde quedó: ramas locales `justin/l41-f4-drug-safety-dev` y `justin/l41-f4-drug-safety-test`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| F4.4 LINAME | BLOQUEADO | Que minsalud.gob.bo publique la edición vigente. La única allí es 2018-2020 (vencida). No se reconstruye desde terceros. |
| F4.2 4.5 → `clinical_ext.drug_interactions` | BLOQUEADO | `severity_concept_id` es NOT NULL con FK a `catalog_concepts`, y no existe concepto ni value set de severidad de interacción (ni `UNSPECIFIED`, ni `CONTRAINDICATED`, ni `NOT_RECOMMENDED`). La tabla tampoco tiene columna de cita (`citation_text`/`source_reference`). Hace falta decidir y crear el value set en `src/` (fuera del alcance de este corte). Mientras tanto los pares salen en `out/cima-interactions.csv`. |
| Carga real | NO EJECUTADA | Una base con el glosario cargado y `cima.ndjson` regenerado: `node tools/terminology-import/import-cima.mjs` (vuelve a usar la caché; descarga sólo las secciones nuevas 4.5/4.6 a 1 petición/s), después `--safety --load --dry-run`, revisar `out/cima-safety.summary.json`, y `--safety --load`. |

## Evidencia
```
$ corepack yarn install --immutable
➤ YN0000: · Done in 2s 106ms
EXIT=0

$ node --test tools/terminology-import/test/
# Error: Cannot find module '/home/user/mantra-core-health-api/tools/terminology-import/test'
not ok 1 - tools/terminology-import/test
(Node 22.22.0 no acepta un directorio en --test; se corrió el glob equivalente)

$ node --test 'tools/terminology-import/test/*.test.mjs'
# tests 97
# pass 96
# fail 0
# skipped 1      ← preexistente: «paridad … strengthOf()» # SKIP sin Postgres (DB_* del .env)
EXIT=0

$ node --test 'tools/terminology-import/encyclopedia/**/*.test.mjs' 'tools/terminology-import/clinical-pharmacology/test/*.test.mjs' 'tools/clinical-forms/nnac/*.test.mjs'
# tests 197
# pass 197
# fail 0
(todas las corridas de esta sección: sobre origin/dev 222bf603 con el cambio aplicado)

$ corepack yarn typecheck      → EXIT=0   (cubre src/**/*.ts; no toca los .mjs de este cambio)
$ corepack yarn lint           → EXIT=0   (ídem)

$ node --check tools/terminology-import/import-cima.mjs   → EXIT=0
$ node tools/terminology-import/import-cima.mjs --safety --load --dry-run
ERROR FATAL en import-cima: Error: ENOENT: no such file or directory, open '/home/user/glossary-data-build/ndjson/cima.ndjson'
EXIT=1          ← esperado: no hay datos ni base en este entorno
```

Conteos por sección (fixtures reales + glosario de prueba del test; evidencia/conteos.txt):

| Ficha | 4.3 CONTRAINDICATED_IN | 4.6 PREGNANCY_LACTATION_CAUTION | 4.8 ADVERSE_EFFECT (frecuencia) | 4.5 interacciones (severidad) | Cola (`cima-unmatched.csv`) |
|---|---|---|---|---|---|
| Amoxicilina Normon 500 mg (62437) | 1 | 4 | 12 (FREQUENT 2 · OCCASIONAL 3 · VERY_RARE 5 · sin frecuencia 2) | 6 (NOT_RECOMMENDED 1 · UNSPECIFIED 5) | 47 (4.3: 1 · 4.5: 9 · 4.6: 7 · 4.8: 30) |
| Simvastatina Normon 20 mg (65198, sin 4.6 en el fixture) | 2 | — | 9 (VERY_RARE 7 · sin frecuencia 2) | 16 (CONTRAINDICATED 8 · NOT_RECOMMENDED 1 · UNSPECIFIED 7) | 144 (4.3: 5 · 4.5: 98 · 4.8: 41), 36 por guardia de dosis |

LactMed en el corpus (`clinical-pharmacology/data/monographs.part-*.ndjson.gz`): 1 148 resúmenes «Summary of Use
during Lactation» (1 148 registros, 1 131 ATC 5); 862 sin dosis (citables), 286 con dosis (a la cola). Cuántos se
enlazan a un principio activo del catálogo CIMA depende de `cima.ndjson`, que no está en este entorno.

Fuentes (literal, evidencia/fuentes.txt): aviso legal AEMPS, manual CIMA REST v1.19 sin límite, cabeceras sin
RateLimit-*/Retry-After, políticas NCBI y términos NLM, búsquedas de LINAME en minsalud.gob.bo.

## No cubierto
- `bulkLoadRelationships` con estas filas contra Postgres (ni `--dry-run`): no hay base. El contrato de filas sí está
  probado (sin `ordinal`, `sourceReference` única por evidencia, `validFrom` AAAA-MM-DD, tier `CURATED_REFERENCE`).
- `readDesignations` (consulta SQL del índice del glosario) y `ensureCodeSystem('nlm-lactmed')`: sin base.
- El `BEGIN` previo en `--dry-run` para que la cabecera de la fuente también se deshaga: depende de que Postgres sólo
  avise «there is already a transaction in progress» en el `BEGIN` del lote; no se ejecutó.
- Conteos sobre el catálogo CIMA completo: `cima.ndjson` no está en este entorno.
- Una ficha con 4.6 de simvastatina (el fixture 65198 no la trae).

## Desvíos del plan
- `node --test tools/terminology-import/test/` (el comando pedido) falla en Node 22 por ser un directorio; se usó el
  glob `'tools/terminology-import/test/*.test.mjs'`.
- Correcciones al WIP: (1) `sources.json` decía «comprobado con una petición HEAD el 2026-10-25»; se rehízo con GET
  el 2026-10-26 y se registró eso. (2) LINAME: el WIP registraba sha256, páginas y formato de un PDF de AGEMED que no
  verifiqué; se quitaron y quedó sólo lo comprobado (búsqueda en minsalud.gob.bo y HEAD del PDF de AGEMED, no usado).
  (3) LactMed estaba en PENDING; se implementó F4.3. (4) 4.6 relacionaba el fármaco con cualquier término clínico de
  la oración (p. ej. «diarrea» en el lactante); ahora sólo con embarazo/lactancia. (5) Un subtítulo «- Ciclosporina:»
  salía como interacción citada (H1.S2.M3, no previsto). (6) El test llamaba «enalapril» al fixture 65198, que es
  simvastatina.
- Se agregó `lib/glossary-es/load-plan.mjs` al alcance (sólo la entrada `nlm-lactmed`), declarado en el plan.

## Riesgos residuales
- **Cambio de comportamiento del glosario**: `FICHA_SECTIONS` ya no tiene 4.2; la próxima corrida de
  `import-cima.mjs` deja la posología fuera de `cima.ndjson` (y suma 4.5 y 4.6). Un `cima.ndjson` viejo que tenga
  4.2 hace fallar `--safety` a propósito (`ForbiddenSectionError`): hay que regenerarlo antes.
- El corpus de monografías que lee F4.3 trae la 4.2 de CIMA para uso profesional; el lector la descarta por fuente y
  sección sin leer su texto, pero el `JSON.parse` de la línea la tiene en memoria un instante.
- Coincidencia exacta por palabras: «anemia» casa dentro de «anemia hemolítica» si el glosario no tiene la forma
  larga (gana la designación más larga que exista). Es literal pero puede ser más general que la ficha.
- «Raras» y «muy raras» comparten `VERY_RARE`; la banda literal viaja en `citationLocator`.
- `tools/bolivia-datasets/data/liname-2022-2024.json` (ya en el repo, usado por `clinical-pharmacology`) no se tocó;
  su edición tampoco está en minsalud.gob.bo.

## Decisiones y ambigüedades
1. Interacciones: no se cargan (BLOQUEADO arriba). Supuesto tomado: no inventar conceptos de severidad. Confirmar
   con el dueño de TAREA-41.
2. LactMed con dosis (286/1 148): a la cola, no se cargan. Alternativa a decidir: citar el resumen igual (es texto
   profesional) o partirlo. Confirmar con el dueño.
3. Destino de 4.6 y LactMed: lista fija de designaciones (`PREGNANCY_LACTATION_TERMS`, `LACTATION_TERMS`); si el
   glosario no tiene «lactancia materna»/«lactancia»/«amamantamiento» con un solo concepto, LactMed va entero a la
   cola (`no-lactation-concept`). Confirmar con el dueño qué concepto es el destino.
4. LactMed se enlaza al catálogo por ATC 5 exacto (el corpus ya resolvió UNII → ATC); un ATC compartido por dos
   principios activos va a la cola (`ambiguous-atc`).
5. Evidencia por fuente: CIMA y LactMed van en lotes separados de `bulkLoadRelationships` (cada evidencia lleva la
   fuente que la publica).
