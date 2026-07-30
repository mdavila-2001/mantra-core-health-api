# DTOs — vector_rag

Un solo archivo, `vector-rag.dto.ts`, con los cuerpos de entrada, las respuestas y los anidados
(`EmbeddedDocumentDto`, `EmbeddedChunkDto`, `CandidateInputDto`, `EvidenceInputDto`).

## Todo lo redactado llega redactado

`chunkTextRedacted`, `queryTextRedacted`, `quotedTextRedacted` y `commentRedacted` se llaman así a
propósito. El nombre del campo es el contrato: **aquí no entra el texto original**. Quien redacta es
el worker, antes de llamar; este módulo persiste lo que recibe y no puede comprobar que esté
efectivamente redactado, así que lo mínimo es que el nombre no deje dudas sobre qué se espera.

El original vive en el object storage. Aquí sólo entra lo que puede indexarse.

## Lo que el cliente no puede decidir

- **`dimension` y `distanceMetric` de la colección.** No están en `CreateCollectionDto`: salen del
  modelo. El vector que produce un modelo tiene la dimensión que tiene.
- **`sourceVersionId` de una cita.** No está en `EvidenceInputDto`: se copia del documento. Si el
  llamante pudiera declararla, podría citar una versión que dice lo contrario de la que leyó.
- **`citationNumber`.** Se numera desde uno en el orden en que llegan las citas.
- **`authorizationDecision` y `selected`.** Los decide `decide()`, no la petición. Es la razón de ser
  del caso de uso.
- **Los estados** (`lifecycleState` de documentos y embeddings, `status` de jobs y sesiones,
  `state` de políticas y bindings). El único que se acepta por petición es
  `UpdateCollectionLifecycleDto.lifecycleState`, y es porque cambiarlo *es* la operación.

## Topes en el propio DTO

`@ArrayMaxSize` en los cuatro colectivos: chunks por documento (`MAX_CHUNKS_PER_BATCH`), candidatos
(`MAX_CANDIDATES`) y citas (`MAX_EVIDENCE`). Rechazar en la validación cuesta menos que rechazar
después de deserializar quinientos vectores.

`@ArrayMinSize(1)` en todos: un job sin documentos, una búsqueda sin candidatos o una evidencia sin
citas no son la operación, son ruido.

## `embedding` como cadena

`EmbeddedChunkDto.embedding` es `@IsString()`, no un array de números. pgvector recibe y devuelve el
vector en su formato textual (`[0.1,0.2,…]`), y convertirlo a `number[]` aquí para volver a
serializarlo en el repositorio sólo añadiría una pérdida de precisión en el camino.

## `sourceScope`, `metadata` y demás `jsonb`

Validados sólo con `@IsObject()`. Son `jsonb` sin forma declarada en el modelo: el alcance de un job
depende de qué se esté embebiendo, y imponer una estructura aquí sería inventar el contrato.

## Rangos

`dimension` lleva `@Min(1) @Max(16000)`: una dimensión de cero o negativa no es un modelo mal
configurado sino imposible, y el tope superior es holgado respecto a cualquier modelo real.

`relevanceScore` va de 0 a 5; `batchSize` del borrado, de 1 a 1000.

## `principalType` y las listas cerradas

`allowedPrincipalTypes` usa `@IsIn(PRINCIPAL_TYPES, { each: true })`. Una política que permite un
tipo de principal que no existe es una política que no filtra lo que cree filtrar.

Lo mismo con `distanceMetric`, `jobType`, `feedbackType`, `deletionReason` y `lifecycleState`.

`allowedPurposeCodes` y `allowedSecurityLabels`, en cambio, son `@IsString({ each: true })` libres:
sus catálogos son de `terminology` y de la política de seguridad del despliegue, no de este módulo.

## Respuestas

`duplicate` aparece en tres (`EmbeddingJobResponseDto`, `RetrievalSessionResponseDto`) y
`RunEmbeddingJobResponseDto` tiene `chunksSkipped`: en todos los casos la operación pudo hacer dos
cosas distintas, y devolver `2xx` sin decir cuál dejaría al llamante adivinando si tiene que
reintentar.

`RankCandidatesResponseDto.deniedByReason` es el resumen de por qué la respuesta salió corta. Es lo
que convierte "faltan documentos" en "faltan tres por consentimiento y uno por etiqueta".

`DeletionResponseDto.verified` es la prueba de borrado que el módulo 62 espera para cerrar la
solicitud.
