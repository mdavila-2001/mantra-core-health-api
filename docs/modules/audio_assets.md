<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/audio_assets/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `audio_assets`

**Fuente:** [`src/modules/audio_assets/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/audio_assets/README.md)
· 2 controllers · 4 services · 2 repositories · 4 entidades · 1 DTO

---

# Audio Assets

Módulo de assets TTS **cache-first** para onboarding y otras experiencias acotadas. El dominio no conoce ElevenLabs, S3, HTTP ni la cola concreta. El proveedor se elige por entorno y los bytes finales siempre quedan en almacenamiento propio.

## Invariantes

- La identidad de un asset es SHA-256 de un payload canónico que incluye plantilla, versión, texto normalizado, idioma, proveedor/modelo, voice profile/version, encoding y **tenant propietario**.
- `audio_assets.asset_key` es `UNIQUE`: es la garantía final contra generaciones concurrentes duplicadas.
- Nunca existe un endpoint de TTS de texto libre. Solo se resuelven plantillas registradas.
- Variables dinámicas se normalizan/validan antes de renderizarse. El texto renderizado se cifra con AES-256-GCM antes de persistirse.
- La cola recibe únicamente `assetId`; no recibe texto, API keys ni PII.
- Un cache hit nunca consulta presupuesto ni proveedor.
- **La caché se comparte sólo cuando el audio no puede identificar a nadie.** Un
  render que sustituyó un campo `PERSON_NAME` o `SAFE_TEXT` queda acotado al tenant
  del contexto (`tenant_id`, presente además en la identidad y en la búsqueda de
  binario reutilizable); los `STATIC`, `FALLBACK` y `ENUMERATED` siguen siendo
  compartidos, que es lo que permite pre-generarlos una vez para toda la
  plataforma. Sin ese corte, un acierto de caché sería la prueba de que un nombre
  existe en otro tenant, y no hace falta oír el audio para filtrar el dato.
- **Toda reserva de presupuesto se cierra: se consume o se devuelve.** El crédito
  estimado se aparta al reservar, se convierte en consumido al quedar `READY` y se
  **devuelve** cuando el asset pasa a `FAILED_PERMANENT` o `FALLBACK_ONLY`. La
  devolución es exactamente-una-vez (la fila se bloquea, se lee y se pone a `NULL`
  en la misma transacción) y se imputa a `budget_period_key`, la ventana en la que
  se reservó, no la del reloj: liquidar o devolver contra otro mes deja el anterior
  con crédito apartado que nadie recupera.
- En producción, `AUDIO_TTS_PROD_LICENSE_CONFIRMED=false` impide generar assets nuevos.
- `disabled` es un proveedor válido y debe degradar a fallback sin error técnico para el usuario.

## API

- `POST /audio-assets/resolve`: devuelve `READY`, `QUEUED` o `FALLBACK`.
- `GET /audio-assets/:assetId/content`: sirve bytes desde storage propio. Un asset acotado a otro tenant responde 404 (no 403: un 403 confirmaría que el identificador existe); los compartidos se sirven a cualquiera, y los flujos `SYSTEM` sin tenant en contexto siguen operando entre tenants.
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


## Resiliencia y mantenimiento

- `POST /internal/audio-assets/verify` verifica objeto + SHA-256 y reporta fallbacks corruptos como bloqueantes.
- `POST /internal/audio-assets/:assetId/deprecate` nunca permite deprecar un asset de estrategia `FALLBACK`.
- `POST /internal/audio-assets/garbage-collect` sólo considera `DEPRECATED`/`FAILED_PERMANENT`, respeta retención y no borra el objeto físico mientras otra fila lo referencie.
- `GET /internal/audio-assets/status` expone estado operativo sin secretos. ElevenLabs **no** participa del readiness de la API principal.
- La reutilización entre plantillas compara texto renderizado + idioma + proveedor/modelo + perfil/voz/version + formato/sample rate/normalizer. El `asset_key` de cada plantilla sigue siendo independiente.
- El cortacircuitos, bulkhead y rate gate viven sólo en el adaptador ElevenLabs. `AUDIO_TTS_HTTP_MAX_RETRIES=0` por defecto evita multiplicar reintentos HTTP con los reintentos durables de la cola; `AUDIO_TTS_MAX_RETRIES` pertenece al job durable.
- Cambiar el alcance de una plantilla (añadir o quitar un campo `PERSON_NAME`)
  cambia la identidad de sus assets: los anteriores dejan de encontrarse y hay que
  volver a pre-generar lo que corresponda.
- Un rebuild real requiere subir versión de plantilla, voz, modelo, normalizador o formato. No se sobrescribe silenciosamente un asset READY con la misma identidad.

