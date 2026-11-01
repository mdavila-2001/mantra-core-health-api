# src / common / seed / catalog

Siembra de la catalogación: lo que el catálogo de datos (`data_catalog`, módulo 67) y `system_ops`
necesitan para arrancar con contenido **con procedencia**, sin inventar nada.

| Archivo | Responsabilidad |
| --- | --- |
| `catalog-documentation-seed.service.ts` | `CatalogDocumentationSeedService.run()` y `runCatalogSeed()` (la lógica, contra cualquier `CatalogSeedStore`). |
| `catalog-seed.plan.ts` | Plan puro: dominios, niveles de clasificación, glosario, linaje endpoint→tabla, fichas de tabla y de columna, evidencia. |
| `catalog-seed.store.ts` | `PgCatalogSeedStore` (SQL por lotes, `on conflict do nothing`) e `InMemoryCatalogSeedStore` (doble de pruebas: **no** es Postgres). |
| `catalog-seed.types.ts` | Tablas destino y sus columnas, y el contrato del store. |
| `data/vault-table-notes.json` | Texto **propio** de la bóveda por tabla (lo que no es plantilla de la bóveda). Se regenera con `node tools/catalogacion/generar-notas-boveda.mjs` (`--check` lo verifica). |
| `catalogacion-cobertura.cli.ts` | Informe de cobertura con numerador y denominador (`node_modules/.bin/tsx …`). |

La clasificación de calidad (`CURADA` / `PLANTILLA` / `AUTO_DETECTADA` / `VACIA`) vive en
`src/modules/data_catalog/application/catalogacion/explanation-quality.ts`.

## Reglas

- **Nada se aprueba.** Las fichas entran `DRAFT` (texto propio de una persona: comentario del modelo o
  nota de la bóveda), `AUTO_DETECTED` o `NEEDS_REVIEW` (regla determinista / clasificador). El linaje
  entra con `is_official = false`. Aprobar es de una persona.
- **Nada se rellena.** Un campo sin fuente queda `null` con una pregunta abierta; un texto de plantilla
  (repetido en 3 objetos o más, o un molde de generador) no se copia como descripción.
- **Idempotente.** Ids UUIDv5 sobre claves estables + `insert … on conflict do nothing`. Lo creado por
  una persona (aunque tenga otro id) no se toca. No trunca. La segunda corrida inserta 0.
- **Las fichas necesitan el escaneo.** Cada ficha apunta a un objeto de `catalog_objects`; sin escaneo
  se informan como `unresolved` y la corrida siguiente las siembra.
- **No toca** `system_ops.entity_registry` ni las políticas de mutabilidad (`mutability/`).
- Una tabla destino que no existe (parche v4281 sin aplicar) se omite y se informa.
