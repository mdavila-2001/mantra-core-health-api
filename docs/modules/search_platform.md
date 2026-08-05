<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/search_platform/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `search_platform`

**Fuente:** [`src/modules/search_platform/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/search_platform/README.md)
· 1 controllers · 1 services · 0 repositories · 0 entidades · 1 DTO

---

# Módulo 57 — Plataforma de búsqueda (`search_platform`)

Búsqueda de texto completo y facetada sobre **OpenSearch real** (contenedor
`mantra-redesa-opensearch-1`, `OPENSEARCH_NODE`), para las entidades de negocio consultables:
directorio de profesionales/organizaciones, catálogo de servicios y publicaciones. El aislamiento
por tenant se aplica **a nivel de consulta**: no hay forma de que un tenant vea documentos de otro
aunque el índice físico sea común.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/search/:index/documents` | Indexar (upsert) un documento |
| `POST` | `/search/:index/_search` | Buscar (hits + facetas) |
| `DELETE` | `/search/:index/documents/:id` | Eliminar un documento |

Todos exigen rol (`@Roles`) y un tenant de contexto (`X-Tenant-Id`). **Fail-closed**: sin tenant se
rechaza con `PRECONDITION_FAILED` antes de tocar OpenSearch.

## Índices reconocidos (whitelist)

El `:index` de la ruta se valida contra un registro cerrado en
`constants/search-platform.constants.ts`. Un índice no declarado devuelve `NOT_FOUND`.

| Índice | Full-text | Filtros / facetas |
| --- | --- | --- |
| `directory_profiles` | `displayName`, `bio` | `kind`, `specialties`, `city`, `status` |
| `service_catalog` | `name`, `description` | `category`, `priceTier`, `organizationId`, `active` |
| `publications` | `title`, `body` | `tags`, `authorId`, `status` |

Cada índice sella `tenantId` como `keyword` en sus mappings.

## Por qué el tenant no se puede evadir

1. **Al indexar**, el servidor sobrescribe `tenantId` con el del contexto; el `tenantId` que venga en
   el cuerpo se descarta. Un documento nunca queda con el tenant de otro.
2. **Al buscar**, el servicio construye el `bool` query desde campos **tipados** (texto + filtros y
   facetas declarados) y añade **siempre** `filter: [{ term: { tenantId } }]`. El cuerpo de búsqueda
   NO admite un query DSL crudo, así que ese filtro no puede ser reemplazado ni evadido.
3. **Filtros y facetas** se validan contra la *allowlist* del índice: un campo no declarado es un
   error (`PRECONDITION_FAILED`), no un filtro silenciosamente ignorado.

## Cliente OpenSearch

`providers/opensearch-client.provider.ts` expone un único cliente (`OPENSEARCH_CLIENT`) creado desde
`OPENSEARCH_NODE`. `SearchPlatformModule` lo cierra en `onModuleDestroy`, de modo que el apagado de la
app no deja el pool de conexiones abierto.

## Servicio

`SearchIndexService` concentra las invariantes:

- `ensureIndex(name)` — idempotente (no recrea si ya existe).
- `indexDocument(index, tenantId, id, doc)` / `bulkIndex(...)` — sellan `tenantId`.
- `search(index, { tenantId, query, filters, facets, from, size })` — inyecta el filtro de tenant.
- `deleteDocument(...)` y `deleteByQuery(...)` — base de un reindex, siempre acotados al tenant.

Cobertura en `services/search-index.service.spec.ts` (cliente OpenSearch mockeado).

