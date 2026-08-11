# Runbook de producción — Audio Assets

## Gate previo al despliegue

1. Mantener `AUDIO_TTS_ENABLED=false` durante migración/seed inicial.
2. Configurar `FILE_STORAGE_ADAPTER=s3` para despliegues multi-réplica y verificar bucket/prefijo/credenciales desde secret manager.
3. Configurar `AUDIO_TTS_DATA_KEY` con al menos 32 caracteres y tratarla como secreto con rotación controlada.
4. Configurar ElevenLabs exclusivamente en el worker: API key, voice ID, modelo y formato.
5. Verificar manualmente que la cuenta/plan permite el uso comercial requerido y sólo entonces fijar `AUDIO_TTS_PROD_LICENSE_CONFIRMED=true`.
6. Ejecutar boot seeds; confirmar `audio-generation` y `audio-generation-dlq`.
7. Habilitar TTS y ejecutar `POST /internal/audio-assets/pregenerate` con actor SYSTEM.
8. Esperar a que la cola quede sin pendientes/reintentos.
9. Ejecutar `POST /internal/audio-assets/verify`; **no promover si `blockingFallbackIssues > 0`**.
10. Probar onboarding con proveedor inaccesible: debe continuar usando fallback o sin narración, nunca bloquear el flujo.

## Alarmas recomendadas

- Crecimiento sostenido de `audio_assets_provider_failure_total`.
- Circuit breaker en OPEN o repetidos `TTS_PROVIDER_RATE_LIMITED`.
- `audio_assets_budget_denied_total` > 0 fuera de un evento esperado.
- Edad/tamaño de `audio-generation` y dead-letter.
- Fallos de `ASSET_VERIFY`, especialmente en estrategia fallback/global fallback.
- Aumento de `FAILED_PERMANENT` o `FALLBACK_ONLY`.

## Rebuild

No se sobrescribe un asset `READY` con la misma identidad. Para una regeneración real, incrementar de forma explícita la versión de plantilla, voz, modelo, normalizador o formato; después ejecutar pre-generación y verificación. Esta política conserva rollback y auditoría.

## Retries

`AUDIO_TTS_MAX_RETRIES` controla los reintentos durables del job. Los retries HTTP están desactivados por defecto (`AUDIO_TTS_HTTP_MAX_RETRIES=0`) para evitar duplicar cobro ante timeouts ambiguos. Sólo habilitarlos tras medir comportamiento real del proveedor.
