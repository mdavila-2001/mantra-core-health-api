# Repositorio universal de servicios

Lo único desde donde una práctica puede sumar un servicio a su catálogo
(`GET /billing/service-catalog/repository` → `POST /billing/service-catalog/import`).
La API lee el conjunto `VS_SERVICE_REPOSITORY` (más `VS_BO_MEDICAL_PROCEDURE` y
`VS_SPECIALTY_SERVICES_*`). Fuentes y licencias: [SOURCES.md](SOURCES.md). Agregar una
fuente: [ADAPTERS.md](ADAPTERS.md).

```sh
node tools/terminology-import/service-repository/build-service-repository.mjs           # fuentes → data/
node tools/terminology-import/service-repository/load-service-repository.mjs            # dry-run
node tools/terminology-import/service-repository/load-service-repository.mjs --apply    # carga (.env DB_*), idempotente
node --test "tools/terminology-import/service-repository/test/*.test.mjs"
```

Orden: la API arrancó una vez (conceptos internos y `VS_MEDICAL_SPECIALTY`), luego
`specialty-services/load-specialty-services.mjs --apply`, luego este cargador.
