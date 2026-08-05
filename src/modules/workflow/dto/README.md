# DTOs — workflow

Un solo archivo, `workflow.dto.ts`: una clase de entrada y una de respuesta por caso de uso, más los
anidados (`StateDefinitionDto`, `TransitionGuardDto`, `TransitionSideEffectDto`,
`WorkflowTaskInputDto`, `TransitionHistoryEntryDto`).

## Lo que el cliente no puede decidir

- **El estado inicial de una instancia** no está en `CreateWorkflowInstanceDto`. Sale del `is_initial`
  de la definición activa. Aceptarlo por el cuerpo permitiría arrancar una instancia en mitad del
  flujo.
- **El estado de destino de una transición** tampoco: lo fija `state_transition_definitions`. El
  llamante envía un *comando*, no un destino; si enviara el destino, el grafo dejaría de ser el que
  manda.
- **Los estados de definición, instancia y tarea** (`DRAFT`, `ACTIVE`, `OPEN`, `ESCALATED`…) los pone
  el servicio desde `CONCEPTS`. Ningún DTO de entrada los acepta.

## Anidados

`DefineStatesDto.states` lleva `@ArrayMinSize(1)`: una llamada que no declara ningún estado no es una
declaración, es ruido. `DefineTransitionDto` lleva `guards[]` y `sideEffects[]`;
`CreateWorkflowInstanceDto` lleva `tasks[]`. Todos con `@ValidateNested({ each: true })` +
`@Type(() => …)`, porque sin `@Type` `class-transformer` deja objetos planos y la validación anidada
no corre.

## `expressionJson`, `actionSpecJson`, `compensationSpecJson`, `contextJson`, `payloadJson`

Validados sólo con `@IsObject()`. Son `jsonb` sin forma declarada en el modelo; imponer aquí una
estructura sería inventar el contrato. La gramática que **sí** interpreta el módulo —la de las
guardas— está documentada en el README del módulo y se aplica en el servicio, donde puede fallar
cerrado con el `failure_code` correcto.

## Query del historial

`QueryTransitionHistoryDto` usa `@Type(() => Number)` en `limit` y `offset`: llegan como texto en la
query string y sin la conversión `@IsInt()` los rechazaría siempre. El `limit` se recorta a 200 en el
servicio, no aquí, para que el tope viva junto a la consulta que lo consume.

## Cabecera, no cuerpo

La clave de idempotencia (UC-32-06) no es un campo de `TriggerTransitionDto`: viaja en la cabecera
`Idempotency-Key`, como la declara el caso de uso. Está documentada con `@ApiHeader` en el
controlador.

## Respuestas

Las `*ResponseDto` devuelven ids, estados y contadores. `TransitionEventResponseDto.duplicate`
distingue una transición aplicada de una clave repetida cuyo resultado previo se está devolviendo —el
llamante necesita saber cuál de las dos cosas pasó—. No se expone `expression_json` de las guardas ni
`action_spec_json` de los efectos.
