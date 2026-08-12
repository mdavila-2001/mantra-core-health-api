<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/audio_tts/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `audio_tts`

**Fuente:** [`src/modules/audio_tts/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/audio_tts/README.md)
· 2 controllers · 5 services · 2 repositories · 5 entidades · 1 DTO

---

# Módulo Audio TTS (síntesis de voz cacheada por identidad)

Convierte una plantilla y unas variables en un audio pronunciado por la voz de
marca, y se ocupa de las dos cosas que hacen viable poner audio en un flujo que
se repite miles de veces al día:

1. **no pagar dos veces por el mismo audio** — un acierto de caché no consume
   cuota, ni llama al proveedor, ni crea una fila;
2. **no gastar más de lo presupuestado** — la cuota se **reserva** de forma
   atómica al autorizar, no al gastar, así que N peticiones concurrentes no
   pueden superar el límite mensual.

Y una garantía que gobierna todo el diseño: **la falta de audio nunca rompe al
llamador**. Presupuesto agotado, proveedor caído, plantilla sin pre-generar — la
respuesta es `FALLBACK` o `UNAVAILABLE`, nunca una excepción. Sólo se lanza
cuando el problema es de quien llama (plantilla inexistente, solicitud inválida).

Es la integración del paquete desacoplado `audio_tts_worker` (v2.0.0) en este
backend. Qué se conservó, qué se reemplazó y por qué:
`docs/reports/audio-tts-integration-2026-08-11.md`.

## Dos procesos, dos secretos

| | Proceso API (este módulo) | Proceso worker (`src/worker/jobs/audio_tts`) |
|---|---|---|
| **Decide** | si se genera: presupuesto, cupo por actor, licencia | cómo se llama al proveedor: ritmo, mamparo, circuito, reintento |
| **Hace** | resuelve, cachea, cifra el texto, contabiliza | sintetiza y escribe los bytes |
| **Tiene** | `AUDIO_TTS_DATA_KEY` (cifrado del texto) | `ELEVENLABS_API_KEY` (credencial de pago) |
| **No tiene** | la credencial del proveedor | la clave de cifrado **ni acceso a PostgreSQL** |

Ninguno puede hacer el trabajo del otro, y eso es el punto. El worker es **un
cliente HTTP autenticado más** —como los otros 20 de este backend— y habla con la
base sólo a través de `/internal/audio-tts/*`, de modo que sigue pasando por
`JwtAuthGuard`, `RolesGuard`, el contexto de tenant y la `ValidationPipe`.

## Endpoints

| Método y ruta | Rol | Resumen |
|---|---|---|
| `POST /audio-tts/resolve` | autenticado | Resuelve el audio de una plantilla. Devuelve 200 en los cuatro estados |
| `GET /audio-tts/assets/{assetId}` | autenticado | Estado de un asset y URL firmada; para volver tras un `QUEUED` |
| `POST /audio-tts/prewarm` | `SYSTEM`, `AUDIO_ADMIN` | Pre-genera una plantilla sin variables (gasta cuota) |
| `GET /audio-tts/budget` | `SYSTEM`, `AUDIO_ADMIN` | Presupuesto del mes, consumo imputado y estado de la cola |
| `POST /internal/audio-tts/jobs/claim` | `SYSTEM`, `AUDIO_ADMIN` | Reclama un lote con lease y devuelve el texto descifrado |
| `POST /internal/audio-tts/assets/{id}/complete` | `SYSTEM`, `AUDIO_ADMIN` | Registra el audio, liquida la reserva e imputa el consumo |
| `POST /internal/audio-tts/assets/{id}/fail` | `SYSTEM`, `AUDIO_ADMIN` | Programa el reintento o cierra y devuelve la reserva |
| `POST /internal/audio-tts/reconcile` | `SYSTEM`, `AUDIO_ADMIN` | Barrido de agotados, retención del cupo y recuento de encallados |

`actorId` **no** forma parte del contrato de `resolve`: el cupo diario se imputa
siempre al sujeto del token. Si el cliente pudiera declararlo, rotar el valor
bastaría para saltarse el límite, y poner el de otra persona le gastaría su cupo
del día. Los llamadores internos que necesitan declararlo usan
`AudioAssetResolver` por inyección.

## Los cuatro estados de `resolve`

| Estado | Significado | Qué debe hacer el llamador |
|---|---|---|
| `READY` | audio cacheado disponible | reproducir `playbackUrl` |
| `QUEUED` | el worker lo está generando | continuar **sin audio** y volver a consultar por `assetId` |
| `FALLBACK` | audio genérico pre-generado | reproducirlo; el flujo continúa **sin mencionar el nombre** |
| `UNAVAILABLE` | no hay audio | continuar sin audio. **Nunca** tratarlo como error del usuario |

```ts
constructor(private readonly audio: AudioAssetResolver) {}

const result = await this.audio.resolve({
  templateCode: 'onboarding.welcome.named',
  variables: { name: displayName },
  actorId: userId,
  correlationId: request.correlationId, // se propaga hasta el log del worker
});
```

## Identidad del asset: qué hace que dos audios sean el mismo

`asset_key` es un SHA-256 de: plantilla + versión + texto renderizado (normalizado
NFKC y con espacios colapsados) + idioma + proveedor + modelo + voz + versión de
voz + formato + frecuencia + **tenant**. Su UNIQUE es lo que convierte dos
peticiones concurrentes del mismo audio en una sola generación.

Cambiar voz, modelo, idioma o formato **no reescribe** los audios existentes: crea
otros. La consecuencia operativa importa: tras una rotación de voz, los fallbacks
anteriores dejan de ser equivalentes y hay que volver a pre-generarlos, o toda
degradación acabará en `UNAVAILABLE`.

### Tenant: qué se comparte y qué no

| Estrategia | `tenant_id` | Por qué |
|---|---|---|
| `STATIC`, `FALLBACK` | `NULL` (compartido) | su texto no depende de nadie: un audio sirve a toda la plataforma y se pre-genera una vez |
| `DYNAMIC` | el tenant del contexto | su texto renderizado puede llevar el nombre de una persona, y una caché compartida convertiría un acierto de caché en una filtración |

Una plantilla `DYNAMIC` sin tenant en contexto **falla de forma visible**
(`AUDIO_TENANT_REQUIRED`) en vez de cachearse en el ámbito compartido.

## La fila es la cola

No hay broker. `status`, `attempts`, `claimed_at`/`claimed_by` y `next_attempt_at`
son el estado completo de un trabajo, y el worker lo reclama con un
`UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)` — la misma mecánica del relevo
del outbox de `messaging`. Introducir un segundo sistema de colas, con su esquema,
su apagado y su observabilidad, para una tabla que ya tenía que llevar la cuenta
de los intentos habría sido complejidad sin beneficio.

Ciclo de vida:

```
resolve() ──▶ PENDING ──claim──▶ GENERATING ──complete──▶ READY
                 ▲                    │
                 │                    ├─fail(retryable)──▶ FAILED_RETRYABLE
                 └────next_attempt_at─┘                         │
                                                    agota intentos
                                                          │
                       reconcile / fail ──▶ FAILED_PERMANENT (+ reserva devuelta)
```

Un asset que se queda `GENERATING` porque su proceso murió vuelve a ser
reclamable al expirar el lease. Si además agotó sus intentos, lo cierra el barrido
—y ese barrido es imprescindible: nadie más devolvería su reserva al presupuesto.

## Contabilidad del gasto

Tres tablas, tres preguntas distintas:

| Tabla | Pregunta | Atomicidad |
|---|---|---|
| `audio_budget_month` | ¿cabe en el mes? | `INSERT … ON CONFLICT DO UPDATE … WHERE reserved+settled+n <= usable`; cero filas **es** la denegación |
| `audio_actor_generation_daily` | ¿le queda cupo a este actor hoy? | `ON CONFLICT DO UPDATE … WHERE count < limit` |
| `audio_generation_usage` | ¿qué se facturó, asset por asset? | UNIQUE por `asset_id`: un reproceso no puede imputar dos veces |

`GET /audio-tts/budget` publica el agregado (`settledUnits`) y el detalle
(`recordedUnits`). Si divergen, una liquidación se aplicó sin su registro de
consumo: es la comprobación que hay que hacer **antes** de conciliar contra la
factura del proveedor.

`AUDIO_TTS_RUNTIME_GENERATIONS_PER_ACTOR_DAY=0` significa **bloqueado**, no
ilimitado. Para quitar el techo hay que declararlo con
`AUDIO_TTS_ACTOR_LIMIT_UNLIMITED=true`.

## Cifrado del texto en reposo

El texto renderizado puede contener el nombre de un paciente, así que se cifra con
AES-256-GCM y **`asset_key` como dato autenticado adicional**: mover el
criptograma de un asset a otro hace que el descifrado falle en vez de entregar el
texto de otra persona a la voz de marca. El `keyId` viaja en el valor
(`v2.<keyId>.<iv>.<tag>.<ciphertext>`), de modo que rotar la clave no obliga a
re-cifrar la tabla antes del despliegue: lo nuevo usa la clave activa y lo antiguo
sigue legible mientras su clave permanezca en `AUDIO_TTS_DATA_KEYS_PREVIOUS`.

## Puesta en marcha

```bash
# 1. Arrancar la API: materializa el schema audio_tts y siembra las 3 plantillas.
#    Sembrar NO genera audio: un despliegue no debe llamar a un servicio de pago.
yarn start:prod

# 2. Pre-generar los fallbacks ANTES de abrir tráfico. Sin fallbacks READY, toda
#    degradación acaba en UNAVAILABLE incluso cuando el sistema funciona.
curl -X POST /audio-tts/prewarm -d '{"templateCode":"onboarding.fallback.generic"}'
curl -X POST /audio-tts/prewarm -d '{"templateCode":"onboarding.welcome.generic"}'

# 3. Arrancar el worker (su propio proceso/contenedor).
yarn start:worker:audio_tts
```

Configuración: `AUDIO_*` y `ELEVENLABS_*` en `.env.example`,
validadas por `audioTtsEnvSchema` y por las reglas cruzadas de
`assertAudioTtsEnvCoherent` (el lease debe superar el plazo de la llamada; el lote
debe caber en el mamparo; `fake` y `local` están bloqueados en producción).

## Estructura

| Carpeta | Responsabilidad |
|---|---|
| `config/` | esquema Joi, carga tipada y reglas cruzadas del entorno |
| `domain/` | tipos, tokens, errores y los dos puertos (almacenamiento, proveedor) |
| `application/` | piezas puras: clave de identidad, render de plantillas, cifrado, política de presupuesto, validación |
| `entities/` | las 5 tablas del schema `audio_tts` |
| `repositories/` | acceso a datos; el SQL que decide quién gana una carrera |
| `services/` | resolutor, ciclo de vida de la generación, barrido, siembra, firma de URLs |
| `controllers/` | superficie de negocio (`/audio-tts`) e interna (`/internal/audio-tts`) |
| `dto/` | contratos HTTP validados |
| `storage/` | adaptadores local y S3, compartidos con el worker |

Índices, restricciones CHECK, claves ajenas y triggers del schema se declaran en
`src/orm/catalog/local.catalog.ts` — no en
los archivos generados por `yarn orm:catalog`, que los perderían en la siguiente
regeneración.

## Lo que este módulo no hace

- **No genera audio durante migraciones ni seeds.** Sembrar el catálogo y gastar
  cuota son operaciones que deben poder fallar por separado.
- **No firma URLs en cada respuesta.** `storageUri` es lo que se persiste; la URL
  firmada es efímera y se emite en el borde HTTP, cuando el cliente va a
  reproducir.
- **No expone métricas propias.** Este backend tiene trazas (OTel), no un
  recolector de métricas; el estado se publica por logs estructurados con eventos
  estables (`audio.generation.ready`, `audio.reconcile.completed`, …), por
  `GET /audio-tts/budget` y por la sonda `/status` del worker.
- **No declara políticas RLS.** El camino del worker es cross-tenant por diseño
  (reclama assets de todos los tenants con un token `SYSTEM`), así que el
  aislamiento se aplica en la identidad del asset y en el filtro de las consultas
  de lectura. Ver la sección correspondiente del informe de integración.

