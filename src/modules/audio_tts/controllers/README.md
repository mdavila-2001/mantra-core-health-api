# Controladores — Audio TTS

Dos superficies con públicos distintos, en archivos distintos a propósito.

| Controlador | Prefijo | Público |
|---|---|---|
| `AudioTtsController` | `/audio-tts` | El usuario en su flujo (`resolve`, consulta de asset) y quien administra (`prewarm`, `budget`) |
| `AudioTtsInternalController` | `/internal/audio-tts` | El proceso worker: `jobs/claim`, `assets/:id/complete`, `assets/:id/fail`, `reconcile` |

Mezclarlas invitaría a llamar desde fuera operaciones que asumen un proceso con
lease, reintentos y ciclo de vida propios.

## Tres decisiones de contrato

- **`resolve` responde 200 en los cuatro estados**, incluido `UNAVAILABLE`. La
  falta de audio no es un fallo de la petición, y devolver 4xx/5xx obligaría a
  cada cliente a tratar como error una degradación prevista.
- **`actorId` no existe en `ResolveAudioDto`.** El cupo diario se imputa al sujeto
  del token: si el cliente pudiera declararlo, rotar el valor bastaría para
  saltarse el límite y poner el de otra persona le gastaría su cupo del día. Con
  `forbidNonWhitelisted`, enviarlo devuelve 400.
- **La URL firmada se emite aquí, no en el dominio.** `storageUri` es lo que se
  persiste; una URL con expiración metida en una caché o en una fila es una URL
  caducada esperando su turno.
