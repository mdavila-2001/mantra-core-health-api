# Audio Assets

Módulo de assets TTS **cache-first** para onboarding y otras experiencias acotadas. El dominio no conoce ElevenLabs, S3, HTTP ni la cola concreta. El proveedor se elige por entorno y los bytes finales siempre quedan en almacenamiento propio.

## Invariantes

- La identidad de un asset es SHA-256 de un payload canónico que incluye plantilla, versión, texto normalizado, idioma, proveedor/modelo, voice profile/version y encoding.
- `audio_assets.asset_key` es `UNIQUE`: es la garantía final contra generaciones concurrentes duplicadas.
- Nunca existe un endpoint de TTS de texto libre. Solo se resuelven plantillas registradas.
- Variables dinámicas se normalizan/validan antes de renderizarse. El texto renderizado se cifra con AES-256-GCM antes de persistirse.
- La cola recibe únicamente `assetId`; no recibe texto, API keys ni PII.
- Un cache hit nunca consulta presupuesto ni proveedor.
- En producción, `AUDIO_TTS_PROD_LICENSE_CONFIRMED=false` impide generar assets nuevos.
- `disabled` es un proveedor válido y debe degradar a fallback sin error técnico para el usuario.

## API

- `POST /audio-assets/resolve`: devuelve `READY`, `QUEUED` o `FALLBACK`.
- `GET /audio-assets/:assetId/content`: sirve bytes desde storage propio.
- `POST /internal/audio-assets/pregenerate`: SYSTEM-only; precalienta STATIC/ENUMERATED/fallbacks.
- Los endpoints `prepare-generation`, `generated` y `generation-failed` son SYSTEM-only y pertenecen al contrato API ↔ worker.

## Arranque seguro

Antes de habilitar TTS en producción:

1. Configurar storage propio y confirmar que API/worker ven el mismo backend.
2. Configurar ElevenLabs solo en el worker/secret store.
3. Confirmar licencia comercial con `AUDIO_TTS_PROD_LICENSE_CONFIRMED=true` únicamente después de verificación humana.
4. Ejecutar pre-generación y luego verificación de integridad.
5. Confirmar que los fallbacks obligatorios están `READY` antes de abrir tráfico.

No se incluye un audio fallback binario inventado: debe ser sintetizado con una cuenta autorizada o aportado como asset aprobado. El código nunca consume cuota durante boot seeds.

## Extensión de proveedor

Un proveedor nuevo implementa `TtsProviderPort` y se registra en el factory del worker. No debe modificar casos de uso, cache key ni controladores.
