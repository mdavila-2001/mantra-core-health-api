# Módulos del backend

Esta rama contiene **70 directorios de módulo** en `src/modules/`. Algunos usan tablas PostgreSQL y entidades MikroORM; otros integran almacenes o adaptadores distintos. La forma exacta de cada módulo se comprueba en su código y README; no hay una plantilla de archivos válida para todos.

La API los compone en `src/app.module.ts`. El catálogo de entidades, índices y claves foráneas está en [`src/orm/`](../orm/README.md); el DDL versionado en [`database/`](../../database/SQL). Los jobs programados viven en [`src/worker/`](../worker/README.md).

## Cifras medidas

Medido el 2026-10-09 sobre `origin/dev` (`886a1471`). Los números envejecen: repetí los comandos desde la raíz del repo antes de citarlos.

<!--
  find src/modules -mindepth 1 -maxdepth 1 -type d | wc -l      -> 70
  find src/modules -name '*.entity.ts' | wc -l                  -> 1262
  ls src/modules/*/README.md | wc -l                            -> 70
  ls src/worker-*.ts | wc -l                                    -> 24
  find src/worker/jobs -name '*.job.ts' | wc -l                 -> 38
  find src -name '*.spec.ts' | wc -l                            -> 813
-->

| Qué | Cantidad |
|---|---|
| Directorios de módulo en `src/modules/` | 70 |
| Entidades MikroORM (`*.entity.ts`, todas dentro de `src/modules/`) | 1 262 |
| `README.md` de módulo | 70 |
| Entry points de worker (`src/worker-*.ts`) | 24 |
| Archivos de job (`src/worker/jobs/**/*.job.ts`) | 38 |
| Archivos de spec unitario bajo `src/` | 813 |

La cifra de workers de otros documentos (por ejemplo, el `CLAUDE.md` raíz) puede diferir; la que cuenta es el número de `src/worker-*.ts`, y que un entry point exista no implica que esté activo en un despliegue (véase [workers](../worker/README.md)).

## Índice por dominio

### Atención y datos clínicos

- [`clinical`](./clinical/README.md)
- [`clinical_ext`](./clinical_ext/README.md)
- [`chart`](./chart/README.md)
- [`forms`](./forms/README.md)
- [`health_data`](./health_data/README.md)
- [`health_context`](./health_context/README.md)
- [`diagnostics`](./diagnostics/README.md)
- [`diagnostic_units`](./diagnostic_units/README.md)
- [`pharmacy`](./pharmacy/README.md)
- [`pharma_lab`](./pharma_lab/README.md)
- [`pharmacy_inventory`](./pharmacy_inventory/README.md)
- [`qa_lab`](./qa_lab/README.md)
- [`qa_execution`](./qa_execution/README.md)
- [`procedures_perioperative`](./procedures_perioperative/README.md)
- [`consent`](./consent/README.md)

### Identidad, acceso y profesionales

- [`iam`](./iam/README.md)
- [`authz`](./authz/README.md)
- [`auth_providers`](./auth_providers/README.md)
- [`identity_assurance`](./identity_assurance/README.md)
- [`profiles`](./profiles/README.md)
- [`delegated_access`](./delegated_access/README.md)
- [`directory`](./directory/README.md)
- [`practice`](./practice/README.md)
- [`medical_groups`](./medical_groups/README.md)
- [`organization_extensions`](./organization_extensions/README.md)

### Finanzas y cobertura

- [`accounting`](./accounting/README.md)
- [`billing`](./billing/README.md)
- [`payments`](./payments/README.md)
- [`insurance`](./insurance/README.md)
- [`erp`](./erp/README.md)
- [`quotations`](./quotations/README.md)
- [`promotions`](./promotions/README.md)

### Comunicación y experiencia

- [`community`](./community/README.md)
- [`messaging`](./messaging/README.md)
- [`ads`](./ads/README.md)
- [`marketing`](./marketing/README.md)
- [`crm`](./crm/README.md)
- [`education`](./education/README.md)
- [`surveys`](./surveys/README.md)
- [`content_packs`](./content_packs/README.md)
- [`public`](./public/README.md)
- [`audio_assets`](./audio_assets/README.md)
- [`tracking`](./tracking/README.md)
- [`automation`](./automation/README.md)
- [`scheduling`](./scheduling/README.md)
- [`workflow`](./workflow/README.md)
- [`geo`](./geo/README.md)

### Plataforma, datos y operación

- [`common`](./common/README.md)
- [`system_context`](./system_context/README.md)
- [`system_ops`](./system_ops/README.md)
- [`platform_ops`](./platform_ops/README.md)
- [`ops_console`](./ops_console/README.md)
- [`audit`](./audit/README.md)
- [`telemetry`](./telemetry/README.md)
- [`terminology`](./terminology/README.md)
- [`integration_contracts`](./integration_contracts/README.md)
- [`integrations`](./integrations/README.md)
- [`cross_store_consistency`](./cross_store_consistency/README.md)
- [`polyglot_storage`](./polyglot_storage/README.md)
- [`data_catalog`](./data_catalog/README.md)
- [`lakehouse`](./lakehouse/README.md)
- [`time_series`](./time_series/README.md)
- [`vector_rag`](./vector_rag/README.md)
- [`read_models`](./read_models/README.md)
- [`graph_intelligence`](./graph_intelligence/README.md)
- [`reporting`](./reporting/README.md)
- [`document_store`](./document_store/README.md)
- [`redis_runtime`](./redis_runtime/README.md)
- [`search_platform`](./search_platform/README.md)
- [`object_storage`](./object_storage/README.md)

## Convenciones verificables

- Un controller declara rutas y DTOs HTTP; el servicio contiene el caso de uso. La autorización por recurso puede estar en ambos niveles y debe revisarse por endpoint.
- Las entidades PostgreSQL y el catálogo ORM deben contrastarse con el DDL y patches aplicados. No deduzcas el esquema desde un README antiguo.
- Los valores cerrados suelen referenciar `terminology.catalog_concepts`; consultá el catálogo antes de agregar un enum o una columna.
- Para pruebas, usá el spec dirigido de la unidad con `corepack yarn test --runInBand <carpeta>`. La integración puede requerir servicios reales; véase [test/integration](../../test/integration/README.md).

El [informe maestro de revisión](../../docs/revision-backend-2026-10-04/README.md) indica qué módulos fueron realmente leídos y cuáles siguen pendientes. Este índice no es una certificación de seguridad, contrato o esquema.
