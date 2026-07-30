# Forms — Services

Poseen la unidad de trabajo (`em.transactional`) y aplican las reglas de negocio.
Validan precondiciones (existencia, unicidad, estado) lanzando excepciones de
dominio, hacen `flush` del padre antes de los hijos y mapean entidades a DTO.

| Servicio | Casos de uso |
|----------|--------------|
| `forms-schema.service.ts` | UC-09-01 (crear set/versión), UC-09-03 (publicar), UC-09-13 (migrar) |
| `forms-fields.service.ts` | UC-09-02 (definir campo + reglas), UC-09-04 (dependencia), UC-09-05 (localización), UC-09-12 (regla de acceso) |
| `forms-assignments.service.ts` | UC-09-06 (asignación con enforcement de política) |
| `forms-instances.service.ts` | UC-09-07 (abrir), UC-09-11 (cerrar) |
| `forms-values.service.ts` | UC-09-08 (capturar), UC-09-09 (corregir), UC-09-10 (importar) |

`value-columns.ts` centraliza la traducción `dataType → columna value_*` (value[x]
exclusivo) usada por captura, corrección e importación.

Tests unitarios en `*.service.spec.ts` mockean repositorios y `EntityManager`
(`transactional: (cb) => cb(txMock)`); cubren happy path, not-found, conflicto y
al menos una regla de negocio por método.
