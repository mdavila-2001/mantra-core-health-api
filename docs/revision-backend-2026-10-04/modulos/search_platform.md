# Revisión del módulo `search_platform` — ALOVIDA

## Alcance y resultado

Se revisaron controladores, DTO, servicio, mappings y proveedor OpenSearch. No se confirmó un hallazgo en el alcance estático: cada operación exige tenant, los documentos se sellan con el tenant del contexto, los filtros tipados no aceptan DSL crudo y toda consulta agrega el término de tenant.

El índice y los campos se resuelven desde un registro cerrado. Antes de indexar, el servicio rechaza campos no declarados, por lo que un productor no puede sumar una propiedad sensible por accidente. Las eliminaciones también llevan filtro de tenant.

## Pruebas ejecutadas

```text
corepack yarn test src/modules/search_platform --runInBand --silent
1 suite, 22 pruebas aprobadas
```

Falta integración con OpenSearch real para verificar mappings, `delete` de un documento de otro tenant y comportamiento tras recrear un índice.

## Matriz de regresión que se conserva

| Área | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Indexación | Documento permitido T1 | lote vacío y tamaño máximo | índice/campo no declarado | `404/RESOURCE_NOT_FOUND/SEARCH_INDEX_NOT_FOUND` |
| Búsqueda | query/faceta declarada T1 | cursor `search_after` | campo de filtro o faceta ajeno | `422/PRECONDITION_FAILED/SEARCH_FIELD_NOT_ALLOWED` |
| Aislamiento | T1 sólo recibe T1 | tenant sentinela de directorio público | sin tenant o ID T2 | `403/FORBIDDEN/SEARCH_TENANT_CONTEXT_REQUIRED` |
