# ADR-0017: Seeds — idempotentes, ejecutados en cada arranque

## Estado
Aceptado.

## Contexto
El modelo resuelve casi todos sus valores cerrados contra `terminology.catalog_concepts`
(ADR-0018-adyacente a la "terminología en vez de enums" de `src/modules/README.md`). Sin esas
filas materializadas, ninguna operación IAM/Common/Terminology puede persistir porque las columnas
`*_concept_id` son foreign keys obligatorias.

## Fuerzas y restricciones
- El seed no puede duplicar filas si el proceso arranca múltiples veces (múltiples réplicas de
  `api`, reinicios).
- Debe converger al mismo estado sin importar cuántas veces se ejecute.

## Opciones consideradas
Seed manual/one-off vs. seed idempotente en cada arranque: el código implementa la segunda opción
(`TerminologySeedService implements OnApplicationBootstrap`).

## Decisión
El seed de conceptos (`TerminologySeedService`) corre en **cada arranque** de la aplicación, con
identificadores deterministas (UUIDv5, `deterministicId()`) y comparación por identificador antes
de insertar — arranques repetidos convergen al mismo estado sin duplicar.

## Consecuencias positivas
- No hay paso manual de "recordar sembrar la base" en un entorno nuevo — el propio arranque lo
  garantiza.
- Múltiples réplicas arrancando simultáneamente no compiten por crear filas duplicadas gracias a
  los IDs deterministas.

## Consecuencias negativas
- El arranque de la aplicación tiene una responsabilidad adicional (verificar/materializar seed)
  que no es puramente "servir HTTP" — acopla el ciclo de vida del proceso al estado de datos base.
- Con `ORM_SCHEMA_SYNC=off` contra una base vacía, el seed puede fallar si las tablas no existen
  aún — comportamiento reconocido explícitamente en el propio código
  (`terminology-seed.service.ts`, comentario sobre registrar y seguir).

## Riesgos
Ninguno crítico — patrón idempotente bien acotado.

## Evidencia
`src/common/seed/terminology-seed.service.ts`, `src/common/seed/module-concepts.ts`,
`src/common/constants/concepts.ts` (`CONCEPTS`, el 8º nodo de mayor centralidad del sistema según
[graphify-audit.md](../reports/graphify-audit.md) §7).

## Plan de revisión
Sin fecha programada.
