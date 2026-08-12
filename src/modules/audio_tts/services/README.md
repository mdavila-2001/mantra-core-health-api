# Servicios — Audio TTS

| Servicio | Responsabilidad |
|---|---|
| `AudioAssetResolver` | Borde público del dominio: resuelve, cachea, cifra y degrada. Lo inyectan otros módulos |
| `AudioGenerationService` | Mitad servidora del worker: `claim` (con lease y texto descifrado), `complete`, `fail` |
| `AudioReconcileService` | Cierra agotados devolviendo su reserva, aplica retención al cupo por actor y publica los encallados |
| `AudioTemplateSeedService` | Siembra el catálogo en el arranque. Idempotente y **sin generar audio** |
| `AudioPlaybackService` | Firma la URL de reproducción. Separado porque `storageUri` se persiste y la URL caduca |

## Dos reglas que atraviesan todos

**La falta de audio no es una excepción.** `AudioAssetResolver` sólo lanza cuando
el problema es del llamador (plantilla inexistente, solicitud inválida, plantilla
dinámica sin tenant). Presupuesto agotado, proveedor caído o fallback sin
pre-generar devuelven `FALLBACK`/`UNAVAILABLE`, y hasta un fallo **al buscar la
degradación** se absorbe: convertirlo en excepción sería justo lo que este camino
existe para evitar.

**Cada compensación de presupuesto ocurre una sola vez.** Tres caminos pueden
querer devolver la misma reserva —el perdedor de una carrera, el marcado de fallo
permanente y el barrido— y los tres pasan por primitivas que ponen la reserva a
cero en la misma sentencia en que la leen. La ventana de imputación es la del
**alta** del asset, no la del mes en curso: liberar contra el mes equivocado
descuadraría las dos ventanas a la vez.
