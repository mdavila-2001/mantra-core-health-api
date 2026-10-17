# Catálogo de flujos

Cada recorrido del usuario es un **árbol de decisión** en un artefacto JSON versionado:
`catalog/<id>.flow.json`, donde `<id>` es el número del proceso en el
Registro de procesos de la bóveda (`SALUD/📋 Registro de procesos por módulo.md`)
(`1.3`, `2.6`, `2.7`). El id **no se renumera**.

Hoy hay tres: `1.3` Agendar hora, `2.6` Consulta y ficha, `2.7` Facturación de la consulta.

## Forma

- **Nodos** (`nodes[]`): `SCREEN` (pantalla), `API_CALL` (llamada a la API), `DECISION`
  (bifurcación del negocio, no llama a nada) y `OUTCOME` (resultado final).
- **Ramas** (`branches[]`): usan el vocabulario de `qa_lab` (`caseType`):
  `HAPPY_PATH` = válido, `EDGE` = límite, `NEGATIVE` = inválido.
- `next` sigue el recorrido; `loopsTo` es un reintento (no cuenta como ciclo).
- `endpoint` es la plantilla del contrato (`/scheduling/slots/{id}/holds`), la de `openapi.json`.
- `gap` reemplaza a `endpoint` cuando la fuente pide un paso que el contrato **no tiene**.
- `sourceRef` dice en qué ítem del Registro se apoya el nodo.
- `openQuestions` guarda lo que la fuente deja sin definir o que depende de una decisión que no es del equipo.

El formato lo describe `flow.schema.json`; las reglas de coherencia, `domain/flow-catalog.ts`.

## Reglas de oficio

1. **No se inventa un paso.** Si el proceso no lo dice, no existe. Si lo dice y el sistema no lo tiene, es un `gap`.
2. **Una rama sin caso de prueba dice por qué** (`reason`). «Sin correr» sin razón no es válido.
3. **El estado esperado de un caso es observado**: `observedOn` es el día en que se ejerció contra una API real.
   No se escribe un 200 «porque debería».
4. **Un caso usa una ruta concreta** con valores fijos que no existen (`00000000-0000-4000-8000-0000000000aa`),
   nunca datos de una persona.
5. **La credencial nunca está en el artefacto**: el runner usa la del destino aprobado, y por eso un caso «sin token»
   no se puede expresar (el runner siempre la envía). Esas ramas llevan `reason`.
6. Los casos con identificadores producidos por un paso anterior (journeys con variable) quedan con `reason`
   hasta que el runner encadene respuestas.

## Cómo se une con `qa_lab`

- Suite: `FLOW-<id>`. Caso: `FLOW-<id>-<nodo>-<TIPO>-<nn>`; `nn` cuenta las ramas del mismo tipo dentro del
  nodo, así que **se agregan ramas al final** (reordenar renumera).
- El runner (M68) lee sólo `setup_json.request.{body,headers}` y el método, la ruta y el estado esperado del caso;
  `setup_json.flow` es informativo.
- El contrato `DECLARED`/`MISSING` de cada nodo se calcula al leer, contra las rutas que la API tiene montadas.

## Agregar un flujo

1. Crear `catalog/<id>.flow.json` citando la fuente.
2. Registrarlo en `index.ts`.
3. `yarn test src/modules/qa_lab/domain/flow-catalog.spec.ts`: valida la forma, que no haya ciclos ni nodos
   sueltos, y que cada endpoint exista en `openapi/openapi.json`.
4. Ejercer cada `qaCase` contra una API real y anotar la fecha en `observedOn`.
