# Revisión del módulo `vector_rag` — ALOVIDA

## Alcance y evidencia

Se revisaron gobierno de modelos y colecciones, jobs de embedding, retrieval, borrado y reconciliación. `corepack yarn test src/modules/vector_rag --runInBand --silent` aprobó **5 suites y 97 pruebas**.

## Hallazgos confirmados

### VEC-01 — Crítica — Colecciones, sesiones y jobs cargados por UUID no se acotan al tenant activo

Los controladores aceptan UUID de colección, job, política o sesión y pasan sólo actor y DTO ([`vector-governance.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/controllers/vector-governance.controller.ts#L73-L199), [`vector-runtime.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/controllers/vector-runtime.controller.ts#L76-L191)). Sus servicios cargan colecciones, jobs y sesiones por ID sin cotejar el tenant del contexto: encolado/ejecución ([`embedding-pipeline.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/embedding-pipeline.service.ts#L68-L205)), re-embedding ([`…#L367-L477`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/embedding-pipeline.service.ts#L367-L477)), búsqueda/evidencia/feedback ([`retrieval.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/retrieval.service.ts#L199-L220), [`…#L369-L503`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/retrieval.service.ts#L369-L503)) y reconciliación ([`vector-maintenance.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/vector-maintenance.service.ts#L177-L199)).

El interceptor sólo compara `tenantId` explícito; el UUID de ruta no es un campo de propiedad. Sin RLS estricta, un actor autorizado en A puede operar una colección, sesión o job de B: encolar corpus, producir evidencia, marcar feedback de seguridad o alterar el ciclo de vida.

**Plan:** propagar el tenant resuelto y usar resolvers `id + tenantId` para colección, job, política y sesión. En rutas de worker, exigir además que la credencial esté vinculada al tenant del job. Responder 404 uniforme fuera de alcance y cubrir dos tenants.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Administrador de A encola y re-embebe colección activa de A | `201`; sólo hay job y cambios de A |
| Límite | Worker de A intenta ejecutar job o reconciliar colección de B | `404`; no escribe documentos ni vectores de B |
| Error | Clínico de A captura feedback o cita evidencia de sesión de B | `404`; sesión y evidencia de B intactas |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/VECTOR_RESOURCE_OUT_OF_SCOPE` |

### VEC-02 — Crítica — El borrado de embeddings no filtra documentos por tenant

`propagateDeletion` crea el job con `dto.tenantId`, pero llama `findDocumentsForDeletion` con sólo `sourceDocumentId` y `patientProfileId` ([`vector-maintenance.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/vector_rag/services/vector-maintenance.service.ts#L68-L112)). La selección no recibe tenant; los documentos devueltos se borran físicamente junto a chunks y embeddings. El tenant del DTO puede estar bien validado por el interceptor y aun así no participa en la consulta de borrado.

Una solicitud de borrado del tenant A con una referencia compartida o reutilizada puede purgar corpus de B y además producir un job y evento que lo atribuyen a A. La operación irreversible requiere una cadena de alcance antes de seleccionar la primera fila.

**Plan:** añadir `tenantId` obligatorio al criterio/repositorio y comprobar cada documento contra la colección/binding de ese tenant antes de borrar. Limitar por cursor/lote dentro del tenant y confirmar el conteo sólo de recursos autorizados.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Solicitud de A por documento/paciente de A | borra embeddings, chunks y documentos sólo de A |
| Límite | Más documentos de A que el lote | procesa sólo el lote de A y conserva cursor verificable |
| Error | Solicitud de A coincide con referencia de B | `404`; cero borrados y cero job marcado verificado |
| Falla catalogada | Referencia inexistente o fuera de tenant | `404/RESOURCE_NOT_FOUND/VECTOR_DELETION_TARGET_OUT_OF_SCOPE` |

## Controles verificados

Los DTO que traen `tenantId` son cotejados por el interceptor. El módulo valida estado de colección/modelo, persiste candidatos denegados y elige `topK` tras autorizar. El consentimiento se exige como presencia de una directiva, pero sigue pendiente contrastarlo contra `consent.consent_directives`, según el propio módulo.
