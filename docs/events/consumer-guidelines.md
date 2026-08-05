# Guía para consumidores

> Fase 12. Cómo implementar un nuevo suscriptor real dentro de este sistema (no hay consumidores
> HTTP externos documentados en esta fase — el mecanismo de suscripción es interno).

## Antes de suscribirte a un evento

1. Confirma el nombre exacto del evento en el [catálogo de eventos](event-catalog.md) —
   la convención de nombres no es uniforme (`PascalCase` vs. `dot.case`, ver
   [event-catalog.md](event-catalog.md) §"Convención de nombres").
2. Tu consumidor **debe ser idempotente** — la garantía de entrega es *al menos una vez*, no
   *exactamente una vez* (ver [semántica de entrega](delivery-semantics.md)).
3. `payloadJson` no tiene schema validado — coordina con el equipo dueño del módulo productor
   (ver la columna "Servicio productor" del catálogo) sobre la forma real del payload antes de
   depender de un campo específico.

## Cómo registrar una suscripción

El mecanismo (`event_subscriptions`, filtrado por `aggregateType`/`filterJson`, modo directo o por
cola) es configuración de datos, no un archivo de código que se edite — no hay un endpoint
público documentado en esta fase para auto-registro de suscripciones externas. Coordinar con el
equipo de plataforma de datos (`DATA_PLATFORM_ADMIN`/`MESSAGING_ADMIN`, ver
[actores y roles](../business/actors-and-roles.md)).

## Si tu consumidor falla

Ver [reintentos y cola muerta](retries-and-dlq.md) — el job/entrega reintenta según la
configuración de la cola; tras agotar intentos, cae en `dead_letter_jobs` (evidencia conservada,
reencolable explícitamente vía `POST /queues/dead-letter/:id/redrive`).

## Si necesitas garantía de orden

No la hay entre agregados distintos. Si tu caso de uso la requiere, esa es una limitación de
diseño real a resolver en tu consumidor (p. ej. reordenando por timestamp del evento), no algo que
el sistema de mensajería garantice hoy.

## Checklist antes de ir a producción con un consumidor nuevo

- [ ] Manejo idempotente confirmado (reprocesar el mismo evento dos veces no corrompe estado).
- [ ] Validación defensiva del payload (no asumir campos sin confirmarlos con el productor).
- [ ] Estrategia definida para el caso "evento nunca llega" (timeout / reconciliación).
- [ ] Sin dependencia de orden entre eventos de agregados distintos, o mitigación explícita si la hay.
