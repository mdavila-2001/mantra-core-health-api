# Backend de ALOVIDA

API de salud en NestJS, TypeScript, MikroORM y PostgreSQL. Expone rutas HTTP desde `src/main.ts` y ejecuta trabajos programados en **24 procesos worker** independientes. Los dominios viven en `src/modules/`; el catálogo ORM y la verificación del esquema están en `src/orm/`. Redis, MongoDB, OpenSearch, TimescaleDB, pgvector y MinIO sirven funciones específicas según el módulo y el despliegue.

Este README describe el código de la rama. La [revisión del backend del 2026-10-05](docs/revision-backend-2026-10-04/README.md) registra hallazgos, cobertura real y planes; no implica que todas las rutas hayan sido verificadas.

## Arquitectura y mapa

| Área | Código | Documentación |
|---|---|---|
| API, arranque y composición | `src/main.ts`, `src/app.module.ts` | [Mapa de `src`](src/README.md) |
| 70 módulos de dominio | `src/modules/<dominio>/` | [Índice de módulos](src/modules/README.md) |
| Autenticación, errores, tenant y utilidades | `src/common/` | [Common](src/common/README.md) |
| ORM y catálogo de entidades, índices y FK | `src/orm/` | [ORM](src/orm/README.md) |
| Workers y jobs | `src/worker/`, `src/worker-*.ts` | [Mapa de 24 workers](src/worker/README.md) |
| DDL, migraciones y patches | `database/SQL/`, `database/NoSQL/` | [Operaciones](docs/operations/deployment.md) |
| Contratos externos | `openapi/`, `asyncapi/` | [OpenAPI](openapi/CONTRATO-PUBLICO.md), [AsyncAPI](asyncapi/asyncapi.yaml) |

### Procesos worker

| Grupo | Entry points |
|---|---|
| Atención, clínica y agenda | `scheduling`, `health_context`, `identity_assurance`, `pharmacy_inventory`, `audio-assets`, `files`, `qa_lab` |
| Comunicación y comunidad | `messaging`, `community`, `integrations`, `tracking`, `vector_rag` |
| Cobros y operación | `billing`, `promotions`, `automation`, `workflow`, `delegated_access`, `consent`, `cross_store_consistency` |
| Datos y análisis | `data_catalog`, `read_models`, `reporting`, `lakehouse`, `time_series` |

Cada nombre corresponde a `src/worker-<nombre>.ts`; la tabla suma 24. El [mapa de workers](src/worker/README.md) contiene jobs, scripts y límites. `docker-compose.yml` declara 24 servicios worker, algunos bajo perfiles; `docker-compose.coolify.yml` declara cuatro de forma explícita. El número de entrypoints no describe qué está activo en cada ambiente.

## Requisitos y configuración local

- Node.js según el `Dockerfile` (`node:24-bookworm-slim` para la imagen), Corepack y Yarn 4.14.1 (`packageManager` en `package.json`).
- Servicios de datos que exige el flujo que se vaya a ejecutar. [`docker-compose.yml`](docker-compose.yml) y [variables de entorno](docs/getting-started/environment-variables.md) describen la configuración; no copies credenciales de producción a una base local.
- DDL versionado en [`database/SQL`](database/SQL) y extensiones NoSQL en [`database/NoSQL`](database/NoSQL). Para un arranque con Compose, los init jobs materializan el esquema antes de iniciar la API; [guía de despliegue](docs/operations/deployment.md).

```bash
corepack yarn install --immutable
corepack yarn typecheck
corepack yarn build
corepack yarn start:dev
```

Para levantar el stack local según Compose: `docker compose up -d`. Para Coolify, seguí [su guía específica](docs/operations/coolify.md); tiene configuración, migración y secretos distintos. El arranque de seeds se controla mediante `corepack yarn seed:boot`; `corepack yarn seed:datasets` ejecuta el extractor de catálogos bolivianos. Verificá el ambiente y los efectos del comando antes de usarlo en una base persistente.

## Comandos de verificación

| Comando | Qué comprueba |
|---|---|
| `corepack yarn typecheck` | Tipado TypeScript sin emitir archivos. |
| `corepack yarn lint` | ESLint sobre `src`, `apps`, `libs` y `test`. |
| `corepack yarn test --runInBand` | Unitarios `src/**/*.spec.ts`. |
| `corepack yarn test:integration --runInBand` | Integración real; requiere almacenes y fixtures apropiados. |
| `corepack yarn smoke --runInBand` | Smoke real. **Destruye datos de negocio de la DB configurada**; leé [la advertencia](test/smoke/README.md) antes de ejecutarlo. |
| `corepack yarn test:e2e --runInBand` | Actualmente sólo el saludo de `GET /`. |
| `corepack yarn docs:validate` | Lints de OpenAPI/AsyncAPI y cobertura/enlaces documentales. |
| `corepack yarn orm:audit` | Auditoría de fidelidad del catálogo ORM. |

El detalle y los prerrequisitos están en [test/README.md](test/README.md) y [test/integration/README.md](test/integration/README.md). La suite e2e actual no certifica flujos clínicos.

## Contrato de errores

`src/common/errors/domain.exception.ts` define `DomainException` y subclases con `HttpStatus` y `ErrorCode`; `src/common/filters/all-exceptions.filter.ts` arma la respuesta HTTP con `code`, `message`, `correlationId`, `details`, `timestamp` y `path`. Algunos dominios aportan `details.reason`, pero esta base **no lo exige de forma uniforme**; [el informe del catálogo](docs/revision-backend-2026-10-04/transversal/catalogo-errores.md) describe la brecha y el plan. Para clientes, `code` es más estable que el texto de `message`.

## Observabilidad: OpenTelemetry y Jaeger

La API y los workers tienen bootstrap de telemetría y pueden exportar trazas por OTLP. La exportación se habilita de forma explícita con `OTEL_ENABLED=true` y un destino configurado. Para Jaeger local, los scripts existentes son `corepack yarn jaeger:up`, `corepack yarn jaeger:verify` y `corepack yarn jaeger:down`; la UI local suele estar en `http://localhost:16686` según el Compose de Jaeger. Las respuestas HTTP incluyen `x-trace-id` cuando el interceptor de trazas actúa, y los logs estructurados permiten correlación. Consultá [la guía de observabilidad](docs/observability/README.md) para configuración, privacidad, topología y runbooks.

## Operación y documentación

- Imagen y stack: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker-compose.coolify.yml`](docker-compose.coolify.yml).
- Despliegue, rollback, salud y mantenimiento: [operaciones](docs/operations/deployment.md) y [runbooks](docs/operations/runbooks/index.md).
- Contratos: [`openapi/`](openapi/), [`asyncapi/`](asyncapi/) y sitio MkDocs (`mkdocs.yml`).
- Hallazgos y plan de corrección: [revisión del backend](docs/revision-backend-2026-10-04/README.md).
