# Revisión del módulo `data_catalog` — ALOVIDA

## Alcance y evidencia

Se revisaron inventario, anotaciones, evidencia, revisión segregada, cobertura y escaneo interno con lease. `corepack yarn test src/modules/data_catalog --runInBand --silent` aprobó **4 suites y 48 pruebas**.

## Hallazgo confirmado

### DCAT-01 — Media — Parte de las precondiciones de revisión no expone `reason` estable

El servicio valida campos fuera de destino, envío incompleto, concurrencia, autorrevisión y evidencia. Las dos primeras usan `CatalogValidationException` y la autorrevisión una `DomainException`, pero el resto de violaciones termina en `PreconditionFailedException` genérica con una lista variable de mensajes ([`catalog-annotations.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/data_catalog/services/catalog-annotations.service.ts#L155-L197), [`…270-L334`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/data_catalog/services/catalog-annotations.service.ts#L270-L334)). El consumidor recibe un status pero no una razón versionada que distinga ficha sin evidencia, estado no revisable o revisión desactualizada.

**Plan:** normalizar cada violación a un reason del catálogo: `CATALOG_REVIEW_EVIDENCE_REQUIRED`, `CATALOG_REVIEW_STATE_INVALID`, `CATALOG_REJECTION_COMMENT_REQUIRED` y `CATALOG_SELF_REVIEW_FORBIDDEN`; devolver sólo los nombres de campo permitidos como metadatos. Mantener la segregación y el lock pesimista actuales.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Revisor distinto aprueba revisión actual con evidencia | `200`, decisión y revisión aprobada |
| Límite | Mismo contenido se reenvía sin cambio | respuesta idempotente, sin revisión adicional |
| Error | Autor intenta revisar su propia anotación | sin decisión ni cambio de estado |
| Falla catalogada | Aprobar sin evidencia o rechazar sin comentario | `422/PRECONDITION_FAILED/CATALOG_REVIEW_EVIDENCE_REQUIRED` o `CATALOG_REJECTION_COMMENT_REQUIRED` |

## Controles verificados

El endpoint interno exige `SYSTEM`; los escaneos usan `SKIP LOCKED`, lease y fencing; el error persistido se sanea antes de almacenar cadenas de conexión. Faltan pruebas HTTP de la taxonomía completa de reasons.
