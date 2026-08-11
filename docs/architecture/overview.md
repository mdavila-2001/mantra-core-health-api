# Visión general de arquitectura

> Fase 10. Modelo C4 (Simon Brown) aplicado a lo verificado en Fases 0-1
> ([graphify-audit.md](../reports/graphify-audit.md), [system-inventory.md](../reports/system-inventory.md)).
> Fuente de arquitectura versionable: [`structurizr/workspace.dsl`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/structurizr/workspace.dsl).

## Estilo arquitectónico

**Monolito modular**, no microservicios: una única aplicación NestJS (`AppModule`) registra 61
módulos de dominio en el mismo proceso HTTP, cada uno mapeado 1:1 a un schema PostgreSQL propio
(`src/modules/README.md`). El aislamiento entre dominios se logra por **convención de código
verificada mecánicamente** (`tools/redesa/coverage-report.mjs`), no por límites de proceso o red.

La única fragmentación real en procesos separados es **temporal, no por dominio HTTP**: 17
workers ejecutan trabajo periódico por dominio, cada uno su propio proceso/contenedor, hablando
con la API por HTTP interno — nunca accediendo a la base directamente. Ver
[procesamiento en segundo plano](background-processing.md).

## Los cuatro niveles

| Nivel C4 | Página |
|---|---|
| 1. Contexto del sistema | [system-context.md](system-context.md) |
| 2. Contenedores | [containers.md](containers.md) |
| 3. Componentes (dominios seleccionados) | [components.md](components.md) |
| 4. Código | Fuera de alcance de C4 — ver [catálogo de módulos](../modules/index.md) y el propio código |

Flujos transversales complementarios: [ciclo de vida de una request](request-lifecycle.md),
[procesamiento en segundo plano](background-processing.md),
[mapa de integraciones](integration-map.md), [dependencias entre módulos](module-dependencies.md).

## Coherencia con Graphify

El inventario fuente actual contiene 61 módulos, 21 workers y 5 almacenes de datos. El [graphify-audit.md](../reports/graphify-audit.md) conserva la línea base histórica anterior a `audio_assets` (60 módulos/20 workers); la diferencia actual está explicada por la incorporación del módulo y `worker-audio-assets` el 2026-08-10 (ver
§10 de ese informe para la comparación explícita grafo-vs-código).
