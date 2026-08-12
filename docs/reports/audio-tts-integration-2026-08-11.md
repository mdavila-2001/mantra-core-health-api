# Auditoría e integración del worker de ElevenLabs — 2026-08-11

> Auditoría del paquete desacoplado `audio_tts_worker` v2.0.0 y su integración en
> este backend como módulo `audio_tts` + worker `audio_tts`. Toda afirmación de
> este documento tiene un comando detrás; los que no se ejecutaron se declaran
> como no verificados.

## 1. Veredicto

**El paquete es sólido en diseño y estaba verde en su propio pipeline.** Lo que no
podía sobrevivir al trasplante es su **infraestructura**: cuatro de sus decisiones
técnicas chocaban de frente con invariantes de este backend. La integración
conserva el diseño (que es lo valioso) y reemplaza la infraestructura.

| | Paquete original | Este backend | Resolución |
|---|---|---|---|
| ORM | Sequelize + `sequelize-typescript` | MikroORM (1191 entidades) | **Reescrito** a MikroORM. Un segundo ORM significa dos pools, dos dialectos y dos formas de que una transacción no sea lo que parece |
| Cola | pg-boss (schema `pgboss` propio, requiere `CREATE` sobre la base) | outbox + polling con `SKIP LOCKED` | **La fila es la cola.** El asset ya llevaba `status`/`attempts`/lease: bastaba añadir `next_attempt_at` |
| Acceso a datos del worker | conexión directa a PostgreSQL | *"el worker es un cliente autenticado más"* (20 workers, cero conexiones a la base) | **Invertido**: el worker llama `/internal/audio-tts/*`; la API es la única que toca la base |
| Resiliencia | mamparo, cortacircuitos y ritmo propios | `common/resilience` (mismas primitivas para los 21 procesos) | **Sustituido** por el kernel del repo; sólo se conserva el espaciador de tasa, que el kernel no tiene |
| Validación | Zod v4 | Joi (entorno) + class-validator (HTTP) | **Reescrito**: Zod no es dependencia de este backend y añadirla por un módulo no se justifica |

Consecuencia contable de esos cambios: **2.130 líneas eliminadas** del paquete
(Sequelize, pg-boss, sus tres primitivas de resiliencia duplicadas, su servidor de
salud, su logger y su recolector de métricas propios) y sustituidas por
infraestructura que ya existía y que ya está operada.

## 2. Verificación reproducida del paquete original

Ejecutado sobre `~/Downloads/audio_tts_worker` (v2.0.0) el 2026-08-11, tras
`yarn install`:

| Comando | Resultado |
|---|---|
| `shasum -a 256 -c MANIFEST.sha256` | **40/40 OK** |
| `yarn typecheck` | **sin diagnósticos** |
| `yarn lint --max-warnings 0` | **0 errores, 0 advertencias** |
| `yarn test:unit` | **18 suites, 335 pruebas, todas verdes** (1,15 s) |

Las 68 incidencias que su propio `docs/audit/audit-report.md` documenta —incluido
el `SyntaxError` del renderizador de plantillas que dejaba el paquete sin poder
cargarse— **están corregidas en la versión que se auditó aquí**. El informe interno
se sostiene.

No verificado: sus pruebas de integración (`yarn test:integration`) requieren una
base propia con su cadena de migraciones; el esquema se materializa aquí por otra
vía (§5), así que ejecutarlas no habría dicho nada sobre el resultado integrado.

## 3. Hallazgos de la auditoría del código portado

Lo que sigue son defectos y riesgos **encontrados al portar**, no los del informe
interno del paquete. Cada uno se corrigió en la integración.

### 3.1 Corregidos por reescritura de infraestructura

| # | Hallazgo | Impacto | Corrección |
|---|---|---|---|
| A-01 | `reserved_units` se leía desde el `RETURNING` del mismo `UPDATE` que lo ponía a cero | La compensación de presupuesto liberaba **0 unidades** en silencio: cada asset muerto dejaba cuota apartada para siempre | CTE que lee con `FOR UPDATE` y escribe en la misma sentencia (`markReady`, `releaseReservation`, `sweepExhausted`) |
| A-02 | Sin espera entre reintentos de un asset (la aportaba el backoff de pg-boss) | Al perder el broker, un proveedor caído consumiría los 4 intentos del asset en 20 s | Columna `next_attempt_at` + `AUDIO_GENERATION_RETRY_DELAY_SECONDS` |
| A-03 | El worker tenía **las dos** credenciales: la del proveedor y la clave de cifrado del texto | Duplicaba el número de procesos capaces de descifrar datos personales sin reducir ninguna exposición | La clave de datos queda sólo en la API, que entrega el texto ya descifrado por el canal interno autenticado |
| A-04 | El asset agotado que muere en `GENERATING` sólo se cerraba al recibirse su mensaje de DLQ | Sin broker no hay DLQ: quedaría `GENERATING` para siempre con su reserva retenida | `sweepExhausted` cubre los dos caminos (`FAILED_RETRYABLE` agotado y `GENERATING` con lease expirado) |

### 3.2 Riesgos de diseño que el paquete no cubría

| # | Hallazgo | Impacto | Corrección |
|---|---|---|---|
| B-01 | **La caché era global.** El texto renderizado de una plantilla dinámica puede llevar el nombre de un paciente, y `asset_key` no incluía el tenant | Dos tenants compartirían la fila del audio de "María": un acierto de caché sería la prueba de que ese nombre existe en el otro tenant | `tenant_id` en el asset y **en la identidad**; `DYNAMIC` → por tenant, `STATIC`/`FALLBACK` → compartido (su texto no depende de nadie). Sin tenant en contexto, una plantilla dinámica falla en vez de cachearse mal |
| B-02 | `actorId` era un parámetro libre del llamador | Expuesto por HTTP, rotar el valor salta el cupo diario y usar el de otra persona le gasta su cuota | `actorId` **no existe** en el DTO: el cupo se imputa al sujeto del token. Los llamadores internos lo declaran por inyección |
| B-03 | La revalidación de presupuesto vivía en el worker | Con el worker sin acceso a la base, esa comprobación desaparecía | Se hace en `claim`, que es además el sitio correcto: la API es quien conoce el presupuesto, y el asset que no pasa se cierra ahí mismo devolviendo su reserva |
| B-04 | Un asset cuyo texto ya no se puede descifrar (clave rotada sin conservar la anterior) se reintentaba | Cada intento vuelve a reclamarlo y a fallar hasta agotar el techo | `claim` lo cierra de forma permanente y lo cuenta en `skipped` |

### 3.3 Aceptados con su motivo

| # | Punto | Decisión |
|---|---|---|
| C-01 | El cortacircuitos del kernel abre por **proporción de fallos en una ventana**, no por N fallos consecutivos | Se acepta el cambio de semántica: `AUDIO_TTS_CB_FAILURE_THRESHOLD` pasa a ser el tamaño mínimo de la ventana. Se gana que su estado se publique en la misma sonda `/status` que el resto |
| C-02 | El ritmo del proveedor es **por proceso**, no distribuido | Un limitador distribuido necesita almacén compartido y decisión propia. Mientras no exista, `AUDIO_TTS_REPLICA_COUNT` divide la cuota: es la única forma honesta de que escalar no multiplique el gasto en silencio |
| C-03 | **Sin métricas propias.** El paquete traía un puerto de métricas y un recolector en memoria | Este backend tiene trazas (OTel), no un recolector de métricas. Mantener un puerto con una implementación que nadie recoge es peor que no tenerlo: el estado se publica por logs con eventos estables, por `GET /audio-tts/budget` y por la sonda del worker |
| C-04 | **Sin políticas RLS en `audio_tts`** | El camino del worker es cross-tenant por diseño (reclama assets de todos los tenants con token `SYSTEM`). Una política sobre `app.current_tenant_id` bloquearía ese camino o tendría que admitir el contexto vacío, que es una política que no aísla. El aislamiento se aplica en la identidad del asset (§B-01) y en el filtro de las lecturas. **Queda declarado como deuda**: si en el futuro `RLS_ENFORCE` se generaliza, este schema necesita una política con elevación explícita para el rol de sistema |
| C-05 | `local.catalog.ts` fuera de los catálogos generados | `schemas.catalog.ts`, `indexes/` y `foreign-keys/` los reescribe `yarn orm:catalog` desde la bóveda SALUD. Una línea añadida a mano ahí desaparecería en la siguiente regeneración **en silencio**, y el arranque siguiente fallaría con "schema does not exist" sin que nadie lo atara a un comando de hace tres semanas |

## 4. Evidencia de la integración

### 4.1 Pipeline del repositorio

| Comando | Resultado |
|---|---|
| `yarn typecheck` | **sin diagnósticos** |
| `yarn lint` | **0 errores, 0 advertencias** |
| `yarn test` | **456 suites, 4.698 pruebas verdes** (43 s) — de las cuales **16 suites y 174 pruebas** son del dominio de audio |
| `yarn build` | **correcto**; `dist/src/worker-audio_tts.js` emitido |
| `docker compose config` | **válido** con el servicio `worker-audio_tts` |
| `yarn redesa:guardrails` | **sin hallazgos nuevos** (los 2 existentes son de `scheduling` y `system_context`) |
| `yarn redesa:coverage` | `audio_tts` sin tablas huérfanas, sin endpoints sin rol y sin accesos cross-domain |

### 4.2 Materialización del esquema contra PostgreSQL 18 real

Arrancando la API con `ORM_SCHEMA_SYNC=safe` contra la base de desarrollo:

- **5 tablas** creadas en el schema `audio_tts`;
- **12 índices**, 3 de ellos únicos (`ux_audio_assets_asset_key`,
  `ux_audio_generation_usage_asset`, `ux_audio_budget_month_window`) y 2 parciales
  para las consultas calientes del worker;
- **8 restricciones CHECK** y **4 claves ajenas** (incluida `tenant_id` →
  `directory.tenants`);
- **2 triggers** de `updated_at`;
- **3 plantillas** sembradas de forma idempotente, **sin generar audio**.

### 4.3 Flujo completo con el proveedor de pruebas

| Paso | Resultado observado |
|---|---|
| `resolve` (1.ª vez) | `QUEUED`, asset `PENDING`, texto cifrado en base (`v2.k1.…`), tenant asignado, 48 unidades reservadas |
| `resolve` (2.ª vez, mismo audio) | **mismo `assetId`**; presupuesto sigue con **una** reserva (48, no 96) y el cupo del actor en **1**: el perdedor de la carrera devolvió las dos cosas |
| Tick del worker | reclama, sintetiza, almacena y reporta: asset `READY`, 516 bytes, checksum, `reserved_units=0` |
| Contabilidad | `settled=48`, **1** fila de consumo (el único por `asset_id` funcionando) |
| `resolve` (3.ª vez) | `READY` con `cacheHit: true` — sin cuota, sin proveedor, sin fila nueva |
| Presupuesto agotado + audio nuevo | `FALLBACK` al audio compartido con `reason: MONTHLY_BUDGET_RESERVED` |
| Variable `<script>alert(1)</script>` | `422 AUDIO_TEMPLATE_VARIABLE_INVALID` |
| Cuerpo con `actorId` | `400 property actorId should not exist` |
| `jobs/claim` con token de rol `USER` | `403 Rol insuficiente` |

### 4.4 Flujo completo con **ElevenLabs real**

Con la credencial del usuario configurada en `.env` (fuera de git):

| Comprobación | Resultado |
|---|---|
| Alcance de la clave | Sólo `text_to_speech`: `user_read`, `voices_read` y `models_read` responden `missing_permissions`. Por eso voz y modelo se declaran a mano en vez de descubrirse |
| Plan | **Gratuito**: las voces de librería devuelven `402 paid_plan_required`. `EXAVITQu4vr4xnSDxMaL` sí está incluida y verificada |
| Modelos probados | `eleven_multilingual_v2`, `eleven_v3` y `eleven_flash_v2_5` responden 200. Se fija **`eleven_multilingual_v2`** por ser el estable con español declarado |
| `prewarm` del fallback | **45.601 bytes**, `usageUnits: 41`, **`usageIsReported: true`**, 1.188 ms |
| `resolve` dinámico ("María") | **43.511 bytes**, asset `READY`, segundo `resolve` → `cacheHit: true` |
| Ficheros en disco | `file -b` → *"Audio file with ID3 version 2.4.0, MPEG ADTS, layer III, v1, 128 kbps, 44.1 kHz, Monaural"* — audio real, no bytes con forma de audio |
| Conciliación | `settledUnits: 89` == `recordedUnits: 89` en 2 generaciones (41 + 48) |
| Sonda del worker | `/status` publica `elevenlabs → closed, 2 muestras` junto al circuito de la API |

`usageIsReported: true` es el detalle que sólo el proveedor real podía confirmar:
la lectura de la cabecera `character-cost` funciona, así que la contabilidad usa el
coste **declarado por ElevenLabs** y no una estimación por caracteres.

## 5. Lo que queda fuera del alcance de este repositorio

Honestidad sobre el estado, en la línea del
[snapshot de preparación para producción](production-readiness-2026-07-31.md):

1. **La licencia comercial no está confirmada.** El plan es gratuito, así que
   `AUDIO_TTS_PROD_LICENSE_CONFIRMED` queda en `false` y con `NODE_ENV=production`
   **no se generaría un solo audio**. Es deliberado: sintetizar una voz de marca
   bajo un plan que no lo permite es un problema contractual que ningún reintento
   arregla.
2. **La voz es una voz genérica del proveedor** (`Sarah`), no una voz de marca. El
   perfil `brand_es_latam_v1` es hoy una etiqueta: cuando exista la voz real habrá
   que subir `AUDIO_TTS_VOICE_VERSION` y **volver a pre-generar los fallbacks**, o
   la degradación devolverá `UNAVAILABLE`.
3. **`AUDIO_STORAGE_DRIVER=local` no escala a más de un host.** El volumen
   compartido entre API y worker funciona en un despliegue de un nodo; producción
   necesita `s3` (el adaptador existe y firma URLs, pero **no se ha ejercitado
   contra un bucket real** en esta integración).
4. **RLS en `audio_tts`**: deuda declarada en §C-04.
5. **El presupuesto configurado (10.000 unidades/mes) es el del plan gratuito**, no
   una estimación de demanda real. Dimensionarlo requiere datos de uso.

## 6. Puesta en marcha

```bash
# 1. La API materializa el schema y siembra el catálogo (no gasta cuota).
yarn start:prod

# 2. Pre-generar los fallbacks ANTES de abrir tráfico: sin fallbacks READY, toda
#    degradación acaba en UNAVAILABLE aunque el sistema funcione.
curl -X POST /audio-tts/prewarm -d '{"templateCode":"onboarding.fallback.generic"}'
curl -X POST /audio-tts/prewarm -d '{"templateCode":"onboarding.welcome.generic"}'

# 3. El worker, en su propio proceso/contenedor.
yarn start:worker:audio_tts        # docker: worker-audio_tts
```

Contrato del dominio y decisiones de diseño:
[`src/modules/audio_tts/README.md`](../../src/modules/audio_tts/README.md).
