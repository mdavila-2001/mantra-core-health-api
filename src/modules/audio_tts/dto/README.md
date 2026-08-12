# DTO — Audio TTS

Contratos HTTP del dominio, en un único archivo (`audio-tts.dto.ts`) como el resto
de los módulos.

**Toda propiedad lleva al menos un decorador de validación, sin excepción.** La
`ValidationPipe` global corre con `whitelist` y `forbidNonWhitelisted`, así que una
propiedad sin validador no es "un campo sin comprobar": es un campo que hace
fallar la petición entera con 400 y deja el endpoint inalcanzable.

| DTO | Uso |
|---|---|
| `ResolveAudioDto` → `ResolveAudioResponseDto` | Resolver un audio. La respuesta lleva `storageUri` (persistible) y `playbackUrl` (efímera) |
| `AudioAssetResponseDto` | Estado de un asset tras un `QUEUED` |
| `PrewarmAudioDto` | Pre-generación de una plantilla sin variables |
| `AudioBudgetResponseDto` | Presupuesto del mes: agregado (`settledUnits`) **y** detalle (`recordedUnits`); si divergen, hay deriva contable |
| `ClaimAudioJobsDto` → `ClaimAudioJobsResponseDto` | Reclamo de lote del worker; `skipped` cuenta los cerrados sin generar |
| `CompleteAudioAssetDto`, `FailAudioAssetDto` → `AudioAssetOutcomeResponseDto` | Reporte del worker; `applied: false` marca un duplicado benigno |
| `AudioReconcileResponseDto` | Resultado del barrido |

La validación del borde **programático** (otros módulos llamando
`AudioAssetResolver.resolve()` por inyección) no pasa por aquí: la hace
`application/resolve-audio.validator.ts`, porque ahí no hay tubería HTTP.
