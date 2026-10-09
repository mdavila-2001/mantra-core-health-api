# Backend de ALOVIDA

API de salud de ALOVIDA (Mantra Core Technologies): historia clínica, agenda, identidad y acceso, perfiles, farmacia, seguros, contabilidad y comunidad, entre otros dominios. Se escribe en **NestJS 11, TypeScript 5 y MikroORM 7 sobre PostgreSQL**; expone rutas HTTP desde `src/main.ts` y ejecuta trabajos programados en **24 procesos worker** independientes (`src/worker-*.ts`). Los dominios viven en `src/modules/` (70 directorios); el catálogo ORM y la verificación del esquema están en `src/orm/`. Redis, MongoDB, OpenSearch, TimescaleDB, pgvector y MinIO sirven funciones específicas según el módulo y el despliegue. Node 24 y Yarn 4 (Corepack).

Este README describe el código de la rama.

## Arquitectura y mapa

| Área | Código | Documentación |
|---|---|---|
| API, arranque y composición | `src/main.ts`, `src/app.module.ts` | [Mapa de `src`](src/README.md) |
| 70 módulos de dominio | `src/modules/<dominio>/` | [Índice de módulos](src/modules/README.md) |
| Autenticación, errores, tenant y utilidades | `src/common/` | [Common](src/common/README.md) |
| ORM y catálogo de entidades, índices y FK | `src/orm/` | [ORM](src/orm/README.md) |
| Workers y jobs | `src/worker/`, `src/worker-*.ts` | Un entry point por proceso; ver la tabla siguiente |
| DDL versionado (copia del modelo; **no se edita aquí**, no hay migraciones en este repo) | `database/SQL/`, `database/NoSQL/` | [`database/README.md`](database/README.md), [ADR-0021](docs/adr/ADR-0021-fuente-unica-de-ddl.md), [Operaciones](docs/operations/deployment.md) |
| Contratos externos | `openapi/`, `asyncapi/` | [OpenAPI](openapi/CONTRATO-PUBLICO.md), [AsyncAPI](asyncapi/asyncapi.yaml) |

### Procesos worker

| Grupo | Entry points |
|---|---|
| Atención, clínica y agenda | `scheduling`, `health_context`, `identity_assurance`, `pharmacy_inventory`, `audio-assets`, `files`, `qa_lab` |
| Comunicación y comunidad | `messaging`, `community`, `integrations`, `tracking`, `vector_rag` |
| Cobros y operación | `billing`, `promotions`, `automation`, `workflow`, `delegated_access`, `consent`, `cross_store_consistency` |
| Datos y análisis | `data_catalog`, `read_models`, `reporting`, `lakehouse`, `time_series` |

Cada nombre corresponde a `src/worker-<nombre>.ts`; la tabla suma 24. `docker-compose.yml` declara 24 servicios worker, algunos bajo perfiles; `docker-compose.coolify.yml` declara cuatro de forma explícita. El número de entrypoints no describe qué está activo en cada ambiente.

### Carpetas de la raíz

| Carpeta | Contenido |
|---|---|
| `src/` | Código de la API y los workers (mapa arriba y en [`src/README.md`](src/README.md)). |
| `test/` | Integración, smoke, e2e, dobles y fixtures; ver [`test/README.md`](test/README.md). |
| `database/` | Copia versionada del DDL canónico (`SQL/`, `NoSQL/`). |
| `docker/db-init/` | Scripts de los init jobs de Compose. |
| `infra/` | Configuración de monitoreo y del collector OpenTelemetry. |
| `scripts/` | Utilidades de operación (poda de Docker, DDL, Postgres, benchmark de telemetría). |
| `tools/` | Generadores y verificadores en Node/Python: catálogo ORM, documentación, OpenAPI, seeds, Postman. |
| `openapi/`, `asyncapi/` | Contratos HTTP y de eventos generados. |
| `docs/` | Documentación técnica (fuente del sitio MkDocs); los informes de proceso históricos están en [`docs/progress/archive/`](docs/progress/archive/). |
| `mock-provider-server/` | Emulador de proveedores externos para desarrollo; ver su [README](mock-provider-server/README.md). |
| `structurizr/` | Modelo de arquitectura (`workspace.dsl`). |
| `evidencias/` | Evidencia de merges y pruebas de ciclos anteriores. |

En la raíz sólo quedan `README.md` y `AGENTS.md` (instrucciones para agentes) además de la configuración. El estado y los pendientes están en [`docs/progress/ESTADO-Y-PENDIENTES.md`](docs/progress/ESTADO-Y-PENDIENTES.md), el registro de defectos en [`docs/progress/REGISTRO-DEFECTOS.md`](docs/progress/REGISTRO-DEFECTOS.md), la trazabilidad en [`docs/governance/ALOVIDA-TRAZABILIDAD.md`](docs/governance/ALOVIDA-TRAZABILIDAD.md) y el informe de cobertura en [`docs/reports/ALOVIDA-COBERTURA.md`](docs/reports/ALOVIDA-COBERTURA.md) (lo regenera `corepack yarn alovida:coverage`).

## Requisitos y configuración local

- Node.js según el `Dockerfile` (`node:24-bookworm-slim` para la imagen), Corepack y Yarn 4.14.1 (`packageManager` en `package.json`).
- Servicios de datos que exige el flujo que se vaya a ejecutar. [`docker-compose.yml`](docker-compose.yml) y [variables de entorno](docs/getting-started/environment-variables.md) describen la configuración; no copies credenciales de producción a una base local.
- DDL versionado en [`database/SQL`](database/SQL) y extensiones NoSQL en [`database/NoSQL`](database/NoSQL). Con el perfil `local-db`, los init jobs (`postgres-init`, `mongo-init`) materializan el esquema desde esas carpetas antes de iniciar la API; [guía de despliegue](docs/operations/deployment.md).

```bash
corepack yarn install --immutable
corepack yarn typecheck
corepack yarn build
corepack yarn start:dev
```

Para levantar el stack local según Compose, el arranque recomendado es `corepack yarn docker:up` (purga la caché de build vieja y hace `docker compose up -d`). **Ojo:** Postgres, MongoDB y sus init jobs pertenecen al perfil `local-db`, así que un `docker compose up -d` a secas no los levanta (el compose está pensado también para bases gestionadas). Para un stack con bases locales: `docker compose --profile local-db up -d`; para sólo la infraestructura de datos y desarrollar la API con `start:dev`: `docker compose up -d postgres mongodb redis opensearch minio` (nombrarlos activa el perfil). Con `clamav` y `worker-files` rige el perfil `malware-scan`. Los comandos de Compose de este párrafo están leídos de `docker-compose.yml` y `package.json`; no se ejecutaron al escribirlo. Para Coolify, seguí [su guía específica](docs/operations/coolify.md); tiene configuración, migración y secretos distintos. El arranque de seeds se controla mediante `corepack yarn seed:boot`; `corepack yarn seed:datasets` ejecuta el extractor de catálogos bolivianos. Verificá el ambiente y los efectos del comando antes de usarlo en una base persistente.

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

`src/common/errors/domain.exception.ts` define `DomainException` y subclases con `HttpStatus` y `ErrorCode`; `src/common/filters/all-exceptions.filter.ts` arma la respuesta HTTP con `code`, `message`, `correlationId`, `details`, `timestamp` y `path`. Algunos dominios aportan `details.reason`, pero esta base **no lo exige de forma uniforme**; no verifiqué esa uniformidad en esta rama. Para clientes, `code` es más estable que el texto de `message`.

## Observabilidad: OpenTelemetry y Jaeger

La API y los workers tienen bootstrap de telemetría y pueden exportar trazas por OTLP. La exportación se habilita de forma explícita con `OTEL_ENABLED=true` y un destino configurado. Para Jaeger local, los scripts existentes son `corepack yarn jaeger:up`, `corepack yarn jaeger:verify` y `corepack yarn jaeger:down`; la UI local suele estar en `http://localhost:16686` según el Compose de Jaeger. Las respuestas HTTP incluyen `x-trace-id` cuando el interceptor de trazas actúa, y los logs estructurados permiten correlación. Consultá [la guía de observabilidad](docs/observability/README.md) para configuración, privacidad, topología y runbooks.

## Operación y documentación

- Imagen y stack: [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker-compose.coolify.yml`](docker-compose.coolify.yml).
- Despliegue, rollback, salud y mantenimiento: [operaciones](docs/operations/deployment.md) y [runbooks](docs/operations/runbooks/index.md).
- Contratos: [`openapi/`](openapi/), [`asyncapi/`](asyncapi/) y sitio MkDocs (`mkdocs.yml`).
