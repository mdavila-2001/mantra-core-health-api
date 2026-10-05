# Revisión del módulo `document_store` — ALOVIDA

## Alcance y evidencia

Se revisaron CRUD, DTO, colección Mongo y prueba dirigida. `corepack yarn test src/modules/document_store --runInBand --silent` aprobó 1 suite y 12 pruebas; no cubre roles clínicos ni Mongo real.

### DOCSTORE-01 — Crítica — cualquier usuario autenticado del tenant puede leer documentos flexibles

Sólo `POST`, `PATCH` y `DELETE` declaran `STORAGE_ADMIN`/`PLATFORM_ADMIN`; `GET :id` y `GET /` no tienen `@Roles` ([document-store.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/document_store/controllers/document-store.controller.ts#L63-L150)). El servicio devuelve `payload` íntegro para cualquier `documentType` ([document-store.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/document_store/services/document-store.service.ts#L69-L103)), y el DTO permite objeto arbitrario, incluido material FHIR o clínico ([create-document.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/document_store/dto/create-document.dto.ts#L8-L55)).

El aislamiento por tenant evita cruzar organizaciones, pero no sustituye una política por tipo, paciente o rol dentro de la organización. Un usuario autenticado T1 puede enumerar y leer cualquier documento flexible de T1 si conoce la colección o usa el listado.

**Plan:** restringir las lecturas a los roles de storage o introducir una política por `documentType` que autorice propietario, paciente y finalidad antes de devolver el payload; derivar tenant del contexto y no de la query. Probar lectura autorizada, documento clínico de otro actor T1, T2, colección inválida y `404/RESOURCE_NOT_FOUND/DOCUMENT_NOT_AVAILABLE`.
