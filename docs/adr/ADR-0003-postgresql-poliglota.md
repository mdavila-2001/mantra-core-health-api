# ADR-0003: Motor de datos — PostgreSQL primario + almacenamiento políglota complementario

## Estado
Aceptado.

## Contexto
El dominio combina datos altamente relacionales y transaccionales (facturación, agenda, historia
clínica) con necesidades que un RDBMS relacional no cubre bien: documentos semi-estructurados,
caché/estado efímero, búsqueda de texto completo, objetos binarios grandes (imágenes, DICOM).

## Fuerzas y restricciones
- Necesidad de Row-Level Security por tenant a nivel de fila — capacidad nativa de PostgreSQL.
- Necesidad de transacciones ACID para dinero, medicación e inventario.
- Documentos sin esquema fijo (`document_store`), búsqueda (`search_platform`), caché
  (`redis_runtime`) y objetos grandes (`object_storage`) tienen requisitos muy distintos entre sí.

## Opciones consideradas
Alternativa de "todo en un solo motor" (PostgreSQL con JSONB para todo): descartada implícitamente
por el código — existen módulos dedicados (`document_store`, `search_platform`, `redis_runtime`,
`object_storage`) con drivers propios, no tablas JSONB genéricas.

## Decisión
PostgreSQL como almacén transaccional primario (1184 entidades, RLS), complementado por MongoDB
(`document_store`), Redis (`redis_runtime`), OpenSearch (`search_platform`) y MinIO/S3
(`object_storage`) para sus casos de uso específicos — arquitectura políglota deliberada, no
accidental.

## Consecuencias positivas
- Cada almacén se usa para lo que hace mejor; PostgreSQL no carga con búsqueda de texto completo
  ni objetos binarios grandes.
- RLS por tenant queda concentrado en un único motor (PostgreSQL), no fragmentado.

## Consecuencias negativas
- Consistencia entre almacenes no es transaccional — requiere reconciliación explícita
  (`cross_store_consistency`, con su propio worker).
- Cinco motores de datos que operar, respaldar y monitorear en vez de uno.

## Riesgos
Consistencia eventual entre PostgreSQL y los almacenes secundarios; sin `cross_store_consistency`
funcionando completamente (ver `ESTADO-Y-PENDIENTES.md`), hay ventana de divergencia posible.

## Evidencia
`docker-compose.yml`, `docs/architecture/integration-map.md` §2, módulos
`document_store`/`redis_runtime`/`search_platform`/`object_storage` (0 entidades ORM propias,
confirmado en [system-inventory.md](../reports/system-inventory.md)).

## Plan de revisión
Revisar cuando `cross_store_consistency` complete su implementación (`OPS-001`).
