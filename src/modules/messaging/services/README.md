# Servicios de mensajería

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción** — con una
excepción deliberada, que es justo la que da sentido al módulo.

## Servicios

- **`OutboxService`** (UC-35-01 … 04) — publicación transaccional, relay y fan-out.
- **`QueuesService`** (UC-35-05 … 09) — encolado, reclamo, cierre, reintento y cola muerta.
- **`NotificationsService`** (UC-35-10 … 13) — solicitud, entrega, acuses y bandeja in-app.

## La excepción: `publishDomainEvent()` no abre transacción

Todos los demás métodos del proyecto empiezan con `this.em.transactional(...)`. Éste **no**: recibe
el `EntityManager` del llamante y se enlista en su transacción.

No es un descuido, es el patrón entero. Si abriera la suya podrían pasar dos cosas malas: que el
evento se confirme y el cambio de negocio se deshaga —publicando un hecho que nunca ocurrió— o al
revés. Enlistándose, ambos se confirman juntos o no se confirma ninguno.

La prueba `never opens its own transaction` existe para que nadie lo "arregle" añadiéndole una.

## Reglas de negocio

### Outbox

- **Publicación (01)**: clave de idempotencia declarada o derivada del contenido; si ya existe se
  devuelve la publicación previa sin escribir nada.
- **Relay (02)**: lote con `SKIP LOCKED`; cada mensaje suma un intento; si supera `max_attempts`
  queda terminal, si no pasa a publicado. El lock se libera al terminar el lote.
- **Despacho (03)**: exige que el relay ya lo haya publicado —repartir antes adelantaría el evento a
  consumidores que todavía podrían ver deshecho el cambio—; una entrega por suscripción que case con
  el filtro; encola job si la suscripción es de modo cola y su cola destino está activa.
- **Acuse (04)**: sólo sobre entregas despachadas o en reintento; un acuse fallido debe declarar qué
  falló.

### Colas

- **Encolado (05)**: cola activa; la clave de deduplicación devuelve el job existente en lugar de
  crear otro.
- **Reclamo (06)**: cola activa; lote con `SKIP LOCKED` por prioridad y antigüedad; reserva por
  worker con el tiempo de visibilidad de la cola.
- **Cierre (07)** y **fallo (08)**: el job debe estar en ejecución **y** reservado por ese worker.
  Al fallar: backoff exponencial si le quedan intentos, cola muerta si los agotó.
- **Redrive (09)**: cola destino activa; idempotente por entrada de cola muerta.

### Notificaciones

- **Solicitud (10)**: destinatario o dirección; canal activo; plantilla publicada y del mismo canal;
  rebote antes que nada; opt-in y horas de silencio deciden si sale o queda suprimida.
- **Entrega (11)**: solicitud pendiente o enviando —nunca suprimida—; configuración de proveedor
  activa; número de intento derivado de los ya registrados; el canal in-app escribe en la bandeja.
- **Acuse (12)**: entrega localizada por referencia de mensaje; idempotente por tipo; sólo el rebote
  cierra la solicitud como fallida.
- **Lectura (13)**: sólo el destinatario; conserva la primera lectura.

## Backoff

`OutboxService.backoffSeconds(attempts)` es exponencial con base 5 s y techo de 1 h. Está en un solo
sitio y lo usan tanto el relay como las colas: dos curvas distintas darían tiempos incomparables
entre sí al depurar.

## Horas de silencio

Se declaran como `{ start: "22:00", end: "07:00" }` en UTC. El rango que cruza la medianoche se
interpreta como tal — es el caso habitual, y el que se rompe si se compara ingenuamente contra un
intervalo cerrado.

## Filtro de suscripción

Comparación de igualdad campo a campo contra el payload del evento. El caso de uso no declara nada
más rico y no se inventa un lenguaje de expresiones; sin filtro, la suscripción recibe todo lo de su
tipo y versión.

## Dependencias

`EntityManager`, sus repositorios y `PinoLogger`. `OutboxService` inyecta además `QueuesRepository`
—no `QueuesService`— para encolar el trabajo del suscriptor: llamar a otro servicio repartiría la
transacción entre dos dueños.

## Excepciones

`ResourceNotFoundException` (evento, entrega, cola, job, entrada de cola muerta, canal, plantilla,
solicitud, proveedor o notificación desconocidos) y `PreconditionFailedException` (evento sin
publicar, entrega ya resuelta, acuse fallido sin motivo, cola o canal inactivos, job fuera de
ejecución o reservado por otro worker, notificación suprimida, canal sin proveedor activo, in-app de
otro destinatario).

`ConflictException` no aparece: aquí lo repetido **no es un error**. Un productor que reintenta, un
worker que reenvía o un proveedor que reentrega su webhook obtienen la respuesta anterior con
`duplicate: true`. Devolverles un 409 les haría tratar como fallo algo que salió bien.

## Logs

`operation: 'messaging.<área>.<acción>'`. `warn` en outbox agotado, entrega de evento fallida, cola
destino inactiva, job a cola muerta, redrive, notificación suprimida, intento fallido y rebote. No se
loguea el contenido de las notificaciones.

## Pruebas

- `outbox.service.spec.ts` (23): que no abre transacción propia, clave derivada estable, publicación
  duplicada, lote publicado y agotado, filtro de suscripción, fan-out idempotente, encolado del
  suscriptor y curva de backoff.
- `queues.service.spec.ts` (26): deduplicación, reserva por worker, cierre por worker ajeno, backoff
  frente a cola muerta, destino declarado de cola muerta y redrive idempotente.
- `notifications.service.spec.ts` (21): supresión por opt-in y por horas de silencio —incluido el
  rango que cruza medianoche—, rebote, numeración de intentos, bandeja in-app, los tres tipos de
  acuse y conservación de la primera lectura.
