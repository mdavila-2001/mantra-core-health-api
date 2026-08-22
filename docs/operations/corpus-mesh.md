# El corpus MeSH: qué es, por qué dejó de cargarse y cómo traerlo de vuelta

**Fecha de la decisión:** 2026-08-15

El entorno de desarrollo arrastraba **1 465 927 filas**. El 98,3 % de ellas eran un
solo paquete: el corpus MeSH que vive en `seedsProd/`. Desde esta fecha **no se carga
por defecto**. Los archivos siguen donde estaban; lo que cambió es que hay que pedirlos.

## Qué son esas filas

| Paquete | Tablas que puebla | Filas | Disco |
|---|---|---:|---:|
| `seedsProd/` — corpus MeSH 2026 «clean v6.1» | `terminology.catalog_concepts` 355 237 · `concept_designations` 996 321 · `concept_relationships` 89 790 · `value_set_rules` 4 | **1 441 367** | **501 MiB** |
| `seedsGenerales/` — los 64 módulos | las ~1 170 tablas de negocio | 24 688 | 23 MiB |

Fuente: `seedsProd/reports/validation-report.json` y `seedsGenerales/seed-manifest.json`.

MeSH (*Medical Subject Headings*) es el vocabulario con el que la Biblioteca Nacional de
Medicina de EE.UU. **indexa bibliografía**. No es vocabulario de historia clínica: no
codifica diagnósticos como CIE-10, ni resultados como LOINC, ni medicamentos como RxNorm.

## Por qué se puede sacar

Se verificó, no se supuso:

- **Nadie lo consulta.** Búsqueda de `MESH`, `MESH_ALL`, `MESH_DESCRIPTORS` y `NLM_MESH`
  sobre `SQL/`, `salud-db/`, los `.puml` del modelo y `src/` de esta API: **cero
  coincidencias** fuera del propio `seedsProd/`.
- **Ninguna FK apunta ahí.** Hay 2 418 columnas `*_concept_id` que referencian
  `terminology.catalog_concepts`, pero todas resuelven contra el **boot del módulo 03 de
  `seedsGenerales`** (los value sets del sistema). Está dicho en el docstring de
  `load_seeds.py` y en `materializacion-fisica-bd.md` del vault.
- **El motor de terminología es agnóstico del contenido.** `CatalogConceptsRepository`
  filtra por versión de sistema de códigos y hace `ILIKE`; no sabe qué corpus hay debajo.
- **Ningún seed de arranque depende de él.** `TerminologySeedService` y
  `GlossarySeedService` cuelgan de su propio sistema de códigos interno (`SEED`).
- **Ningún test, ni el smoke, lo nombran.** Los specs que sí exigen corpus grandes
  (`rxnorm-full`, `loinc`, `icd10cm`, `ndc`, `hcpcs`, `nucc`, `rxterms`) son de **otros**
  datasets, los de `tools/terminology-import/`, y están detrás de
  `TERMINOLOGY_DATASET_TESTS=1`.
- `seedsProd/load-plan.json` ya lo declaraba `"api_startup_load": false`: nunca fue parte
  del arranque, siempre fue un trabajo de despliegue aparte.

## Qué se pierde

Sólo tres cosas, y ninguna funcional:

1. Los 355 237 descriptores MeSH como resultados de `GET /terminology/concepts?query=`.
2. Los cuatro value sets `MESH_*` y sus cuatro reglas intensionales, que hoy no expande nadie.
3. La fila del batch MeSH en `terminology.catalog_import_batches`.

## Qué NO se tocó

Los **~458 000 conceptos de los ETL** de `tools/terminology-import/` —`icd10cm` 74 719,
`loinc` 109 325, `rxnorm_full` 110 177, `ndc` 134 748, `rxterms` 19 356, `hcpcs` 8 725,
`nucc_taxonomy` 883— **se conservan**. Ésos sí son vocabulario clínico y sí tienen pruebas.
Si alguien dice «el millón de filas», conviene aclarar cuál de los dos paquetes.

## Cómo se usa

```bash
# Ciclo limpio del stack, ya sin MeSH (lo que hace ahora por defecto)
python salud-db/rebuild_stack.py --yes

# Trayendo el corpus, como antes
python salud-db/rebuild_stack.py --yes --con-mesh

# Carga suelta, sin reconstruir el stack
python salud-db/load_seeds.py --skip-prod     # sin MeSH
python salud-db/load_seeds.py                 # con MeSH
```

El flag `--skip-prod` de `load_seeds.py` **ya existía**: lo único que se agregó fue el
`--con-mesh` de `rebuild_stack.py`, que antes no tenía forma de propagarlo y llamaba a
`load_seeds.py --refresh` con los flags fijos.

> **Ojo:** `salud-db/` no está bajo control de versiones, así que ese cambio **no viaja en
> ningún PR**. Si tu copia de `rebuild_stack.py` no muestra `--con-mesh` en `--help`, es
> vieja y hay que sincronizarla a mano.

## Lo que esto NO arregla

La búsqueda de conceptos hace `ILIKE '%…%'` sobre `code` y `display`
(`CatalogConceptsRepository.search`). El índice GIN existente es sobre
`to_tsvector('simple', code)` y el de `display` es un btree plano: **ninguno sirve para un
comodín inicial**. Con MeSH o sin él, los ~458 000 conceptos de los ETL dejan esa consulta
en *seq scan*. Arreglarlo pide un índice trigram, y eso pasa por el protocolo de cuatro
capas (`.puml` → `SQL/` → generadores), así que queda fuera de este cambio.
