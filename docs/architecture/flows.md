# Flujos de arquitectura

## Audio Assets / TTS

```text
Onboarding u otro módulo
  -> AudioAssetsFacade.resolve(template, variables)
  -> normalizar + validar + renderizar
  -> asset_key determinista
  -> cache DB
     -> READY: storage propio
     -> MISS: BudgetGuard
        -> denegado: fallback
        -> permitido: crear PENDING idempotente + enqueue audio.generate

worker-audio-assets
  -> claim audio-generation
  -> API prepare-generation (relee asset y reserva presupuesto atómicamente)
  -> CircuitBreaker + rate/concurrency guard + TTS provider
  -> FileStorageAdapter.store(buffer)
  -> API generated
  -> asset READY
```

La entrega de la cola es **at-least-once**. La constraint `UNIQUE(asset_key)`, el `dedupeKey` de queue y los estados del asset hacen que el consumidor sea idempotente.

El onboarding no espera obligatoriamente TTS: si el personalizado aún no está listo, reproduce un fallback pre-generado. La indisponibilidad del proveedor no es dependencia de readiness de la API principal.
