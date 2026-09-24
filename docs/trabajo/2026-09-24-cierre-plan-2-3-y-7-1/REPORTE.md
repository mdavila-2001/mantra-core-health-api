# Reporte — Cierre de las subtareas 2.3 y 7.1 del plan de reparto

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/cierre-plan-2-3-y-7-1` (base `dev` en `7541797c`)
- Peldaño de evidencia alcanzado: `TESTED` (unitarios dirigidos + suite de los módulos tocados), con el SQL nuevo y el cerrojo **ejercidos contra el Postgres de desarrollo** (`mantra-redesa-postgres-1`, en solo lectura). No se levantó la API ni se llamó al endpoint por HTTP.
- Avance: 6 / 6 microtareas HECHO (100 %)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | `PublicTerritoryFilterService`: valida `department` (`VS_BO_DEPARTMENT`) y `municipality` (`VS_BO_MUNICIPALITY`); municipio de otro departamento → 422 | `jest … -t "subtarea 2.3"` | 9 casos PASSED (`evidencia/tests-dirigidos.txt`) |
| H1.S1.M2 | Con filtro territorial la búsqueda no consulta el índice y degrada a SQL | ídem | PASSED «un departamento del catálogo acota por SQL…» |
| H1.S1.M3 | `PublicSearchRepository.targetIdsByTerritory`, intersectado con ciudad y especialidad | SQL renderizado con `PostgreSqlPlatform.formatQuery` y corrido en psql | CH → 14 sujetos, LP → 0, SC → 0 (`evidencia/sql-departamento-resultado.txt`) |
| H1.S1.M4 | `department` y `municipality` en `GET /public/search/practitioners` y `/organizations`, al final de la firma | `jest … community-public.controller.spec.ts` | 2 casos PASSED |
| H2.S1.M1 | `CredentialsRepository.lockSubjectForRegistration` (`pg_advisory_xact_lock`) antes de `findLivePasswordBySubject` en el alta de paciente | `jest … -t "locks the national id"` + dos transacciones reales en psql | PASSED; B esperó de 06.283 a 08.387, cuando A hizo commit (`evidencia/cerrojo-concurrencia.txt`) |
| H3.S1.M1 | `PLAN_REPARTO_TAREAS_ENDER_E_ITZAN.md` con el estado real de cada fila y su PR | `git diff` | 12 filas actualizadas y una nota de estado |

## A medias
Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Fusión a `dev` | BLOQUEADO | El modo automático de Claude Code deniega `gh pr merge`; lo fusiona un revisor (`jsaldias39` o `PabloArauzCaballero`) |
| Indexar departamento y municipio en OpenSearch | TODO (fuera de alcance) | Mientras tanto, con esos filtros la búsqueda va por SQL |
| Desplegable en cascada en el frontend | TODO (fuera de alcance) | Consumir `department`/`municipality` en `public-directory.client.ts` |

## Evidencia
```
typecheck exit=0
eslint exit=0            (11 archivos tocados)
Test Suites: 56 passed, 56 total     (src/modules/community + src/modules/iam)
Tests:       884 passed, 884 total
total 12 passed 12       (tests dirigidos a 2.3 y 7.1)
```
```
 depto | sujetos        (consulta de departamento del repositorio, renderizada por MikroORM 7.1.7)
 CH    |      14
 LP    |       0
 SC    |       0
```
```
A tomó el cerrojo 19:23:05.381157
B pide el cerrojo 19:23:06.283423
A suelta (commit) 19:23:08.386215
B obtuvo el cerrojo 19:23:08.387104
C (otra cédula) pide 19:23:08.686015
C obtuvo 19:23:08.686411
```
La cédula usada en la prueba del cerrojo (`9999999`) es sintética. La evidencia no contiene datos de salud: sólo conteos y códigos de catálogo.

## No cubierto
- La llamada HTTP a los dos endpoints con los parámetros nuevos: no se levantó la API. En la base de desarrollo ninguna dirección con municipio pertenece a un perfil público (`owner_id = target_id` → 0 filas), así que el endpoint devolvería vacío aunque el filtro ande.
- La prueba de concurrencia del cerrojo se hizo a nivel SQL, no con dos `POST /auth/register/patient` simultáneos.

## Desvíos del plan
- El plan suponía códigos de municipio `SC-…` (lo que documenta `residence-address.ts` para Neon). La base de desarrollo tiene `geo:bo:municipality:<INE>`. Con la primera versión del filtro, todos los departamentos devolvían 0. Se aceptan las dos formas (`departmentSiglaOfMunicipalityCode`), con dos casos de test para la del INE.
- Los parámetros nuevos del controlador se pusieron primero en el medio de la firma y rompieron un test que llama al método por posición. Se movieron al final.

## Riesgos residuales
- `common.addresses.administrative_area_concept_id` queda en `NULL` en la base de desarrollo (0 de 14), porque `residence-address.ts` sólo reconoce la forma `SC-…`. El filtro por departamento no depende de esa columna, pero cualquier otro lector sí. Queda anotado; no se toca (fuera de alcance).
- La 7.1 no resuelve que dos personas con el mismo número de cédula y distinto departamento tengan cuenta cada una: el login es el número a secas. Es una decisión de producto.
- Fuera del alta de paciente, los auto-registros de profesional y de organización siguen el patrón comprobar-y-después-insertar. El índice único los protege con el 409 genérico.

## Decisiones y ambigüedades
- `municipality` sin `department` se acepta (el municipio implica su departamento); los dos juntos tienen que ser coherentes. **Confirmar con Justin/Pablo.**
- Un departamento se reconoce por su columna **o** por el prefijo del código del municipio. **Confirmar con Marcelo (modelo).**
- 5.3 y 6.2 quedan marcadas como «cubierta de otra forma» y «reemplazada» en el plan de reparto. Aceptarlas o reabrirlas lo deciden los revisores.
