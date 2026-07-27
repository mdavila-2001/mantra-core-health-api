# DTOs — graph_intelligence

Un solo archivo, `graph-intelligence.dto.ts`, con los cuerpos de entrada, las respuestas y los
anidados (`NodeIdentifierDto`, `EdgeEvidenceDto`, `CommunityInputDto`, `RiskScoreInputDto`,
`RuleMatchDto`).

## El identificador viaja hasheado, y el nombre lo dice

`NodeIdentifierDto.identifierValueHash` — no `identifierValue`. El grafo indexa relaciones, no
documentos de identidad; el nombre del campo es el contrato de que aquí **no entra** un DNI en claro.

Lo mismo con `displayLabelRedacted`, `explanationRedacted` y `quotedTextRedacted`: quien redacta es
el worker, antes de llamar.

## Lo que el cliente no puede decidir

- **`confidenceScore` de la arista.** No está en `UpsertEdgeDto`: se calcula desde la evidencia. Si
  se pudiera declarar, se podría afirmar una relación con confianza 1 sin nada que la respalde.
- **`lifecycleState`** de nodos y aristas. Lo pone el servicio.
- **`status` de la corrida y del job de borrado.**
- **`detectedAt`, `resolvedAt`, `calculatedAt`, `expiresAt`, `verifiedAt`.** Todas son marcas del
  servidor; aceptarlas por la petición permitiría fechar un hallazgo antes de que ocurriera.

`TriageRuleHitDto.status` sí se acepta: cambiarlo *es* la operación. La transición se valida en el
servicio contra `HIT_TRANSITIONS`.

## `sourceVersion` y los contadores como cadena

`sourceVersion`, `sourceCheckpoint`, `nodesWritten` y `edgesWritten` corresponden a `bigint` y se
validan con `@IsNumberString({ no_symbols: true })`. Por encima de 2^53 un `number` pierde precisión,
y aquí la precisión decide si un evento se considera viejo — que es justo la guarda que protege la
proyección de los eventos fuera de orden.

En los DTOs de avance, `nodesWritten` y `edgesWritten` sí son `@IsInt()`: son el **incremento** de un
lote, acotado por `MAX_PROJECTION_BATCH`, no el acumulado.

## Rangos con significado

`confidenceDelta` va de −1 a 1: un delta fuera de ese rango no ajusta una confianza acotada a
`[0,1]`, la fuerza.

`ExpireEdgeDto.confidenceDelta` va de −1 a **0**: cerrar una relación no puede subir la confianza en
ella.

`maxHops` va de 1 a `MAX_HOPS_CEILING` (6). Un traversal sin tope sobre un grafo de referidos recorre
media red en cuanto encuentra un nodo muy conectado; el tope del DTO es el suelo, y el del alcance
puede ser más estricto.

`score` de comunidades y riesgo va de 0 a 1.

## `FindPathDto extends TraverseDto`

Una ruta es un recorrido con destino. Heredar evita repetir las seis validaciones del scoping y, más
importante, garantiza que las dos operaciones exijan exactamente lo mismo: si mañana el alcance pide
un campo más, las dos lo piden.

## Los arrays del alcance

`allowedNodeTypes`, `allowedRelationshipTypes` y `purposeOfUseCodes` llevan `@ArrayMinSize(1)`. Un
alcance que no permite ningún tipo de nodo no restringe: impide todo, y declararlo así es casi
siempre un error de configuración que conviene rechazar en la puerta.

En `UpdateAccessScopeDto` los tres son opcionales pero conservan el `@ArrayMinSize(1)`: si se envían,
no pueden venir vacíos.

## Respuestas

`stale` (nodo y reconciliación), `alreadyRunning` (corrida), `alreadyClosed` (arista), `unchanged`
(hallazgo) y `duplicate` (borrado) existen porque en todos esos casos la operación pudo no hacer
nada, y devolver `2xx` sin decirlo dejaría al worker sin saber si tiene que reintentar.

`RankedCandidate`-equivalente aquí es `deniedByReason` del módulo 59; en éste, el resumen de lo que
pasó son los contadores de `GraphDeletionResponseDto`: `nodesDeleted`, `edgesDeleted`,
`identifiersDeleted`, `riskScoresDeleted`, `communitiesUpdated` e `invalidatedPaths`. Los seis
juntos son la prueba de borrado que el módulo 62 espera.
