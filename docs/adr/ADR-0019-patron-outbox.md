# ADR-0019: Patrón outbox transaccional propio

## Estado
Aceptado.

## Contexto
Publicar un evento de dominio y persistir el cambio que lo origina deben ser atómicos: si el
cambio se guarda pero el evento no se publica (o viceversa), otros dominios divergen del estado
real. Ver [ADR-0007](ADR-0007-eventos-sin-broker-externo.md) para la decisión de no usar un
broker externo.

## Fuerzas y restricciones
- Sin broker externo, la atomicidad debe lograrse dentro de PostgreSQL.
- 20 workers necesitan un contrato estable de "qué reclamar" y "qué reconocer" sin colisionar
  entre réplicas del mismo worker.

## Opciones consideradas
Publicar el evento después del commit (con riesgo de pérdida si el proceso muere entre ambos)
vs. outbox transaccional (evento y cambio en el mismo commit, entrega desacoplada): el código
implementa la segunda.

## Decisión
`OutboxService.publishDomainEvent()` escribe el evento en `messaging.message_queues` **dentro de
la misma transacción** que el cambio de dominio que lo origina. `worker-messaging` reclama
(`POST /internal/queues/:code/claim`), despacha (`POST /internal/events/:id/dispatch`) y procesa
el acuse (`POST /internal/event-deliveries/:id/ack`) de forma desacoplada y asíncrona.

## Consecuencias positivas
- Cero pérdida de eventos por fallo entre "guardar cambio" y "publicar evento" — son la misma
  operación atómica.
- El reclamo (`claim`) por código de cola permite que múltiples instancias de `worker-messaging`
  se repartan el trabajo sin colisionar (mecanismo de reclamo exclusivo, no verificado a nivel de
  implementación exacta en esta fase — ver Fase 12 para el detalle del mecanismo de lock).

## Consecuencias negativas
- La tabla de outbox crece con cada evento hasta que se despacha y reconoce — requiere una
  estrategia de purga/archivado no verificada en esta fase.
- Latencia de entrega depende del intervalo de tick de `worker-messaging`, no es push en tiempo
  real.

## Riesgos
Sin política de purga/archivado documentada para `messaging.message_queues` — candidato a
`docs/data/retention.md` (Fase 11).

## Evidencia
`src/modules/messaging/services/outbox.service.ts` (`publishDomainEvent`, 79 usos según
[graphify-audit.md](../reports/graphify-audit.md)), rutas `/internal/queues/*`,
`/internal/events/*`, `/internal/event-deliveries/*` en `openapi/openapi.yaml`.

## Plan de revisión
Documentar el mecanismo de reclamo exclusivo y la política de retención en Fase 11-12.
