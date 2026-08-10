# Worker `audio-assets`

Proceso persistente que consume `audio-generation` mediante la cola durable existente de `messaging`.

## Ciclo

`claim -> prepare-generation -> TTS provider -> FileStorageAdapter -> generated -> complete`

Si el proveedor devuelve un error reintentable, el handler falla y la cola aplica backoff/attempts. Cuando se agotan intentos, la evidencia queda en `dead_letter_jobs` asociada a `audio-generation-dlq`. Los errores permanentes se registran en `audio_generation_events` y no consumen más intentos.

El proceso usa el bootstrap común de workers, por lo que hereda `SIGTERM`/`SIGINT`, health file, trazas, logs y shutdown controlado.

## Seguridad

- `ELEVENLABS_API_KEY` nunca entra a DB, cola, logs o respuestas HTTP.
- La cola contiene solo `assetId`.
- Los logs no incluyen nombres ni texto sintetizado.
- Los bytes se guardan inmediatamente en storage propio.

## Ejecución

```bash
yarn start:worker:audio-assets:dev
yarn start:worker:audio-assets
```

En Docker Compose el servicio fuerza `MESSAGING_QUEUE_CODES=audio-generation` para que este proceso no consuma trabajos de otros dominios.
