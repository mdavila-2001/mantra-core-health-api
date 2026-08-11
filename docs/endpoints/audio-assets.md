# Audio Assets API

Todos los endpoints requieren autenticación. Los endpoints bajo `/internal/audio-assets` requieren rol `SYSTEM`.

| Método | Ruta | Uso |
|---|---|---|
| POST | `/audio-assets/resolve` | Resolver cache-first por `templateKey` + variables validadas. Nunca acepta texto libre. |
| GET | `/audio-assets/:assetId/content` | Servir un asset `READY` desde storage propio. |
| POST | `/internal/audio-assets/pregenerate` | Pre-generar STATIC, ENUMERATED y fallbacks con el mismo pipeline productivo. |
| POST | `/internal/audio-assets/:assetId/prepare-generation` | Contrato API → worker; reserva presupuesto de forma atómica. |
| POST | `/internal/audio-assets/:assetId/generated` | Confirmar storage/checksum/uso después de síntesis. |
| POST | `/internal/audio-assets/:assetId/generation-failed` | Registrar fallo reintentable/permanente. |
| GET | `/internal/audio-assets/status` | Diagnóstico sin secretos; el proveedor no forma parte del readiness principal. |
| POST | `/internal/audio-assets/verify` | Verificar objeto y checksum. `blockingFallbackIssues > 0` debe bloquear promoción. |
| POST | `/internal/audio-assets/:assetId/deprecate` | Deprecar un asset no-fallback. |
| POST | `/internal/audio-assets/garbage-collect` | GC conservador, reteniendo binarios compartidos y fallbacks. |

## Resolución

`READY` significa que el contenido propio está disponible. `QUEUED` significa que se solicitó generación asíncrona; si existe fallback `READY`, se devuelve en `fallbackAsset`. `FALLBACK` es una degradación funcional controlada y puede incluir un asset genérico listo; si no hay narración aprobada disponible, el frontend debe continuar el onboarding sin audio.

El cuerpo `variables` se trata como entrada no confiable. Sólo campos declarados por la plantilla son renderizados y los tipos de nombre/enum/texto seguro aplican normalización y rechazo de email, URL, HTML, tokens y caracteres de control.
