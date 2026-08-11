# ADR — Audio Assets worker, cola durable y storage propio

**Fecha:** 2026-08-10  
**Estado:** Aceptado

## Contexto

La especificación propone arquitectura poligonal y enumera BullMQ/S3 como ejemplos. El repositorio real ya posee una cola PostgreSQL durable con `SKIP LOCKED`, deduplicación, reintentos y dead-letter, además de `FileStorageAdapter`, Pino, OpenTelemetry y un bootstrap común para workers persistentes.

## Decisiones

1. Reutilizar la cola `messaging` en lugar de introducir BullMQ/pg-boss. Evita una segunda infraestructura y conserva la entrega at-least-once ya operada por el backend.
2. Mantener MikroORM/PostgreSQL del repositorio. No migrar a Sequelize por una recomendación genérica de la especificación.
3. Extender `FileStorageAdapter` con S3 compatible; el dominio nunca conoce AWS/MinIO/R2.
4. Ejecutar ElevenLabs exclusivamente en `worker-audio-assets`; la API solo coordina, cifra metadata y sirve storage propio.
5. Mantener fallbacks como assets reales, pre-generados y verificados. El seed registra templates pero no consume cuota ni inventa archivos de audio.
6. Usar `asset_key UNIQUE` como garantía primaria de idempotencia; los locks/queue dedupe son defensa adicional.

## Consecuencias

- No se añade Redis/BullMQ adicional para este worker.
- El deploy gana un proceso persistente adicional.
- Para `FILE_STORAGE_ADAPTER=local`, API y worker deben compartir el volumen; para producción se recomienda storage S3-compatible compartido.
- Habilitar generación en producción exige confirmación explícita de licencia y prewarm/verify de fallbacks.
