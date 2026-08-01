# Pruebas E2E

> Fase 15. `test/jest-e2e.json`, un único archivo: `test/app.e2e-spec.ts`.

## Estado

**No ejecutada en esta fase.** Un solo archivo E2E existe en el repositorio — cobertura E2E mínima
comparada con las 841 operaciones del contrato OpenAPI real
([openapi-generation-notes.md](../reports/openapi-generation-notes.md)).

## Qué cubre (por inspección, no ejecución)

`test/app.e2e-spec.ts` arranca la aplicación completa (`NestFactory.create(AppModule)` real, no
mockeada) — a diferencia de las pruebas de integración (que también usan base real pero con
harness propio), esto ejercita el arranque completo incluyendo todos los guards/interceptors
globales.

## Brecha real

Con 60 módulos y 841 operaciones, un solo archivo E2E es una cobertura muy delgada del camino
completo cliente→API→base para los flujos de negocio críticos identificados en
[flujos críticos](../business/critical-workflows.md) (ciclo de vida de una cita, consentimiento y
acceso clínico). No se recomienda declarar cobertura E2E "suficiente" sin ampliarla.

## Ver también

- [Estrategia de pruebas](strategy.md), [Pruebas de integración](integration-tests.md).
