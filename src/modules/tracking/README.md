# Módulo 37 — Seguimiento y Trazabilidad de Envíos

Sujetos rastreables con número opaco, envíos, catálogo de hitos esperados, timeline append-only,
webhooks de transportista, traspasos, estimaciones de llegada, prueba de entrega, excepciones y
barrido de compromisos de servicio.

## Casos de uso cubiertos (11)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-37-01 | `POST /tracking/trackable-subjects` | Abrir sujeto y crear envío |
| UC-37-02 | `POST /tracking/milestone-definitions` | Catálogo de hitos esperados |
| UC-37-03 | `POST /tracking/shipments/:id/dispatch` | Despachar envío |
| UC-37-04 | `POST /tracking/trackable-subjects/:id/events` | Evento y avance de hito |
| UC-37-05 | `POST /tracking/webhooks/carriers/:carrierCode` | Webhook del transportista |
| UC-37-06 | `POST /tracking/shipments/:id/handoffs` | Traspaso entre responsables |
| UC-37-07 | `POST /tracking/shipments/:id/eta/recompute` | Estimación de llegada |
| UC-37-08 | `POST /tracking/shipments/:id/delivery-proof` | Prueba de entrega y cierre |
| UC-37-09 | `POST /tracking/shipments/:id/exception` | Excepción o reintento |
| UC-37-10 | `POST /tracking/shipments/:id/cancel` | Cancelar y cerrar |
| UC-37-11 | `POST /tracking/sla/scan` | Detectar incumplimiento de hito |

## Entidades

`trackable_subjects`, `shipments`, `milestone_definitions`, `tracking_events`, `shipment_handoffs`,
`eta_estimates`, `delivery_proofs`. `tracking_carriers` se lee (catálogo de transportistas).

## Flujo general

```
sujeto (open, created) + envío (preparing)
   │
   ├─ dispatch ──> ambos in-transit + evento
   │
   ├─ evento manual ──> estado y hito avanzan; hito terminal ⇒ sujeto closed
   ├─ webhook del transportista ──> mapea el código externo; idempotente
   ├─ handoff ──> nuevo transportista/mensajero responsable + evento
   ├─ eta/recompute ──> estimación append-only; sólo la más reciente pasa al envío
   │
   ├─ delivery-proof ──> envío delivered + sujeto closed + evento
   ├─ exception ──> envío exception|retry + prioridad del sujeto escalada
   └─ cancel ──> envío cancelled + sujeto closed

sla/scan ──> hito siguiente vencido ⇒ evento de incumplimiento + escalada de prioridad
```

## Reglas de negocio

- **El número de seguimiento es opaco**: se genera aleatorio, no derivado de la entidad. Un número
  que dejara deducir qué se transporta o de quién es sería un canal de fuga por sí mismo.
- **Una entidad, un seguimiento abierto**: abrir dos veces la misma referencia produciría dos
  timelines de lo mismo.
- **Un solo hito terminal por tipo de sujeto**: con dos no se sabría cuál cierra el seguimiento.
- **Despachar exige responsable**: sin transportista ni mensajero, el envío sale por la puerta sin
  nadie a quien preguntar.
- **El timeline es append-only**: los eventos se insertan, nunca se corrigen. Alcanzar el hito
  terminal es lo único que cierra el sujeto por sí solo.
- **El webhook es idempotente** por `carrierCode:externalEventId`. Los transportistas reentregan, y
  el timeline no debe duplicarse por eso.
- **Un código externo que no se reconoce se registra como excepción**, con `warn`: inventar un
  estado sería peor que declarar que no se entendió.
- **Un webhook tardío no revive un envío cerrado**: el envío sigue al sujeto sólo mientras está vivo.
- **La estimación es histórica**: se conservan todas y sólo la más reciente pasa al envío, para que
  una estimación vieja llegando tarde no pise a la que ya la sustituyó.
- **La prueba de entrega debe acreditar algo**: una firma sin archivo de firma, o una foto sin foto,
  no prueban nada. Entregar cierra el envío y el sujeto en la misma transacción.
- **Una excepción sube la prioridad del sujeto**: una entrega que falló necesita atención antes que
  una que va bien. El intento fallido puede dejar constancia fotográfica, igual que la entrega.
- **Un envío entregado no se cancela**: reescribiría lo ocurrido.
- **El SLA se mide contra el hito siguiente al alcanzado**, que es el que se está incumpliendo ahora,
  y contra el último movimiento del sujeto.

## Permisos

`TRACKING_ADMIN` cubre el módulo y es el único que define el catálogo de hitos. `LOGISTICS_OPERATOR`
abre sujetos, despacha, traspasa, cancela y registra eventos. `COURIER` registra eventos, traspasos,
entregas y excepciones desde la calle. `SYSTEM` recalcula estimaciones y corre el barrido de SLA.

`POST /tracking/webhooks/carriers/:carrierCode` es **público**: el transportista es un tercero sin
sesión en el sistema.

## Concurrencia

`FOR UPDATE` sobre el sujeto (es el agregado del timeline) y sobre el envío en toda operación que
los mueva. `FOR UPDATE SKIP LOCKED` en el barrido de SLA, que procesa por lotes y no debe esperar a
otra pasada. `row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'tracking.<área>.<acción>'`. Nivel `warn` ante un código de transportista sin mapear,
una excepción de envío, una cancelación y los incumplimientos detectados en el barrido. Nunca se
loguea qué se transporta ni datos del destinatario.

## Pruebas

`yarn test --testPathPatterns=tracking` — 45 pruebas de servicio + delegación del controlador.

## Pendiente

- **Firma del webhook**: la ruta es pública y hoy sólo valida que el código de transportista exista.
  La verificación de firma HMAC del proveedor corresponde al conector de integraciones (módulo 12),
  que es quien guarda el secreto.
- **Geolocalización**: `location_ping_id` se acepta si llega, pero los pings viven en `geo` y los
  produce el módulo de localización. `tracked_subject_id` del envío se poblará con esa integración.
- **Cálculo del ETA**: el módulo registra y aplica la estimación, pero no la calcula. El motor
  —distancia, tráfico o dato del transportista— vive fuera y llama a este endpoint.
- **Reprogramación del reintento**: `retry_scheduled` marca el estado; agendar el nuevo intento
  pertenece al planificador.
- **Outbox**: `SubjectOpened`, `ShipmentDispatched`, `ShipmentDelivered`, `SlaBreached` se emitirán
  cuando exista el módulo 35.
