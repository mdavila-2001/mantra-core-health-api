# Servicios de contexto de salud

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

Dos, uno por mitad del flujo:

- **`ContextCollectionService`** (UC-44-01 … 03, 05, 06, 10) — agentes, fuentes, programaciones,
  corridas y observaciones. Lo que ejecuta el worker recolector.
- **`CountryContextService`** (UC-44-04, 07 … 09, 11, 12) — contextos, versiones con hechos y
  evidencia, revisión, publicación, retiro y resolución. Lo que gobierna el curador.

Comparten repositorio y nada más: recolectar es continuo y automático; publicar es puntual y humano.

## Reglas de negocio

### Recolección

- **Agente (01)** y **fuente (02)**: código único, nacen activos. La fuente registra su licencia y
  su nivel de confianza, que es lo que gobierna qué observaciones se aceptan.
- **Programación (03)**: agente activo y expresión cron de cinco campos.
- **Corrida (05)**: idempotente por clave. Con programación, hereda su agente y su país y adelanta
  `next_run_at`; sin ella, debe declarar ambos. El agente debe estar activo.
- **Observación (06)**: corrida en curso, fuente activa, dedupe por hash dentro de la corrida. Sube
  los contadores del run al vuelo, contando aceptadas y rechazadas por separado.
- **Cierre (10)**: sólo una vez —la corrida no se reabre—; los contadores se **reconcilian**
  recontando la tabla; una corrida fallida debe declarar el error; una que no falló sella
  `last_success_at` en su programación.

### Publicación

- **Contexto (04)**: único por país + dominio + clave; nace en borrador.
- **Versión (07)**: número correlativo; la corrida debe ser del mismo país y estar en curso o
  correcta; claves de hecho sin repetir; **cada evidencia debe apuntar a una observación aceptada de
  esa corrida**. La versión nace en borrador y no toca `current_version_id`.
- **Revisión (08)**: sólo sobre borrador; el desenlace mueve la versión a aprobada o rechazada. La
  firma quien corresponde: el agente si es automática, el actor si es humana.
- **Publicación (09)**: sólo lo aprobado; supersede a la publicada anterior, sella `effective_from`
  si no lo tenía, y deja el contexto activo apuntando a ella.
- **Retiro (11)**: sólo sobre publicada. Con reemplazo —que debe ser del mismo contexto y estar
  aprobado— éste pasa a publicado y el contexto sigue activo; sin reemplazo la versión caduca y el
  contexto queda obsoleto.
- **Resolución (12)**: exige contexto con versión vigente publicada; devuelve el payload, los hechos
  y las observaciones que respaldan cada uno, con `stale: true` si la versión ya caducó.

## Por qué la evidencia se valida contra la corrida

`draftVersion` carga las observaciones **aceptadas** del run y comprueba cada enlace contra ese
conjunto. Dos cosas quedan cerradas de una vez: que la evidencia no venga de otra recolección, y que
no se respalde un hecho con una observación que el propio recolector marcó como rechazada. Sin esa
comprobación, la trazabilidad seguiría existiendo en la tabla pero no significaría nada.

## Contadores de la corrida

`observations_read/accepted/rejected` son `bigint` y viajan como cadena: se suman con `BigInt` para
que una recolección larga no pierda precisión. Se llevan al vuelo para dar progreso visible, y al
cerrar se sustituyen por el recuento real de la tabla — que es el que queda en el histórico.

## Hash del payload

`contentHash()` canoniza antes de hashear: ordena las claves de cada objeto y descarta las
`undefined`. Así el hash identifica el contenido y no el orden con que se serializó.

## Validación del cron

`assertCronExpression()` comprueba la **forma** —cinco campos separados por espacios—, no la
semántica. Interpretarlo es del scheduler, pero una expresión que ni siquiera tiene la forma correcta
no llegaría nunca a ejecutarse, y conviene rechazarla al programar y no la primera noche que no
corrió.

## Dependencias

`EntityManager`, `HealthContextRepository` y `PinoLogger`.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidas las compuestas: observación + contadores;
cierre + conciliación + `last_success_at`; versión + hechos + evidencia; publicación +
supersedimiento + avance del contexto; retiro + promoción del reemplazo. Bloqueos: ver el README de
`repositories/`.

## Excepciones

`ResourceNotFoundException` (agente, fuente, programación, corrida, contexto, versión o reemplazo
desconocidos), `PreconditionFailedException` (agente, fuente o programación inactivos, cron mal
formado, corrida manual sin agente ni país, corrida ya cerrada o de otro país, evidencia fuera de la
corrida, clave de hecho repetida, versión fuera de estado, corrida fallida sin motivo, retiro sin
reemplazo, contexto sin versión vigente) y `ConflictException` (código de agente o fuente repetido,
contexto duplicado, corrida ya cerrada).

## Logs

`operation: 'health-context.<área>.<acción>'`. `warn` en observación rechazada, corrida fallida,
versión rechazada, retiro de versión y resolución de un contexto caducado. No se loguea el payload de
las observaciones ni el del contexto.

## Pruebas

- `context-collection.service.spec.ts` (28): códigos únicos, forma del cron, idempotencia de la
  corrida, herencia desde la programación, corrida manual incompleta, dedupe por hash, contadores al
  vuelo con `BigInt`, conciliación al cerrar y `last_success_at` sólo cuando no falla.
- `country-context.service.spec.ts` (36): unicidad del contexto, numeración de versiones, hash
  estable ante el orden de claves, evidencia fuera de la corrida y sobre observación rechazada,
  firma de la revisión según sea humana o automática, publicación con supersedimiento, sustitución
  frente a caducidad y resolución marcando `stale`.
