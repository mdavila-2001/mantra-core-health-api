# ADR-0012: Estrategia de errores — jerarquía de dominio + filtro global

## Estado
Aceptado.

## Contexto
60 módulos necesitan un modelo de error consistente para que un cliente pueda ramificar lógica
sobre `error.code` sin parsear mensajes en español pensados para humanos, y sin que un 5xx filtre
detalles internos (stack, SQL) al cliente.

## Fuerzas y restricciones
- Errores de negocio esperados (404, 409, 412) deben distinguirse de errores no anticipados (500)
  tanto en logging (nivel `warn` vs. `error` con stack) como en lo que ve el cliente.
- Necesidad de `correlationId` para que soporte pueda localizar la línea de log real de un 500
  sin exponer el detalle al cliente.

## Opciones consideradas
Excepciones nativas de Nest sin tipar vs. jerarquía de dominio propia: el código implementa una
jerarquía propia (`DomainException` y subclases) sobre `HttpException`.

## Decisión
`DomainException` (con `ErrorCode` estable) como base de excepciones de negocio, capturada
globalmente por `AllExceptionsFilter`, que homogeneiza cualquier error — de dominio, de Nest, o no
controlado — en un cuerpo `{code, message, correlationId, details, timestamp, path}`.

## Consecuencias positivas
- `ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException` son, según el
  grafo de dependencias, 3 de los 10 componentes más reutilizados del sistema (386+288+353 usos) —
  el patrón realmente se sigue, no es aspiracional.
- Los 5xx nunca filtran stack/SQL al cliente, solo `code: "INTERNAL"` + `correlationId`.

## Consecuencias negativas
- Añadir un nuevo tipo de error de negocio requiere una subclase nueva de `DomainException`, no
  solo lanzar una excepción genérica — más ceremonia, más consistencia.

## Riesgos
Ninguno identificado — patrón maduro y ampliamente adoptado en el código real.

## Evidencia
`src/common/errors/{domain.exception,error-codes}.ts`, `src/common/filters/all-exceptions.filter.ts`,
[modelo de error](../api/error-model.md), [graphify-audit.md](../reports/graphify-audit.md) §7.

## Plan de revisión
Sin fecha programada — patrón estable.
