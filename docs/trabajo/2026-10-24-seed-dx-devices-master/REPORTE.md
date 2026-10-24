# Reporte — Equipos de diagnóstico: consolidación mundial de fabricantes, marcas y modelos

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-dx-devices-master` (mismo commit en `claude/intelligent-heisenberg-0idr17`)
- Peldaño de evidencia alcanzado: `TESTED`. Tests dirigidos en verde, `typecheck` y `lint` en exit 0, `build.mjs` corrido sobre las tres regiones y carga de la taxonomía probada dos veces contra un PostgreSQL 16 desechable. No es `VERIFIED`: la carga no se corrió contra la base de un entorno de la plataforma ni a través de la API.
- Avance: 24 / 25 microtareas `HECHO` = **96 %**. La que falta (H2.S2.M2, grupos y filiales por GLEIF/Wikidata) está `BLOQUEADO`. El hito H5 (saturación) queda `A MEDIAS`: la pasada 5 todavía aportó registros nuevos.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Formato de intercambio común | `git show origin/justin/seed-dx-devices-master:tools/terminology-import/diagnostic-devices/README.md` | existe; las tres regiones lo usan |
| H1.S1.M2 | Validador del formato | `node --test "tools/terminology-import/diagnostic-devices/master/test/*.test.mjs"` | `# pass 19` `# fail 0` |
| H1.S2.M1–M2 | Tabla del 21 CFR y parser del PCD de la FDA | ídem | ídem; 3 122 product codes de diagnóstico de 7 088 |
| H1.S3.M1–M2 | EMDN V2 desde dos copias, con su criterio | ídem; build | `taxonomía EMDN: 8454 términos (… solo en B: V020303)`; 2 492 de diagnóstico |
| H1.S4.M1 | Mapeos publicados | build | 218 mapeos product code↔GMDN de GUDID |
| H2.S1.M1–M3, H2.S2.M1 | Resolución de fabricantes con SRN de EUDAMED | build | 19 941 fabricantes con modelos de diagnóstico; 109 fusiones por SRN |
| H3.S1.M1–M5 | Lector de regiones y consolidación de `us`, `eu` y `row` en streaming | `node --max-old-space-size=10000 tools/terminology-import/diagnostic-devices/master/build.mjs` | `filas válidas 3741111; de diagnóstico 250151 (349 por ser del mismo modelo); fabricantes 19941; modelos 165195` |
| H3.S2.M1–M2 | Modelos y registros del mismo modelo | tests + build | 279 modelos con registro en 2 jurisdicciones y 7 en 3 |
| H3.S3.M1 | Listados del sector | build | 552 menciones de 46 organizaciones; 192 empresas cruzan con un fabricante |
| H4 | Importador de la taxonomía, idempotente | `node tools/terminology-import/diagnostic-devices/master/load-taxonomy.mjs` dos veces | 2.ª corrida en 0 en las pasadas 1 a 5 (`evidencia/load-postgres16-pasada*.txt`) |
| H6.S1.M1 | Propuesta `device_catalog` para el repo del modelo, unida con la de `row` | — | `docs/seed-research/diagnostic-devices-master.md` |
| H6.S1.M2 | typecheck | `corepack yarn typecheck` | `exit 0` (`evidencia/typecheck.txt`) |
| H6.S1.M3 | lint | `corepack yarn lint` | `exit 0` (`evidencia/lint.txt`) |
| H6.S1.M4 | Este reporte | `ls docs/trabajo/2026-10-24-seed-dx-devices-master/REPORTE.md` | existe |
| H6.S1.M5 | PR contra `dev`, sin mergear | — | ver la descripción del PR |

## A medias
### H5 — Saturación con /loop
- Qué anda: cinco pasadas registradas en `docs/seed-research/diagnostic-devices-master.md`, una sección por pasada, con fuentes, nuevos tras deduplicar y descartes. `row` cerró su región (sus pasadas 3 y 4 aportaron 0) y `eu` también.
- Qué no anda: la condición de corte (dos pasadas seguidas en 0) no se cumplió. La pasada 5 sumó 62 636 registros: licencias «Test Kit» de MDALL, LIVD y las fuentes nuevas de `us`.
- Qué falta exactamente: correr `build.mjs` con `git fetch origin` hasta que dos pasadas seguidas no sumen nada. `us` sigue empujando.
- Dónde quedó: `justin/seed-dx-devices-master`; el `/loop` de esta sesión sigue programado.

### H2.S2.M2 — Grupos y filiales publicados
- Qué anda: el resolvedor acepta relaciones padre/hija publicadas (`groupLinks`) y las enlaza sin fusionar (test `grupos solo por relaciones publicadas`).
- Qué no anda: no hay datos. GLEIF y Wikidata dan 403 en el proxy.
- Qué falta exactamente: red hacia `api.gleif.org` y `query.wikidata.org`, o una copia de las relaciones de nivel 2 de GLEIF.
- Dónde quedó: `lib/manufacturers.mjs`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M2 | BLOQUEADO | Red a GLEIF o Wikidata (403 del proxy) |
| H5 | A MEDIAS | Dos pasadas seguidas en 0 |
| Tablas `device_catalog` | TODO (otro repo) | Que el repo del modelo acepte la propuesta; después, un importador desde `out/models-*.ndjson.gz` |

## Evidencia
```
$ node --test "tools/terminology-import/diagnostic-devices/master/test/*.test.mjs"
# tests 19
# pass 19
# fail 0

$ corepack yarn typecheck        → exit 0
$ corepack yarn lint             → exit 0

$ node --max-old-space-size=10000 tools/terminology-import/diagnostic-devices/master/build.mjs
región us: 204096 filas desde origin/justin/seed-dx-devices-us (0 archivos con sha256 distinto, descartados)
región eu: 716 filas desde origin/claude/adoring-curie-xdkt83 (0 archivos con sha256 distinto, descartados)
región row: 3534775 filas desde origin/claude/inspiring-planck-xhpf4w (0 archivos con sha256 distinto, descartados)
identidades de fabricantes publicadas (actores): 26583
filas válidas 3741111; de diagnóstico 250151 (349 por ser del mismo modelo); fabricantes 19941; modelos 165195; nodos heredados por mapeo 79
real 5m44s

$ node …/load-taxonomy.mjs   (2.ª corrida, pasada 5)
"concepts": 0 … "maps": 0, "valueSetMembers": 0
```
Salidas completas en `evidencia/`.

## No cubierto
- La carga de la taxonomía no se corrió contra la base de un entorno de la plataforma (dev/test), solo contra un PostgreSQL 16 desechable. Ese Postgres se armó con el DDL de `database/SQL/00_*` y `03_terminology`, más los conceptos internos sembrados a mano. Tampoco se probó que la API lea esos conceptos como `equipment_type_concept_id`.
- Ninguna copia en git se comparó contra el archivo oficial: los portales dan 403. La EMDN se verificó entre dos copias independientes; el resto se apoya en cabeceras idénticas a las oficiales y en el commit y sha256 fijados.
- El build se corrió sobre el estado de las ramas hermanas en el momento indicado. Un push nuevo de una hermana cambia `out/`.
- La lista de asociaciones y ferias (`data/industry-directories.json`) viene de fragmentos de resultados de búsqueda, no de las páginas abiertas.

## Desvíos del plan
- **El plan se escribió tarde.** `AGENTS.md` no se leyó al empezar: se buscó solo `CLAUDE.md` y `.claude/rules/`, que no existen. `PLAN.md` se escribió en la pasada 2 y la evidencia se movió a `evidencia/` (antes estaba en `master/evidence/`).
- **Rama doble.** El entorno exige `claude/intelligent-heisenberg-0idr17` y el brief pide `justin/seed-dx-devices-master`; se empuja el mismo commit a las dos y el PR sale de la segunda.
- **Formato común corregido a mitad de camino.** Pedía código de tipo siempre y por eso rechazaba 1,16 M filas legítimas de ANVISA y PMDA, que publican el tipo solo por nombre. Ahora alcanza con nombre o código.
- **Búsqueda fuera de alcance.** Un agente auxiliar usó la búsqueda de código de GitHub fuera del repo de esta sesión. No se repitió; los repos encontrados son públicos y se bajaron con `git clone`.
- **Instalación local.** Se instaló `xlsx@0.18.5` desde npm porque `cdn.sheetjs.com` y `repo.yarnpkg.com` dan 403. `package.json` y `yarn.lock` no cambiaron.
- **Postgres en `/tmp/pgdx`.** Estuvo ahí y no en el scratchpad, porque el servidor necesita una ruta legible por el usuario `postgres`.

## Riesgos residuales
- **Datos viejos de terceros.** MDALL es de 2020-02, ANVISA-modelos de 2020-12, GUDID solo el subconjunto dental de 2025-05, y el PCD de la FDA es de 2026-08. Faltan registros posteriores.
- **Fusiones por nombre.** La regla `same-name-no-country` (1 003 fusiones) es la más débil. Los casos dudosos van a `review-manufacturers.ndjson.gz` sin fusionar, pero esa regla sí fusiona.
- **Criterio de Health Canada.** «Test Kit = IVDD» se apoya en la guía de Health Canada, no en el texto de SOR/98-282, que no se pudo verificar.
- **Agrupación de modelos.** Exige marca y modelo verbatim, o la misma UDI-DI. Subestima los modelos con registro en varias jurisdicciones: no se intentó ningún parecido difuso.
- **Volumen.** `out/` pesa unos 20 MB comprimido, en archivos de menos de 50 MB, y crece con cada pasada.

## Decisiones y ambigüedades
- **«Diagnóstico» solo por criterios publicados**, todos citados en el código:
  - Subpartes «Diagnostic/Monitoring Devices» del 21 CFR y partes IVD 862/864/866 (809.3).
  - Categoría W de la EMDN y títulos de grupo EMDN que declaran solo diagnóstico o monitoreo.
  - Clases de riesgo exclusivas de IVD (IVDR, IVDD y las «Class N - IVD» de la TGA).
  - Alcance publicado de la fuente (LIVD de los CDC) y licencia «Test Kit» de Health Canada.
  - Registro del mismo modelo (fabricante + marca + modelo, o UDI-DI).

  Lo que no se puede decidir queda `null`, fuera del catálogo (3 488 336 filas): MDALL sin tipo, nombres técnicos de ANVISA, JMDN sin 類別, nombres de CDSCO. A confirmar con Justin si quiere otro criterio.
- **Sin mapeos inventados.** No existe un mapeo EMDN↔GMDN oficial y no se usó ninguno. Los mapeos automáticos de GitHub se descartaron.
- **GMDN.** Solo lo que GUDID publica por dispositivo. La lista compilada de 12 275 términos se descartó: su autor la retiró por la licencia de la GMDN Agency.
- **Sin DDL** (ADR-0021). Fabricantes, marcas, modelos y registros quedan en `out/` con la propuesta de tablas para el repo del modelo.
