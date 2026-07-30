# Módulo 55 — Document Store (documentos flexibles sobre MongoDB)

Almacén de documentos flexibles (JSON/semiestructurados) que **complementa** Postgres: borradores,
snapshots, payloads FHIR crudos, plantillas y cualquier estructura que no encaje bien en el modelo
relacional. Persiste en MongoDB real (contenedor `mantra-redesa-mongodb-1`) leyendo `MONGODB_URI` y
`MONGO_DB` del entorno.

## Endpoints (CRUD gobernado por tenant)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/document-store/collections/:collection/documents` | Crear documento (`version` = 1) |
| GET | `/document-store/collections/:collection/documents/:id?tenantId=` | Leer documento vivo |
| GET | `/document-store/collections/:collection/documents?tenantId=&page=&pageSize=&documentType=` | Listar paginado |
| PATCH | `/document-store/collections/:collection/documents/:id` | Actualizar con concurrencia optimista (`expectedVersion`) |
| DELETE | `/document-store/collections/:collection/documents/:id?tenantId=` | Borrado **lógico** (`deletedAt`), nunca físico |

## Forma del documento

```jsonc
{
  "_id": "ObjectId",        // expuesto como `id` hex en las respuestas
  "tenantId": "uuid",       // aislamiento: TODA operación filtra por él
  "documentType": "string", // clasificación (p. ej. fhir_bundle_raw)
  "payload": { },           // contenido flexible libre
  "version": 1,             // concurrencia optimista
  "createdAt": "date",
  "updatedAt": "date",
  "deletedAt": null          // marca de soft-delete
}
```

## Gobierno y seguridad

- **Scoping por tenant**: todas las consultas se acotan por `tenantId` (hoy llega en DTO/param).
- **Guard anti-inyección** (`CollectionNameGuard`): el nombre de colección se valida contra la
  whitelist `/^[a-z][a-z0-9_]{2,40}$/` antes de tocar la base.
- **Concurrencia optimista**: `PATCH` exige `expectedVersion`; un desfase devuelve `409` con
  `CONCURRENCY_CONFLICT`.
- **Borrado lógico**: `DELETE` marca `deletedAt`; los documentos borrados quedan excluidos de
  lecturas y listados.
- **Roles** (`@Roles`) en los mutantes (`STORAGE_ADMIN`/`PLATFORM_ADMIN`); validación de DTOs con
  class-validator.

## Conexión

`MongoConnection` abre un único `MongoClient` de forma perezosa (pool interno compartido) y lo cierra
limpiamente en `onModuleDestroy`. El orquestador importa `DocumentStoreModule`.
