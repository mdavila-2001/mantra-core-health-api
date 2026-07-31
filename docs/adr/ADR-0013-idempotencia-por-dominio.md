# ADR-0013: Idempotencia — por dominio, no transversal

## Estado
Aceptado.

## Contexto
Algunos flujos (cobros, emisión de solicitudes de medicación) no toleran duplicación accidental
por reintento de red; la mayoría de operaciones CRUD del sistema no tienen ese riesgo.

## Fuerzas y restricciones
- Un mecanismo transversal de idempotencia (middleware genérico con `Idempotency-Key`) añade
  complejidad a los 841 endpoints, la mayoría de los cuales no la necesitan.
- Los casos que sí la necesitan tienen semánticas distintas: `payments` usa una clave de
  idempotencia explícita del cliente; perioperatorio depende de una restricción de unicidad
  natural del dominio.

## Opciones consideradas
Middleware genérico de idempotencia vs. implementación puntual por dominio: el código implementa
la segunda opción — no existe un middleware ni interceptor global de idempotencia.

## Decisión
Idempotencia implementada donde el negocio la exige, con el mecanismo que mejor se ajuste al
dominio (clave explícita del cliente en `payments`; restricción `UNIQUE`/estado en otros) — no un
mecanismo transversal.

## Consecuencias positivas
- Sin sobrecarga de infraestructura genérica en los cientos de endpoints que no la necesitan.
- Cada dominio elige la semántica de idempotencia correcta para su propio caso (no todos son
  "misma clave = misma respuesta").

## Consecuencias negativas
- No hay garantía uniforme: un desarrollador debe saber, módulo por módulo, si una operación es
  idempotente y cómo. Ver `docs/api/conventions.md` §"Idempotencia" — catálogo incompleto en esta
  fase.

## Riesgos
Riesgo de que un flujo nuevo con necesidad real de idempotencia se implemente sin ella por
desconocimiento del patrón existente en `payments`.

## Evidencia
`src/modules/payments/controllers/payments-intents.controller.ts` (`idempotencyKey`),
ausencia de middleware genérico en `src/main.ts`.

## Plan de revisión
Completar el catálogo de qué endpoints son idempotentes en Fase 9 (por módulo) — pendiente.
