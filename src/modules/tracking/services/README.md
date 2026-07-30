# Servicios de seguimiento

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicio

Un solo servicio, `TrackingService`, cubre los 11 casos de uso. El módulo tiene un único agregado
—el sujeto rastreable— y todas las operaciones lo mueven; separarlas obligaría a que cada mitad
cargara el mismo estado.

## Reglas de negocio

- **Apertura (01)**: número de seguimiento opaco, una entidad un seguimiento abierto, transportista
  activo si se indica.
- **Hitos (02)**: un solo terminal por tipo de sujeto, ordinal continuando los existentes, códigos
  repetidos omitidos.
- **Despacho (03)**: sólo desde `preparing`, exige responsable, mueve envío y sujeto a `in-transit`
  y deja evento.
- **Evento (04)**: no se registra sobre sujeto cerrado; el hito, si se indica, debe existir para el
  tipo de sujeto; el terminal cierra el sujeto.
- **Webhook (05)**: idempotente por referencia externa; mapea el código, y lo desconocido va a
  excepción; el envío sigue al sujeto sólo si sigue vivo.
- **Traspaso (06)**: sólo sobre envío vivo; el nuevo transportista debe estar activo; actualiza quién
  responde y deja evento.
- **ETA (07)**: sólo sobre envío vivo; la estimación se guarda siempre y se aplica sólo si es la más
  reciente.
- **Entrega (08)**: la prueba debe acreditar (firma o foto); cierra envío y sujeto, y marca el hito
  terminal si el catálogo lo define.
- **Excepción (09)**: sólo sobre envío vivo; escala la prioridad y puede dejar constancia del intento
  fallido.
- **Cancelación (10)**: no sobre entregado ni sobre ya cancelado; cierra el sujeto.
- **SLA (11)**: mide el hito siguiente al alcanzado contra el último movimiento del sujeto.

## Mapeo del código del transportista

`EXTERNAL_STATUS_MAP` traduce el vocabulario del transportista al del modelo:

| Código externo | Estado |
| --- | --- |
| `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY` | En tránsito |
| `DELIVERED` | Entregado |
| `EXCEPTION`, `RETURNED` | Excepción |
| `CANCELLED` | Cancelado |

Lo que no está en la tabla **no se adivina**: se registra como excepción y se deja `warn`. Un
estado inventado sería peor que uno declarado como no entendido, porque nadie iría a mirarlo.

## Cómo se elige el hito del SLA

`nextPendingMilestone` devuelve el **siguiente** al actual por ordinal, o el primero si el sujeto no
ha alcanzado ninguno. Es el hito que se está incumpliendo ahora; medir contra el ya alcanzado
marcaría como vencido algo que ya se cumplió.

El plazo se cuenta desde `updated_at` del sujeto —su último movimiento—, no desde la apertura: lo
que se compromete es el tiempo entre hitos.

## Escalada de prioridad

`normal → high → critical`, y en crítica ya no sube. La usan la excepción y el barrido de SLA, y por
eso está en un solo sitio: dos escaleras distintas darían prioridades incomparables entre sí.

## Dependencias

`EntityManager`, `TrackingRepository` y `PinoLogger`. El webhook no recibe actor: quien lo llama es
el transportista, no un usuario, y por eso sus escrituras van con `touch(entity, undefined)`.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluida la apertura completa (sujeto + envío). `FOR
UPDATE` sobre sujeto y envío en todo lo que los mueva; `FOR UPDATE SKIP LOCKED` en el barrido;
`row_version` aporta bloqueo optimista.

## Excepciones

`ResourceNotFoundException` (sujeto, envío, transportista, hito o número de seguimiento
desconocido), `PreconditionFailedException` (transportista inactivo, despacho sin responsable, envío
fuera de estado, sujeto cerrado, dos hitos terminales en la misma petición, prueba sin archivo) y
`ConflictException` (seguimiento ya abierto, terminal ya existente, envío ya entregado o cancelado,
prueba ya verificada, imposible generar número libre).

## Logs

`operation: 'tracking.<área>.<acción>'`. `warn` ante código sin mapear, excepción, cancelación e
incumplimientos del barrido. Nunca se loguea qué se transporta ni datos del destinatario.

## Pruebas

`tracking.service.spec.ts` (45): opacidad del número, un seguimiento por entidad, único hito
terminal, idempotencia del webhook, código sin mapear como excepción, webhook tardío sobre envío
cerrado, aplicación condicional del ETA, acreditación de la entrega, escalada de prioridad y
elección del hito en el barrido de SLA.
