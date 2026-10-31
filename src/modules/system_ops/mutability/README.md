# system_ops / mutability — gobierno de mutabilidad de datos

Dice, **por tabla y con evidencia**, qué es append-only, qué se puede borrar, qué es borrado lógico, qué
se purga por retención y qué admite un legal hold. Es de sólo lectura; la escritura del registro es
`GovernanceCatalogController` (UC-11-01..03).

## Piezas

| Carpeta / archivo | Qué hace |
| --- | --- |
| `extractor/` | Funciones **puras** que derivan el catálogo desde el modelo (SQL, diagramas, matriz de integridad), el inventario de endpoints y los hechos de código curados (`code-facts.ts`, con archivo:línea verificable). `derive.ts` es el núcleo. |
| `extractor/extract-cli.ts` | `npx tsx src/modules/system_ops/mutability/extractor/extract-cli.ts --model ../mantra-core-health-model [--check]` regenera `data/mutability.catalog.json` (`--check` falla si quedó viejo). |
| `data/mutability.catalog.json` | Catálogo **derivado** (ni oficial ni curado). La API lo consume como dato: no lee el repo del modelo en ejecución. |
| `services/mutability-catalog.service.ts` | Lista, detalle y resumen (numerador/denominador). |
| `services/mutability-lookup.service.ts` | **Punto de extensión** para la sonda de catalogación: `declared(schema, table)`. Una tabla desconocida es `null`, no `UNKNOWN`. |
| `controllers/mutability.controller.ts` | `GET /admin/governance/mutability`, `/summary`, `/:schema/:table`. Roles: `PORTAL_READ_ROLES`. |
| `../../../common/seed/mutability/` | Sembrador idempotente del registro (`entity_registry`, `write_policies`, `retention_policies`). |

## Reglas

1. Sin evidencia: `UNKNOWN`. Nunca se rellena ni se muestra como «No».
2. Una contradicción entre fuentes se **registra** (`CONTRADICTION`, con las dos evidencias) y no cambia el modo.
3. Niveles, del más fuerte al más débil: `ENFORCED_DB` > `ENFORCED_CODE` > `DECLARED_MODEL` > `DECLARED_DOC` > `INFERRED` > `UNKNOWN`.
4. Plazos de retención y bases legales no se infieren: sólo se copia un plazo si el modelo lo declara y queda `PENDIENTE_DE_CUMPLIMIENTO`.
5. Los legal holds no se siembran: son hechos operativos.

## Activación

Importar `MutabilityModule` desde `SystemOpsModule`; registrar `MutabilityRegistrySeedService` en `SeedModule` y en
`SeedBootstrapService` (después del catálogo de conceptos).
