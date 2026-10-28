# Reporte C9 — glosario en castellano + enciclopedia

- Fecha: 2026-10-28 · Plan: [PLAN.md](../../PLAN.md) · Rama: claude/adoring-heisenberg-1rl29k
- Peldaño: importadores y tests = TESTED (167/167, 24); carga en Postgres desechable = VERIFIED a 28 617 términos (13-16); carga completa de 183 162 = RUNS (primera corrida sin integridad ni 2.ª corrida). Nada llegó a REGRESSION_VERIFIED.
- Avance: 5/7 microtareas HECHO (ver abajo).

## Completado
| ID | Qué | Evidencia |
|---|---|---|
| M1 re-sondeo | 20 hosts re-sondeados hoy | 23 |
| M2 parsers + tests | `node --test` 167 pass / 0 fail (glossary-es, glossary-nci, encyclopedia s1-s4) | 24 |
| M4a carga base | 1.ª corrida 12 code systems; 2.ª corrida = 0 filas nuevas | 13, 14 |
| M4b integridad (28 617) | 0 huérfanos, 0 duplicados (code, slug), 0 nulos de display/definición/procedencia, 0 relaciones con extremo inexistente | 15 |
| M5 auditoría | cobertura antes/después, licencias leídas hoy, huecos con motivo | `docs/seed-research/glossary-es.md`, 25 |

## A medias
### Carga completa (CIE-10-ES 181 079 términos)
- Qué anda: diagnósticos 102 131 y procedimientos 78 948 cargan por separado (18); 183 162 visibles en `glossary-all-terms` (19).
- Qué no anda: una sola corrida `--apply` con todas las capas se queda sin heap a 2 500 MB (18-load-full-apply.txt, FATAL OOM). Sin 2.ª corrida ni integridad a esta escala; la base completa pesó 917 MB.
- Qué falta: reintentar la 2.ª corrida por capa y correr 15-integridad.sql sobre la base completa; partir el cargador o cargar por capas.
- Dónde quedó: scripts en el repo; la base y el corpus crudo ya no existen (scratchpad de otra sesión, base de `/var/tmp` ausente).

### Corpus versionado en data/
- Los importadores escriben a `GLOSSARY_BUILD_DIR` y no hay `data/` con SHA256SUMS para el glosario. No se versionó. Los hashes de las fuentes sí están (01, 02, 07, 21).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Re-correr imágenes Commons | BLOQUEADO hoy | Commons 429 (Retry-After 5 s) |
| LOINC-ES, DeCS, INLASA | BLOQUEADO | licencia/cuenta (403), propietario |

## No cubierto
- Ninguna carga ni importador se ejecutó de nuevo hoy; las cifras vienen de la evidencia 01-22 de la corrida anterior.
- No se levantó la API: la visibilidad en `/glossary` se midió con SQL que reproduce `searchGlossaryPage` (16), no por HTTP.
- No se auditó la licencia de cada imagen de Commons (corpus ausente).
- Conteo "antes" ambiguo: 64 (brief) / 69 (comentario en `build-glossary-shards.mjs`) / 80 entradas con slug.

## Propuesta de producto (no aplicada; decisión del propietario)
Lectura del código: `ConceptsService.searchConcepts` → `searchGlossaryPage` ya filtra solo por pertenencia al value set vigente, `included = true` y estado activo (`catalog-concepts.repository.ts:310`), con paginado en SQL. No hay un tope a 64 en la consulta: el límite es de datos (solo los curados son miembros). Entonces cargar a la base real ya los muestra; no hace falta cambiar `searchConcepts`.
Riesgos a decidir antes de cargar: (1) CIE-10-ES son 181 079 filas de clasificación sin definición ni imagen (0/102 131, 10); podrían ir solo a las categorías y no al paraguas `glossary-all-terms`, o filtrarse a "con definición". Diff candidato en `searchGlossaryPage`, sin probar: agregar la condición `EXISTS (SELECT 1 FROM terminology.concept_properties p WHERE p.concept_id = c.id AND p.property_code = 'glossary-clinical-definition')` cuando se pida `onlyDefined`. (2) El endpoint de grafo usa `searchConcepts` con límite por defecto 500; con 183 k términos queda truncado (ya marca `possiblyTruncated`). (3) Orden alfabético y conteo de facets sobre 183 k filas: medir con `EXPLAIN` en la base completa.

## Decisiones del propietario
Imágenes CC BY-SA/GFDL/ODbL de Commons; autoría de fichas técnicas CIMA; qué value sets entran al paraguas; peso (917 MB); LOINC-ES/DeCS/INLASA.
