# Plan — Migración DDD de profiles

- Fecha: 2026-10-10 · Repos afectados: mantra-core-health-api (dev, test) · Predecesor: ADR-0026, piloto scheduling
- Resultado observable: profiles está organizado en cuatro capas ejecutables por `module-layering.spec.ts`, conserva los contratos HTTP y sus specs dirigidos pasan en ambas bases.
- Kill-test: `corepack yarn test src/architecture/module-layering.spec.ts --runInBand` después de añadir profiles a `MIGRATED_MODULES`.

## Alcance

- IN: módulo `profiles`; mover código existente por capas, extraer reglas puras/use cases cuando el alcance observado lo permita, adaptar imports/cableado, sumar arquitectura guard y conservar contratos.
- OUT: `entities/`, esquema/DDL, rutas, DTOs, mensajes, claves de error, comportamiento funcional, módulos posteriores a profiles.
- Ambigüedades registradas: la ficha del handoff no desglosa qué operaciones deben extraerse primero; se adopta el molde ADR-0026 y se migran todas las piezas de profiles necesarias para que el guard valide fronteras reales.

## H1 — Cuatro capas válidas para profiles

**CA:** Dado el módulo profiles, cuando se ejecutan typecheck, lint dirigido, specs del módulo y el guard de capas, entonces pasan y las cuatro capas contienen código fuente.
**DoD:** `corepack yarn typecheck`, lint dirigido a los archivos tocados, specs dirigidos de profiles y `corepack yarn test src/architecture/module-layering.spec.ts --runInBand` con salida 0.
**Estado:** A MEDIAS (gates dirigidos pasaron en `dev` y `test`; PRs por publicar)

### H1.S1 — Inventario y migración de archivos

**CA:** Dado el árbol existente, cuando se inspeccionan imports y servicios, entonces cada archivo productivo queda en su capa correspondiente y las dependencias entre módulos pasan por puertos.
**DoD:** `git diff --check`, typecheck, specs de profiles y guard de arquitectura sin violaciones.
**Estado:** A MEDIAS (falta publicar ambos PRs)

| ID       | Microtarea                                  | CA (binario)                                                                             | DoD (comando de verificación)         | Estado                                                                     |
| -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| H1.S1.M1 | Inventariar árboles, imports y contratos    | El inventario identifica archivos de dominio, aplicación, infraestructura y presentación | Lectura de imports + specs existentes | HECHO                                                                      |
| H1.S1.M2 | Mover piezas a capas y adaptar dependencias | Ningún límite de capa/módulo viola ADR-0026                                              | guard de arquitectura + typecheck     | HECHO en `dev` y `test`                                                    |
| H1.S1.M3 | Migrar specs y cableado preservando APIs    | Specs actuales pasan sin debilitar aserciones                                            | specs dirigidos + typecheck           | HECHO                                                                      |
| H1.S1.M4 | Ejecutar lint dirigido y reportar evidencia | Gates solicitados pasan o se documentan con salida literal                               | lint dirigido + diff check + reporte  | HECHO en `dev` y `test`; suite global de `test` conserva 3 rojos conocidos |

## Riesgos y bloqueos previstos

| Riesgo                                                             | Impacto                                           | Mitigación                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| Servicios de más de 3.000 líneas y numerosas dependencias cruzadas | Refactor amplio; riesgo de alterar comportamiento | Extracción mecánica/textual y tests existentes antes de abrir PR   |
| Ramas base desfasadas                                              | PR incorrecto                                     | Usar `origin/dev` y `origin/test` actualizados al preparar cada PR |
