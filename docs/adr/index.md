# Registro de decisiones arquitectónicas (ADR)

> Fase 10. Reconstruidas retroactivamente sobre decisiones ya implementadas en el código — no hay
> registro histórico de la discusión original en la mayoría de los casos, así que cada ADR lo
> declara honestamente en su sección "Opciones consideradas" en vez de inventar un debate que no
> ocurrió. Lo que sí es verificable en cada una es la decisión final, su evidencia en código y sus
> consecuencias reales.

| ADR | Título | Estado |
|---|---|---|
| [0001](ADR-0001-framework-nestjs.md) | Framework de aplicación — NestJS | Aceptado |
| [0002](ADR-0002-orm-mikroorm.md) | ORM — MikroORM | Aceptado |
| [0003](ADR-0003-postgresql-poliglota.md) | Motor de datos — PostgreSQL primario + políglota | Aceptado |
| [0004](ADR-0004-autenticacion-jwt-propio.md) | Autenticación — JWT propio | Aceptado |
| [0005](ADR-0005-autorizacion-rbac-pdp-clinico.md) | Autorización — RBAC + PDP clínico aditivo | Aceptado |
| [0006](ADR-0006-multi-tenancy-rls.md) | Multi-tenancy — RLS sobre esquema compartido | Aceptado (verificación operativa pendiente) |
| [0007](ADR-0007-eventos-sin-broker-externo.md) | Eventos y colas — sin broker externo | Aceptado |
| [0008](ADR-0008-cache-redis.md) | Caché — Redis dedicado | Aceptado |
| [0009](ADR-0009-almacenamiento-archivos-minio.md) | Almacenamiento de archivos — MinIO/S3 | Aceptado |
| [0010](ADR-0010-observabilidad-pino.md) | Observabilidad — logging estructurado con Pino | Aceptado (logging); métricas/trazas pendientes |
| [0011](ADR-0011-sin-versionado-api.md) | Versionado de API — sin versionado activo | Aceptado |
| [0012](ADR-0012-estrategia-errores.md) | Estrategia de errores — jerarquía de dominio + filtro global | Aceptado |
| [0013](ADR-0013-idempotencia-por-dominio.md) | Idempotencia — por dominio, no transversal | Aceptado |
| [0014](ADR-0014-despliegue-docker-compose.md) | Despliegue — Docker Compose multiproceso | Aceptado |
| [0015](ADR-0015-secretos-variables-entorno.md) | Gestión de secretos — variables de entorno | Aceptado (riesgo residual) |
| [0016](ADR-0016-migraciones-sql-plano.md) | Migraciones — DDL SQL plano fuera del ORM | Superado por [0021](ADR-0021-fuente-unica-de-ddl.md) |
| [0017](ADR-0017-seeds-idempotentes-arranque.md) | Seeds — idempotentes en cada arranque | Aceptado |
| [0018](ADR-0018-consistencia-transaccional.md) | Consistencia transaccional — transacción local + outbox, sin sagas | Aceptado |
| [0019](ADR-0019-patron-outbox.md) | Patrón outbox transaccional propio | Aceptado |
| [0020](ADR-0020-trazas-opentelemetry-jaeger.md) | Trazas distribuidas — OpenTelemetry + OTLP + Jaeger | Aceptado |
| [0021](ADR-0021-fuente-unica-de-ddl.md) | El esquema se declara en el modelo canónico, no en este repositorio | Aceptado |
| [0022](ADR-0022-generacion-de-entidades.md) | Generación de entidades — cuerpo desde el modelo, documentación aparte | Aceptado |
| [0023](ADR-0023-puertos-persistencia-read-write.md) | Puertos de persistencia con rutas de lectura y escritura separadas | Aceptado |
| [0024](ADR-0024-portal-admin-catalogo-de-datos.md) | Portal administrativo — catálogo de datos como módulo propio con jobs durables | Aceptado (desvío declarado de 0021) |
| [0025](ADR-0025-qa-runner-en-servidor.md) | QA Lab ejecuta en el servidor, con destinos aprobados y aprobación ligada al plan | Aceptado (desvío declarado de 0021) |

## Cómo añadir un ADR nuevo

1. Copiar la plantilla de `PLAN_MAESTRO_DOCUMENTACION_BACKEND_PRODUCCION.md` §13.
2. Numerar correlativo (`ADR-0020-...`).
3. Añadir la fila a esta tabla.
4. Si reemplaza un ADR existente, marcar el anterior como `Reemplazado` y enlazar al nuevo.
