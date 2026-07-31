# ADR-0001: Framework de aplicación — NestJS

## Estado
Aceptado (en producción de código desde antes de esta auditoría; reconstruido retroactivamente en Fase 10).

## Contexto
El backend necesita estructurar 60 módulos de dominio con inyección de dependencias,
guards/interceptors/pipes/filters transversales (auth, tenancy, validación, errores) y generación
de contrato OpenAPI, sobre TypeScript estricto (`tsconfig.json`: `strict: true`).

## Fuerzas y restricciones
- Volumen: 60 módulos, 841 operaciones — necesita convención fuerte, no solo Express a mano.
- Equipo TypeScript-first (`strict`, `noImplicitAny`, decoradores).
- Necesidad de un mismo framework para la API HTTP y los 20 procesos worker
  (`NestFactory.createApplicationContext`, sin HTTP).

## Opciones consideradas
Alternativas típicas para este tipo de problema (Express puro, Fastify a mano, otro framework
opinado de Node): no hay registro histórico de una evaluación formal — esta ADR documenta la
decisión ya tomada y su justificación observable en el código, no una comparación original.

## Decisión
NestJS 11 (`@nestjs/core@^11.0.1`) como framework único para `api` y los 20 workers.

## Consecuencias positivas
- Guards/interceptors/pipes/filters globales dan un pipeline de request consistente y verificable
  (ver [ciclo de vida de una request](../architecture/request-lifecycle.md)).
- `@nestjs/swagger` genera el contrato OpenAPI real desde los mismos decoradores que documentan
  el DTO (ver [notas de generación de OpenAPI](../reports/openapi-generation-notes.md)).
- Mismo framework para HTTP y `ApplicationContext` de los workers — un solo patrón de arranque
  (`bootstrapWorker()`).

## Consecuencias negativas
- Acoplamiento fuerte a decoradores y reflection (`emitDecoratorMetadata`) — migrar de framework
  sería un reescritura, no un cambio incremental.
- Curva de aprendizaje de DI/decoradores para desarrolladores nuevos.

## Riesgos
Ninguno crítico identificado en esta fase — framework maduro, LTS activo.

## Evidencia
`package.json` (`@nestjs/core`, `@nestjs/common`, `@nestjs/swagger`, etc.), `src/app.module.ts`,
`src/worker/bootstrap.ts`.

## Plan de revisión
Sin fecha de revisión programada — revisar si NestJS deja de recibir soporte LTS o si el volumen
de módulos exige una descomposición en servicios independientes.
