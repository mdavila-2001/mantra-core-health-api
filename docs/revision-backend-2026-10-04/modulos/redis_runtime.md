# Revisión del módulo `redis_runtime` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Servicio Redis, provider, controladores, DTO y prueba unitaria.
- `corepack yarn test src/modules/redis_runtime --runInBand --silent` → **1 suite y 7 pruebas aprobadas**. No arranca Redis real ni prueba concurrencia.

## Hallazgo confirmado

### REDIS-01 — Alta — el challenge OTP no es single-use bajo concurrencia

`verifyChallenge` ejecuta `GET`, compara el hash y después ejecuta `DEL` como operaciones separadas ([redis-runtime.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/redis_runtime/services/redis-runtime.service.ts#L225-L242)). Dos solicitudes con el mismo OTP pueden leer el hash antes de que cualquiera lo borre; ambas comparan verdadero y ambas devuelven `true`. El comentario promete consumo single-use, pero no hay Lua/CAS ni otro primitivo atómico como el que sí se utiliza al liberar locks ([#L24-L34](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/redis_runtime/services/redis-runtime.service.ts#L24-L34)).

Cuando se conecte al flujo de verificación de contacto indicado por el propio módulo, un OTP podría validar dos operaciones concurrentes. Eso permite reutilizar un desafío de autenticación/confirmación y contradice una garantía de seguridad documentada.

**Plan de corrección.** Reemplazar `GET`/comparación/`DEL` por un script Lua que compare el digest y borre dentro de la misma ejecución Redis, devolviendo 1/0. Mantener `timingSafeEqual` si el hash se compara fuera de Redis, o trasladar la comparación a un digest HMAC si se requiere una clave de servidor. Agregar una prueba de dos verificaciones simultáneas contra Redis real que demuestre un solo éxito.

| Caso | Tipo y preparación | Entrada / resultado esperado |
| --- | --- | --- |
| Correcto | Integración con Redis y challenge vigente. | OTP correcto devuelve `true` una vez. |
| Límite | Dos verificaciones lanzadas en paralelo. | Exactamente una devuelve `true`; la otra `false`. |
| Error | OTP incorrecto, expirado o tenant distinto. | Devuelve `false` y no consume un challenge válido por error. |
| Falla catalogada | Ruta que consuma el challenge. | `422/PRECONDITION_FAILED/REDIS_CHALLENGE_INVALID_OR_EXPIRED` sin revelar el secreto. |

## Controles que se sostienen

Las claves se namespacean por tenant, el controlador exige contexto de tenant y el lock distribuido usa un script CAS fijo. Las rutas no exponen `EVAL` arbitrario. Debe mantenerse la validación de claves y TTL cuando se incorpore el script de challenge.

## Ola

| Ola | Hallazgo | Esfuerzo |
|---|---|---:|
| 1 | REDIS-01 | S |
