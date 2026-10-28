# Reporte — C4 alergias (cierre de huecos de terminología)

- Fecha: 2026-10-28 · Plan: [PLAN.md](../../PLAN.md) · Rama: `claude/adoring-heisenberg-1rl29k`
- Peldaño de evidencia alcanzado: **VERIFIED contra Postgres 16 desechable** (carga + 2.ª corrida idempotente + integridad); **no** contra la base real del stack. Importador y parsers: TESTED. No es `REGRESSION_VERIFIED` (no hay revisión independiente).
- Avance: 5 / 5 microtareas C4 (M1-M5) con DoD ejecutado hoy = 100 % (5/5); la base (tanda 1) no se reconstruyó desde crudos (ver No cubierto).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.C4.M1 | Re-sondeo de 43 URLs | `curl` por URL, [m1-sondeo-2026-10-28.txt](m1-sondeo-2026-10-28.txt) | allergen.org, UniProt, openFDA, GSRS, RxNav, ChEBI FTP, EVS, CDC cvx.txt, DailyMed: 200/30x. Siguen mal: `query.wikidata.org/` raíz 000, `rxclass/version.json` 404, `id.who.int` 404, `codexalimentarius.org` 000, `eur-lex` 202 (se usó Cellar) |
| H1.C4.M2 | Revalidar WIP: tests, gzip, SHA | [m2-revalidacion-2026-10-28.txt](m2-revalidacion-2026-10-28.txt) | `node --test`: 34 pass / 0 fail; `gzip -t` ok x2; `sha256sum -c` OK x6; descomprimido base `d0124219…c0da8ee`, tanda 2 `7bc14ed6…1322416` |
| H1.C4.M3 | Re-descarga completa y 2 builds | [m3b-build-reproducible-2026-10-28.txt](m3b-build-reproducible-2026-10-28.txt) | mismo SHA-256 en ambos builds; 17 975 conceptos nuevos y 30 070 parches, igual que el 2026-10-27 (saturación: 0 nuevos); `data/` actualizado (1 parte de 2,6 MB, total versionado 7 MB) |
| H1.C4.M4 | Carga en Postgres 16 (`/var/tmp/pg-c4`, puerto 55434), 2.ª corrida | `load-allergy-catalog.mjs --from-repo --base-only`, luego completo, luego completo; [m4b-carga-0..2](m4b-carga-1-tanda2.txt) | base 55 503 → total **73 478** conceptos; tanda 2: +17 975 conceptos, 24 941 designaciones, 160 983 propiedades, 2 291 relaciones, 35 673 miembros, 5 732 designaciones y 57 673 propiedades de parche; **2.ª corrida: 0 en todo**. Integridad ([m4b-integridad-salida.txt](m4b-integridad-salida.txt)): 0 duplicados (code system, código), 0 vacíos, 0 sin procedencia, 0 huérfanos, 0 duplicados de propiedad/relación/miembro. 23 code systems, 27 value sets. Postgres detenido y borrado |
| H1.C4.M5 | `SOURCES.md` (tanda 2: 16 fuentes con licencia y evidencia) y `docs/seed-research/allergies.md` (antes/después, pasadas 21-38, huecos con motivo de hoy) | `git diff` | 55 503 → 73 478 conceptos; 12 → 23 code systems; 16 → 27 value sets |

## A medias
Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| ICD-11 (4A8x) | BLOQUEADO | API con cuenta/token (no se crean) y licencia CC BY-ND: decisión del propietario |
| AllergenOnline, Allergome, COMPARE | BLOQUEADO | licencia no abierta/verificable ([sondeo](m1b-licencias-no-cargadas-2026-10-28.txt)): permiso de los titulares |
| Codex Alimentarius | BLOQUEADO | `codexalimentarius.org` sin respuesta (000) |
| SNOMED CT, MedDRA, DeCS, ATC/DDD, DrugBank, KEGG | DESCARTADO | licencia |

## Evidencia
Ver los archivos enlazados arriba (todos en este directorio). Los `m3-build-*`, `m4-carga-*` y `m1-sondeo-2026-10-27` anteriores son del WIP del 2026-10-27 y quedan como histórico; el SHA `2d8e13ab…` de `m3-build-*` está **vencido** (lo reemplaza `7bc14ed6…`).

## No cubierto
- La base (tanda 1, `allergy-catalog.ndjson.gz`) no se reconstruyó desde los ~1 GB de crudos npm/GitHub: sólo se verificó su integridad (`gzip -t`, SHA-256 `d0124219…`). Su builder tiene tests pero no se repitió el build completo hoy.
- Los 20 `concept_maps` de enumeraciones internas no se cargaron: la base desechable no tiene los conceptos que siembra la API (`conceptMapsSkipped: 20`).
- No se cargó en la base real del stack ni se ejercitó la API/`/glossary`; el rendimiento de `searchConcepts` con 53 819 sustancias sigue siendo el riesgo ya anotado.
- Las cadenas del SPL de DailyMed (2 286 NDC → UNII) y GSRS: sólo se verificó la salida (505 UNII), no se auditó muestra por muestra contra la fuente.
- Sin revisión independiente.

## Desvíos del plan
- `npm install --no-save` para tener `pg`/`dotenv` instaló sin querer **todo el árbol** en `/home/user/mantra-core-health-api/node_modules` (626 MB, ignorado por git; no versionado). Efecto lateral fuera de mis rutas: borrarlo con `rm -rf node_modules` si estorba o dejarlo para los otros carriles que lo necesiten.

## Riesgos residuales
- Licencias a confirmar: ChEBI (LICENSE CC BY 4.0 vs README CC BY-SA 4.0), NCIt (CC BY 4.0 sólo por OBO Foundry), WHO/IUIS (descarga libre con cita, sin licencia formal), MeSH (cita obligatoria). Toda pantalla que los muestre debe citar la fuente (`allergy_provenance` por concepto).
- Open Food Facts (ODbL) sigue con su condición de la tanda 1.
- 73 478 conceptos y ~600 000 propiedades: peso de la carga real a validar.

## Decisiones y ambigüedades
1. ChEBI y NCIt, según arriba: supuesto = se cargan con atribución; confirmar con el propietario.
2. MED-RT (`allergy-medrt-classes`, 11 947) convive con NDF-RT 2018 (`allergy-ndfrt-drug-classes`, 12 994) como dos code systems; no se fusionan porque RxClass no declara la equivalencia por código en lo descargado. El propietario decide si NDF-RT se retira.
3. Castellano sólo donde la fuente lo publica; el resto conserva el inglés declarado.
4. Propuesta (sin DDL): exponer `allergy_provenance` y `source_license` en el endpoint de conceptos; resolver `searchConcepts` con `JOIN`/`EXISTS` en vez de `IN`.
