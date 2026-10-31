# Variables de entorno en producción

Esta página dice qué exige la API cuando arranca con `NODE_ENV=production`, dónde se valida cada
regla y qué variables son secretos. No trae valores: los secretos viven en el gestor de secretos
del despliegue y nunca en el repositorio. El inventario completo de variables, con sus valores por
defecto, está en [variables de entorno](../getting-started/environment-variables.md); cómo se
aplica la validación, en [configuración](../operations/configuration.md).

## Cómo se valida

La validación ocurre en tres lugares, y conviene distinguirlos porque fallan en momentos distintos:

| Capa | Dónde | Cuándo falla |
|---|---|---|
| Esquema global Joi | `src/app.module.ts:127-146` (`ConfigModule.forRoot({ validationSchema })`), concatenación de 15 esquemas | Antes de construir ningún módulo: el proceso no llega a escuchar |
| Guardas `assert*` / `load*` | Cada `*.env.ts` | Al instanciar el servicio que lee esa configuración (arranque de la API o de un worker) |
| Sondas de arranque | `src/orm/config/runtime-role.guard.ts`, `src/app-readiness.service.ts` | En `OnApplicationBootstrap` y en cada `GET /readiness` |

El esquema global incluye tres esquemas que no viven en un `*.env.ts`:
`admissionIdentityEnvSchema` (`src/modules/clinical/services/inpatient/admission-identity.ts`),
`admissionsEnvSchema` (`src/modules/profiles/domain/admissions/admissions.config.ts`) y
`telemetryEnvSchema` (`src/observability/telemetry.config.ts`). Esta página los cubre igual.

### Lo que exige el esquema global, medido

Se reprodujo la concatenación de `app.module.ts` y se validó con `abortEarly: false`. Con
**solo** `NODE_ENV=production` el arranque se rechaza por diez variables:

```text
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME            "is required"
JWT_SECRET, MFA_ENCRYPTION_KEY, WEBHOOK_SIGNING_KEY,
DOWNLOAD_URL_SECRET, ADMISSION_ID_HMAC_KEY                 "is required"
```

Con los valores de desarrollo del repositorio, el rechazo es por valor inválido o por largo:

```text
JWT_SECRET / MFA_ENCRYPTION_KEY / DOWNLOAD_URL_SECRET /
ADMISSION_ID_HMAC_KEY        "contains an invalid value"   (es el valor de desarrollo)
MFA_ENCRYPTION_KEY / WEBHOOK_SIGNING_KEY /
DOWNLOAD_URL_SECRET          "length must be at least 32 characters long"
PHARMACY_ERP_BASE_URL        "must be []"                  (tiene que quedar vacía)
DEV_VERIFICATION_BYPASS      "must be [false]"
```

Con las cinco `DB_*` y los cinco secretos de 32 caracteres o más, distintos de los de desarrollo,
el esquema global no informa ningún error. Pasar el esquema no basta para arrancar: las guardas y
la sonda del rol de base de datos de las secciones siguientes también deciden.

## Obligatorias para arrancar

| Variable | Regla en producción | Dónde se valida | Secreto |
|---|---|---|---|
| `NODE_ENV` | `production`. Activa todas las reglas de esta página | Cada esquema que usa `.when('NODE_ENV', …)` | No |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME` | Obligatorias (en todo entorno). `DB_USER` es el rol dueño: queda para DDL, migraciones y semillas | `src/orm/config/orm.env.ts:104-108` | No |
| `DB_PASSWORD` | Obligatoria (en todo entorno) | `src/orm/config/orm.env.ts:107` | **Sí** |
| `JWT_SECRET` | Obligatorio, ≥ 32 caracteres, distinto del valor de desarrollo | `src/common/auth/auth.env.ts:27-35`; además `loadAuthEnv` aborta en `auth.env.ts:101-106` | **Sí** |
| `MFA_ENCRYPTION_KEY` | Obligatoria, ≥ 32, distinta del valor de desarrollo | `src/common/security/app-security.env.ts:22-26` | **Sí** |
| `WEBHOOK_SIGNING_KEY` | Obligatoria, ≥ 32, distinta del valor de desarrollo | `src/common/security/app-security.env.ts:27-31` | **Sí** |
| `DOWNLOAD_URL_SECRET` | Obligatoria, ≥ 32, distinta del valor de desarrollo | `src/common/security/app-security.env.ts:32-36` | **Sí** |
| `ADMISSION_ID_HMAC_KEY` | Obligatoria, ≥ 32, distinta del valor de desarrollo. Sin ella la huella del documento de identidad del ingreso no se puede recuperar | `src/modules/clinical/services/inpatient/admission-identity.ts:17-21`; además lanza en `:36-39` | **Sí** |

## Prohibidas o forzadas en producción

| Variable | Regla en producción | Dónde se valida | Secreto |
|---|---|---|---|
| `DEV_VERIFICATION_BYPASS` | Solo `false` (o ausente). Con `true` expondría profesionales sin verificar | Esquema: `src/common/verification/verification-bypass.env.ts:16-24`; guarda: `:52-64`, invocada en `verification-bypass.service.ts:29` | No |
| `PHARMACY_ERP_BASE_URL` | Vacía. El único sistema externo que existe es el simulador, que inventaría stock | Esquema: `src/modules/pharmacy_inventory/infrastructure/adapters/pharmacy-erp.env.ts:17-21`; guarda: `:49-63` | No |
| `PHARMACY_ERP_API_KEY` | Sin uso mientras la URL quede vacía | `pharmacy-erp.env.ts:22` | **Sí** |
| `MOCK_PROVIDER_BASE_URL` | Vacía, o apuntando al proveedor real. El emulador acepta toda verificación de identidad y matrícula. Su valor por defecto en producción ya es vacío | Esquema: `src/worker/worker.env.ts:162-166`; guarda: `:246-260`, invocada en `src/worker/bootstrap.ts:68` (cada worker) | No |
| `MOCK_PROVIDER_API_KEY` | Solo con proveedor real | `src/worker/worker.env.ts:168` | **Sí** |
| `AUDIO_TTS_PROVIDER` | Distinto de `fake` | `src/modules/audio_assets/audio.env.ts:125-126` (`loadAudioEnv`) | No |
| `AUDIO_TTS_DATA_KEY` | ≥ 32 caracteres. En producción no tiene valor por defecto | Default: `audio.env.ts:66-72`; guarda: `:120-123` (`loadAudioEnv`, al instanciar la cola de audio) | **Sí** |

## Condicionales

Valen solo si se enciende la funcionalidad que las usa.

| Variable | Regla | Dónde se valida | Secreto |
|---|---|---|---|
| `FILE_STORAGE_ADAPTER` | `local` o `s3` | `src/common/storage/storage.env.ts:10-12` | No |
| `FILE_STORAGE_S3_BUCKET` | Obligatorio con `FILE_STORAGE_ADAPTER=s3` | Esquema: `storage.env.ts:20-26`; guarda: `:106-118`, invocada en `src/common/storage/file-storage.module.ts:21` | No |
| `FILE_STORAGE_S3_ACCESS_KEY_ID` · `FILE_STORAGE_S3_SECRET_ACCESS_KEY` | Las dos juntas o ninguna (sin ellas se usa la cadena de credenciales del entorno, p. ej. un rol IAM) | `storage.env.ts:43-55` y `:106-118` | **Sí** (la secreta) |
| `PAYMENTS_GATEWAY_BASE_URL` | Obligatoria con `PAYMENTS_VIA_GATEWAY=true` | `src/modules/payments/gateway/payments-gateway.env.ts:38-47` y `:175-179` | No |
| `PAYMENTS_GATEWAY_API_KEY` | Obligatoria con `PAYMENTS_VIA_GATEWAY=true`, forma `sk_test_…` o `sk_live_…` | `payments-gateway.env.ts:48-55` y `:180-185` | **Sí** |
| `PAYMENTS_GATEWAY_WEBHOOK_SECRETS` · `PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS` | Al menos una con `PAYMENTS_VIA_GATEWAY=true`; formato `whsec_…` / `whpk_…`. Admite varias para rotar | `payments-gateway.env.ts:186-208` | **Sí** (los `whsec_`) |
| `TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT` | ≥ 16 con el reenvío de analítica activo; en producción no tiene valor por defecto | Default: `src/modules/telemetry/web-analytics.env.ts:77-81`; guarda: `:174-181` | **Sí** |
| `GA4_MEASUREMENT_ID` · `GA4_API_SECRET` | Las dos con `TELEMETRY_WEB_ANALYTICS_PROVIDER=google_analytics` activo | `web-analytics.env.ts:182-188` | **Sí** (`GA4_API_SECRET`) |
| `DB_APP_USER` · `DB_APP_PASSWORD` | Si se declara el usuario, la contraseña es obligatoria. Es el rol de runtime sin `BYPASSRLS` ni dueño de tablas | `src/orm/config/orm.env.ts:114-121` | **Sí** (la contraseña) |
| `ELEVENLABS_API_KEY` | Solo con `AUDIO_TTS_PROVIDER=elevenlabs` | `audio.env.ts:73` | **Sí** |
| `GOOGLE_OAUTH_CLIENT_SECRET` · `GOOGLE_OAUTH_REFRESH_TOKEN` | Solo para el envío de correo por Gmail (worker de mensajería) | `src/worker/worker.env.ts:181-185` | **Sí** |
| `WEBHOOK_SECRET_<TENANT>_<NOMBRE>` · `WEBHOOK_SECRET_CARRIER_<CÓDIGO>` | Una por integración y transportista; sin ella el endpoint rechaza toda entrega | Documentadas en `.env.example:129-136`; no pasan por un `*.env.ts` | **Sí** |

## Rol de base de datos y RLS

No es un `*.env.ts`, pero decide si la API arranca en producción:

| Variable | Regla en producción | Dónde se valida | Secreto |
|---|---|---|---|
| (rol de conexión) | Con `NODE_ENV=production` la API inspecciona el rol con que conecta. Si es superusuario, tiene `BYPASSRLS` o es dueño de tablas con RLS sin `FORCE`, el arranque aborta con `SYSTEM_DB_ROLE_PRIVILEGED` | `src/orm/config/runtime-role.guard.ts:90-95` (cuándo), `:114-124` (fatal), `:158-166` (error) | — |
| `RLS_ENFORCE` | `true` junto con `DB_APP_USER`. Con un rol que respeta RLS y `RLS_ENFORCE` distinto de `true`, la API registra un error y las políticas ocultan todas las filas | `runtime-role.guard.ts:145-153` | No |
| `DB_ALLOW_PRIVILEGED_RUNTIME_ROLE` | Ausente. `true` tolera un rol privilegiado como excepción transitoria | `runtime-role.guard.ts:120` | No |
| `DB_ROLE_PURPOSE` | `migration` solo en el proceso de migración: lo exime de la sonda | `runtime-role.guard.ts:78-82` | No |

## Valores por defecto que cambian en producción

Estas variables no son obligatorias, pero su ausencia no se comporta igual que en desarrollo:

| Variable | Sin declarar, en producción | Dónde |
|---|---|---|
| `SEED_ON_BOOT`, `SEED_CONTENT_ON_BOOT` | Encendidas. El fallo de un seed núcleo aborta el arranque siempre; `SEED_CORE_FAILURE_FATAL` no lo apaga | `src/common/seed/seed-boot.env.ts:28-44` y `:91-98` |
| `ADMISSIONS_FOUR_EYES` | `true` (cuatro ojos en admisiones) | `src/modules/profiles/domain/admissions/admissions.config.ts:102-104` |
| `ADMISSIONS_SECURITY_ADMIN_INHERITS` | `false` | `admissions.config.ts:105-108` |
| `TELEMETRY_IDEMPOTENCY_SECRET` (secreto, ≥ 16) | Sin él no se deduplican los eventos anónimos: cada uno recibe una clave aleatoria | `src/modules/telemetry/telemetry-idempotency.env.ts:19-31` |
| `OBSERVABILITY_ACTOR_HASH_SECRET` (secreto, ≥ 16) | Sin él no se calcula `actor_hash`; si se declara con menos de 16 caracteres, lanza | `src/observability/capture/observability.env.ts:97-112` |
| (Swagger `/docs` y `/reference`) | No se montan | `src/main.ts:228-232` |

## Validaciones de formato sin regla de producción

Estos archivos validan forma y rango, pero no cambian con `NODE_ENV`:
`src/logging/logging.env.ts` (`LOG_LEVEL`, `LOG_PRETTY`),
`src/modules/common/malware-scan.env.ts` (`MALWARE_SCAN_ENABLED`, `CLAMD_*`; sin clamd las cargas
quedan en `SCAN_PENDING`),
`src/modules/ops_console/domain/instance-liveness.env.ts` (`OPS_LIVENESS_*`),
`src/observability/http-sli/http-sli.env.ts` (`OBSERVABILITY_HTTP_SLI_*`),
`src/observability/telemetry.config.ts` (`OTEL_*`),
`src/persistence/config/data-sources.env.ts` (`POSTGRES_*_URL`, `DB_READ_*`, `DATA_*`),
`src/modules/scheduling/infrastructure/config/agenda-notices.env.ts` (`WEB_APP_BASE_URL`) y el
resto de `src/worker/worker.env.ts` (`WORKER_*`, `TS_*`).

## Generar un secreto

Cada secreto de esta página se genera con 32 caracteres o más, por ejemplo:

```bash
openssl rand -base64 48
```

Los secretos de la pasarela (`whsec_…`, `sk_…`) los emite la pasarela; no se generan a mano.
