---
name: polyglot-storage
description: "Persistencia poliglota de este backend más allá de PostgreSQL: MongoDB, OpenSearch, Redis, S3 (object storage), TimescaleDB (series de tiempo) y pgvector (RAG vectorial), y los dominios que los orquestan (polyglot_storage, object_storage, time_series, vector_rag, graph_intelligence, lakehouse, cross_store_consistency, telemetry). Usar al añadir o revisar acceso a un almacén no relacional, indexación de búsqueda, blobs, embeddings o consistencia entre almacenes."
---

# polyglot-storage

Además de PostgreSQL (ver skills `orm-catalog` / `mikro-orm-migrations`), el backend usa varios
almacenes. Cada uno tiene un dominio que lo modela en `src/modules/`. Orientarse primero:
`graphify query "<almacén> storage adapter"`.

## Almacenes y clientes (versiones reales del repo)

| Almacén | Cliente (dependencia) | Dominio(s) |
|---|---|---|
| MongoDB | `mongodb` ^7 | `polyglot_storage`, `health_data` |
| OpenSearch | `@opensearch-project/opensearch` ^3 | búsqueda / read models |
| Redis | `ioredis` ^5 (colas vía `@nestjs/bullmq`) | ver skill `bullmq-queues` |
| S3 | `@aws-sdk/client-s3` ^3 | `object_storage` |
| TimescaleDB | hypertables PostgreSQL (capa `07-physical`) | `time_series`, `telemetry` |
| pgvector | `pgvector` ^0.3 | `vector_rag`, `graph_intelligence` |

## Reglas

- **Un adaptador por almacén**, inyectable, no clientes sueltos dispersos por los services.
  Config y credenciales vía `ConfigService` (env validadas con Joi en `src/orm/config` / `src/config`),
  nunca literales.
- **TimescaleDB y pgvector viven dentro de PostgreSQL**: sus hypertables e índices vectoriales
  se declaran en el catálogo/físico (`orm-catalog`), no como estructura ad hoc en runtime.
- **Cross-store**: cualquier escritura que abarque dos almacenes pasa por `cross_store_consistency`;
  no inventes protocolos de consistencia — si no está resuelto, márcalo como deuda (temperatura cero).
- No mezcles el `EntityManager` de MikroORM con los clientes no relacionales en el mismo método;
  separa responsabilidades por adaptador.
- Comentarios y logs en **español**, sin emojis. Límite de 300 líneas por archivo. Tras editar: `graphify update .`.

## Checklist al añadir acceso a un almacén

1. Confirmar el dominio correcto en la tabla de arriba (`graphify path "<ModuloA>" "<ModuloB>"`).
2. Adaptador inyectable + config por `ConfigService` (env en Joi).
   Logging con `PinoLogger` inyectado (regla base, ver `project-conventions`): nunca
   `console`; los fallos de conexión/operación → `error` con campos (`store`, `op`), sin
   volcar credenciales del cliente ni payloads con PII.
3. Reutilizar el adaptador del dominio si ya existe; no dupliques clientes.
4. DTOs con `class-validator` para lo que entre por HTTP (skill `api-design`).
5. `*.spec.ts` con el almacén mockeado o testcontainers (skill `testing-jest`).
6. `yarn lint && yarn build`.
