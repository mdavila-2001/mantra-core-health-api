# ADR-0007: Eventos y colas — sin broker de mensajería externo

## Estado
Aceptado.

## Contexto
Varios flujos de negocio requieren procesamiento asíncrono desacoplado del request HTTP:
notificaciones, reconciliación entre almacenes, reportes periódicos, expiración de recursos con
TTL.

## Fuerzas y restricciones
- Necesidad de que un evento de dominio y el cambio de datos que lo origina sean atómicos (misma
  transacción) — evita el problema clásico de "escribí en la base pero el broker se cayó antes de
  publicar".
- 17 dominios con necesidad de trabajo asíncrono, pero no throughput de mensajería masiva (no hay
  evidencia en el código de un caso de uso de streaming de alto volumen).
- Simplicidad operativa: un motor de datos menos que desplegar y monitorear (Kafka/RabbitMQ no
  están en `package.json`).

## Opciones consideradas
Broker dedicado (Kafka, RabbitMQ, NATS) vs. outbox transaccional sobre el RDBMS existente: el
código implementa outbox sobre PostgreSQL (`messaging.message_queues`), sin broker externo.

## Decisión
Sin broker de mensajería externo. La comunicación asíncrona entre dominios usa un patrón outbox
transaccional propio sobre PostgreSQL — ver [ADR-0019](ADR-0019-patron-outbox.md) para el
mecanismo específico.

## Consecuencias positivas
- Atomicidad real entre el cambio de dominio y la publicación del evento (misma transacción SQL).
- Un motor de datos menos en la infraestructura (`docker-compose.yml` no tiene Kafka/RabbitMQ).

## Consecuencias negativas
- El throughput y la semántica de entrega dependen de cuánto pueda escalar PostgreSQL como cola —
  no es el diseño correcto si el volumen de eventos crece órdenes de magnitud.
- Sin las garantías de un broker maduro (particionamiento, replay por offset, consumer groups
  nativos) — hay que construirlas a mano si se necesitan.

## Riesgos
Si el volumen de eventos supera la capacidad de PostgreSQL como cola, este ADR debe revisarse —
no hay evidencia en esta fase de que eso esté ocurriendo.

## Evidencia
`package.json` (sin `kafkajs`/`amqplib`/`bullmq`), `src/modules/messaging/`,
[mapa de integraciones](../architecture/integration-map.md) §2.

## Plan de revisión
Revisar si el volumen real de eventos (medido en Fase 14, observabilidad) se acerca a los
límites prácticos de una cola sobre PostgreSQL.
