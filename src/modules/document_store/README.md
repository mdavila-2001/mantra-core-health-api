# Módulo 55 — Document Store (documentos flexibles sobre MongoDB)

Almacén de documentos flexibles (JSON/semiestructurados) que **complementa** Postgres: borradores,
snapshots, payloads FHIR crudos, plantillas y cualquier estructura que no encaje bien en el modelo
relacional. Persiste en MongoDB real (contenedor `mantra-redesa-mongodb-1`) leyendo `MONGODB_URI` y
`MONGO_DB` del entorno.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/document_store -name '*.controller.ts' | wc -l
  find src/modules/document_store -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/document_store -name '*.entity.ts' | wc -l
  find src/modules/document_store -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 5 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /document-store/collections/:collection/documents` | STORAGE_ADMIN, PLATFORM_ADMIN | `document-store` |
| `GET /document-store/collections/:collection/documents/:id` | sesión | `document-store` |
| `GET /document-store/collections/:collection/documents` | sesión | `document-store` |
| `PATCH /document-store/collections/:collection/documents/:id` | STORAGE_ADMIN, PLATFORM_ADMIN | `document-store` |
| `DELETE /document-store/collections/:collection/documents/:id` | STORAGE_ADMIN, PLATFORM_ADMIN | `document-store` |

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
