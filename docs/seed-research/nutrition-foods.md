# Nutrición y alimentos — hueco, estado y carga (2026-10-28)

Carril C13 del cierre de huecos de terminología. Importador: `tools/terminology-import/nutrition-foods/` (README, `SOURCES.md` con las licencias leídas).
Evidencia: `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C13/` (el reporte del carril viajó en el mensaje final del implementador: la herramienta rechazó escribir `REPORTE-C13.md`).

## Hueco

El módulo 03 (`terminology.*`) no tenía catálogos de alimentos ni de nutrientes: ni una tabla de composición, ni una ontología de alimentos, ni
los vocabularios de porciones y categorías con los que se registran dieta, alergias alimentarias o planes nutricionales. Lo único que había
eran 20 clases de FoodOn (`allergy-foodon`, el rotulado de alérgenos de la UE) y las filas de Open Food Facts que la tanda 1 de alergias dejó por
precedente (aditivos y alérgenos). Las sesiones del 2026-10-24 no habían bajado nada de esto por el 403 de la red.

## Estado hoy (re-sondeo del 2026-10-28; salida en `evidencia/C13/m1-sondeo-2026-10-28.txt`)

| Fuente | HTTP hoy | Resultado |
|---|---|---|
| USDA FoodData Central: `fdc.nal.usda.gov/fdc-datasets/*.zip` (Foundation 2026-04-30, SR Legacy 2018-04, Survey 2024-10-31, Branded 2026-04-30) | 200 (el host corta ~1 de cada 3 conexiones; con reintento responde) | **cargado**; licencia CC0 leída en `fdc.nal.usda.gov/api-guide/` |
| API de FDC (`api.nal.usda.gov`) | 429 con `DEMO_KEY` | innecesaria: los CSV completos son públicos |
| FoodOn (`foodon.owl`, versión 2026-09-20) | 200 | **cargado** (CC BY 4.0 en el propio archivo) |
| CDNO, FOBI, ONS (OBO) | 200 | **cargados** (CC BY 3.0 / CC BY 4.0 / CC BY 4.0, leídas en archivo y repositorio) |
| Ciqual 2025 en Zenodo (10.5281/zenodo.17550133) | 200 | **cargado** (CC BY 4.0); `ciqual.anses.fr` responde 503 |
| Canadian Nutrient File 2026 en `open.canada.ca` | 200 | **cargado** (Open Government Licence – Canada) |
| LanguaL (`langual.org`) | **455** | no se pudo leer; no se carga (FoodOn trae 52 xrefs a LanguaL, guardados como texto) |
| Open Food Facts | 200 | ODbL: **decisión del propietario**; no se agrega nada nuevo |
| UK CoFID (OGL), AFCD de Australia, FAO/INFOODS, EFSA FoodEx2 | 200 | alcanzables, **sin cargar** (falta leer licencia y escribir lector; ver «Falta») |
| ONE (OBO), FIDEO (OBO) | 200 / sin respuesta | ONE no declara licencia en el archivo ni en el repo; FIDEO está en `gitub.u-bordeaux.fr`, que el proxy no alcanza |
| Fineli, Frida (DTU) | 403 / sin respuesta | no alcanzables |

## Qué se cargó

Corpus versionado en `tools/terminology-import/nutrition-foods/data/` (100 MB, 16 archivos, ninguna parte ≥ 45 MB, `SHA256SUMS`; dos builds
dan los mismos SHA-256). **28 code systems, 2 059 819 conceptos.**

| Fuente | Code systems | Conceptos | Notas |
|---|---|---|---|
| USDA FDC Foundation 2026-04-30 | `usda-fdc-foundation` | 469 | valores de nutrientes con n, mín., máx., mediana; porciones; atributos; NDB |
| USDA FDC SR Legacy 2018-04 | `usda-fdc-sr-legacy` | 7 793 | valores, porciones, NDB |
| USDA FDC Survey (FNDDS) 2024-10-31 | `usda-fdc-survey` | 5 432 | código de alimento FNDDS, categoría WWEIA, porciones |
| USDA FDC Branded 2026-04-30 | `usda-fdc-branded` | 1 999 950 | marca, GTIN/UPC, país de mercado, fechas; sin ingredientes ni nutrientes |
| FDC vocabularios | `usda-fdc-nutrient` 477, `-food-category` 28, `-wweia-category` 172, `-branded-category` 448, `-measure-unit` 123, `-attribute-type` 5, `-fndds-derivation` 49, `-nutrient-derivation` 64, `-nutrient-source` 10 | 1 376 | los nutrientes se unen entre ediciones: 13 diferencias (rank de 7, nombre de 6) quedan en `meta.json` |
| FoodOn 2026-09-20 | `foodon` | 29 255 | 571 obsoletas (`retired`); 28 224 con superclase FoodOn; sinónimos, xrefs, restricciones |
| CDNO 2026-06-10 / FOBI / ONS 2026-02-06 | `cdno` / `fobi` / `ons` | 1 163 / 626 / 336 | nutrición de la dieta, biomarcadores de alimentos, estudios nutricionales |
| Ciqual 2025 | `ciqual-food` 3 484, `-food-group` 161, `-constituent` 74, `-source` 1 977 | 5 696 | nombres EN/FR de la tabla; 257 816 valores de composición |
| Canadian Nutrient File 2026 | `cnf-food` 5 993, `-food-group` 23, `-nutrient` 173, `-food-source` 16, `-nutrient-source` 21, `-measure` 1 494, `-measure-type` 3 | 7 723 | nombres EN/FR del titular; 565 409 valores de nutrientes |
| **Total** | **28** | **2 059 819** | |

Cruces (solo por código exacto): alimento → categoría/grupo en FDC, Ciqual, CNF y Branded; clase → superclase en FoodOn/CDNO/FOBI/ONS;
3 377 de los 4 798 alimentos CNF con `USDA_NDB_Code` coinciden en cadena exacta con un `NDB_number` de FDC Foundation o SR Legacy
(propiedad `fdc_ndb_exact_matches`; 1 421 no están en esos dos conjuntos).

### Antes / después en un Postgres 16 desechable (puerto 55443, DDL de `00_shared` + `03_terminology`)

| | Antes (tras sembrar los 9 conceptos internos) | Después (1.ª corrida) | 2.ª corrida |
|---|---|---|---|
| `terminology_sources` | 1 | 8 | +0 |
| `code_systems` / `code_system_versions` | 1 / 1 | 29 / 29 | +0 |
| `catalog_concepts` | 9 | 2 059 828 | +0 |
| `concept_designations` | 0 | 2 079 692 | +0 |
| `concept_properties` | 0 | 6 351 105 | +0 |
| `concept_relationships` (is-a) | 0 | 2 048 265 | +0 |
| `catalog_import_batches` | 0 | 28 | +0 |

La 1.ª corrida tardó 663 s y la 2.ª 392 s (relee el corpus y no inserta). Las 18 consultas de integridad de `verify-load.sql` (huérfanos, duplicados
por (versión, código), nulos, procedencia sin SHA-256 o sin licencia, relaciones con extremo ausente, versiones por defecto) dieron 0 en las dos corridas.
La base queda en 4,4 GB con índices (`concept_properties` 2,5 GB: la composición por alimento va como JSON); sin Branded (`--no-branded`) son 59 421 conceptos.

No es la base del stack real: `mantra_redesa_health` no se tocó. En la base real, antes de cargar, hay que correr el conteo por `internal_code` del
README de `terminology-import/` para saber qué hay hoy.

## Decisiones del propietario

- **Open Food Facts (ODbL)**: sin cambios. No se agregó ninguna fila ni code system OFF en este carril.
- **Atribución** (CC BY: FoodOn, CDNO, FOBI, ONS, Ciqual; OGL-Canada): cualquier pantalla o API que muestre estos términos debe nombrar la fuente.
- **CDNO**: el `cdno.owl` dice CC BY 3.0 y el LICENSE de su repositorio, CC0 1.0; se registró la más restrictiva.
- **FOBI**: el archivo y el repo dicen CC BY 4.0; OBO Foundry lista CC BY 3.0 (prevalece el archivo).
- **Peso de FDC Branded**: 2 M de conceptos son ~88 MB de los 100 MB versionados y la mayor parte de los 4,4 GB de Postgres. El corte propuesto, si pesa mucho en la base
  real, es cargar con `--no-branded` (queda un corpus de 59 421 conceptos, 12 MB) y dejar Branded como carga bajo demanda.
- **`allergy-foodon` vs `foodon`**: las 20 clases FoodOn de alergias (`FOODON:03510213`, con dos puntos) y las 29 255 de este carril (`FOODON_03510213`, con guion
  bajo, como en la URL de la fuente) son code systems distintos. Se propone un `concept_map` `equivalent` entre los 20 pares con el mismo identificador (misma
  clase, solo cambia la notación); no se escribió porque toca filas de otro carril.
- **Producto**: nada de esto aparece en `/glossary` ni en la búsqueda de conceptos hasta que el propietario decida mostrarlo (ver `RELEVO.md`).

## Falta

- **Red / licencia**: LanguaL (455); FIDEO (host no alcanzable); Fineli y Frida; ONE (sin licencia declarada).
- **Licencia por leer y lector por escribir**: UK CoFID (OGL, xlsx), AFCD de Australia, EFSA FoodEx2, FAO/INFOODS.
- **Alcance deliberadamente recortado**: de FDC Branded no se cargan `ingredients`, porciones ni valores nutricionales (1,5 GB de `food_nutrient.csv`; no son
  terminología); de FDC Foundation, las tablas de laboratorio (`sample_food`, `sub_sample_food`, `acquisition_samples`…); de FoodOn y las demás ontologías, los
  axiomas `equivalentClass` (solo queda la marca `has_equivalent_class_axiom`) y las clases de otras ontologías.
- **Curaduría**: nada se tradujo. Los términos de FDC, FoodOn, CDNO, FOBI y ONS quedan en inglés; Ciqual y CNF traen su francés (propiedad
  `names_other_languages`). Ninguna de las fuentes abiertas leídas publica castellano.
