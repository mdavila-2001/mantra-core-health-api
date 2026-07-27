# Servicios de laboratorio de pruebas

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `QaCatalogService` | 01, 02, 03, 11 | Entornos, casos con aserciones, publicación y programación |
| `QaRunsService` | 04 … 10, 12 | Corridas, captura, evaluación, cierre, defectos y release |

## Reglas de negocio

- **Entorno (01)**: código único. Un entorno de producción no puede declararse seguro para capturar
  payloads.
- **Caso (02)**: código único en la suite, ordinal continuando los existentes, y aserciones
  validadas —ruta en `JSON_PATH`, valor esperado salvo con `EXISTS`—. Nace en borrador.
- **Publicación (03)**: activa los casos en borrador y sube la versión de la suite. Una suite sin
  casos no se publica.
- **Corrida (04)**: exige suite publicada y entorno activo, respeta la política de concurrencia y
  deriva el total de casos de los activos.
- **Captura (05)**: guarda petición y respuesta con su hash y mueve la corrida a `running`. El mismo
  caso no se captura dos veces en la misma corrida, ni se captura en una corrida cerrada.
- **Evaluación (06)**: consolida el veredicto de cada aserción, fija el estado del caso y devuelve
  la firma del fallo. Un fallo de transporte no se evalúa.
- **Cierre (07)**: agrega los resultados, calcula omitidos y duración, y decide el estado de la
  corrida. Cerrar dos veces se rechaza.
- **Artefacto (08)**: el resultado al que se ancla, si se indica, debe ser de la misma corrida.
- **Defecto (09)**: deduplica por firma; reabre el que estaba resuelto o cerrado.
- **Triage (10)**: valida la transición y exige responsable para pasar a en curso.
- **Release (12)**: sólo sobre corrida `passed` con evidencia; sella con hash de los artefactos.

## Enmascarado de payloads

Cuando el entorno **no** es `isProductionSafe`, el cuerpo se guarda con sus valores sustituidos y su
estructura intacta:

```
{ "patientId": "abc", "items": [1, 2] }  →  { "patientId": "***", "items": ["***", "***"] }
```

Conservar las claves es lo que permite diagnosticar (qué campos viajaron, si faltaba alguno) sin
conservar el contenido. El **hash se calcula sobre el cuerpo original**: la evidencia sigue sirviendo
para comprobar contra qué se ejecutó, aunque el cuerpo guardado esté enmascarado.

## Firma del fallo

De la evaluación sale un hash de `(caso, ordinales de las aserciones que fallaron)`. Dos corridas
donde falla lo mismo producen la misma firma, y por eso el defecto se deduplica en vez de
multiplicarse. Que la firma **no** incluya la corrida ni la fecha es justamente lo que la hace útil.

## Transiciones del defecto

| Desde | Hacia |
| --- | --- |
| `OPEN` | `TRIAGED`, `REJECTED` |
| `TRIAGED` | `IN_PROGRESS`, `REJECTED` |
| `IN_PROGRESS` | `RESOLVED`, `TRIAGED` |
| `RESOLVED` | `CLOSED`, `IN_PROGRESS` |
| `CLOSED`, `REJECTED` | — |

Repetir el estado actual se admite (permite reclasificar gravedad o reasignar sin mover el flujo).
Reabrir un cerrado no: si el fallo vuelve a verse, lo reabre `registerDefect`, con la evidencia
delante.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `QaRunsService` usa
`QaCatalogRepository` para leer suite, entorno, caso y aserciones: son lecturas de validación y de
evaluación, no escrituras cruzadas.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidos el alta del caso con sus aserciones y la
publicación de la suite entera. `FOR UPDATE` sobre suite, corrida, resultado y defecto; los casos de
la suite se bloquean como colección al publicar; `row_version` aporta bloqueo optimista.

## Excepciones

`ResourceNotFoundException` (entorno, suite, caso, corrida, resultado o defecto inexistente),
`PreconditionFailedException` (producción declarada segura, aserción incompleta, suite sin casos o
sin publicar, entorno inactivo, caso de otra suite, fallo de transporte sin evaluar, transición no
permitida, defecto en curso sin responsable, corrida que no pasó o sin evidencia) y
`ConflictException` (código duplicado, corrida concurrente prohibida, caso ya ejecutado, resultado ya
evaluado, corrida ya cerrada).

## Logs

`operation: 'qa.<área>.<acción>'`. `warn` cuando una corrida termina con fallos. Nunca se loguean
payloads ni valores capturados.

## Pruebas

`qa-catalog.service.spec.ts` (20) y `qa-runs.service.spec.ts` (38): rechazo de producción segura,
validación de aserciones, activación en bloque al publicar, numeración secuencial, enmascarado con
hash del original, consolidación de totales con omitidos, deduplicación y reapertura de defectos,
transiciones de triage y sello de evidencia.
