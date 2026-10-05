# Revisión transversal: infraestructura y configuración

## 1. Fecha, alcance y cobertura real

- Fecha: 2026-10-05. Rama `pablo/revision-backend-2026-10-04`; base observada `02af1e09`. Revisión documental y estática; **no se iniciaron servicios ni se consultó el VPS**.
- Se leyeron `Dockerfile`, los tres Compose principales, los cuatro archivos ejecutables/de build de `docker/db-init/`, `infra/otel-collector/otel-collector.config.yml`, el Compose y el script de secretos de `infra/monitoring/`, los scripts pertinentes de `scripts/`, `.env.example`, `.env.coolify.example`, los esquemas de entorno de API/worker y las sondas de salud. Los 24 entrypoints `src/worker-*.ts` se inventariaron y se inspeccionaron directamente los cuatro sin script. Se inventariaron por búsqueda las demás configuraciones de monitoreo y se contrastaron las afirmaciones operativas con `docs/operations/coolify.md`. No se leyó el contenido de ningún `.env` real ni se imprimieron credenciales reales.
- Verificación ejecutada: `docker compose --env-file .env.coolify.example -f docker-compose.coolify.yml config --quiet` → **0**; equivalente con `.env.example` y `docker-compose.yml` → **0**; `docker compose -f infra/monitoring/docker-compose.yml config --no-interpolate --quiet` → **0**; `bash -n docker/db-init/init-postgres.sh infra/monitoring/scripts/configure-secrets.sh` → **0**. Son comprobaciones de sintaxis/configuración, no de operación.
- `corepack yarn test --runInBand src/common/security/app-security.env.spec.ts src/common/auth/auth.env.spec.ts src/worker/worker.env.spec.ts` → **0**, `2` suites y `19` tests. Sólo existen los dos specs de seguridad de app y entorno worker; el patrón de `auth.env.spec.ts` no encontró archivo.
- Un inventario reproducible que compara `src/worker-*.ts`, comandos `dist/src/worker-*.js` de ambos Compose y claves `start:worker:*` del `package.json` halló **24/24** entrypoints en el compose local, **4/24** en Coolify y **20/24** con scripts del paquete. No se ejecutaron workers. No se probaron imágenes, redes, firewall, TLS real, healthchecks en vivo, migraciones ni disponibilidad de registros externos. La lógica interna del bot Python, las reglas de Prometheus y los dashboards Grafana quedaron inventariados, sin auditoría profunda. Un `config --quiet` válido no prueba que los secretos requeridos tengan valor.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Estado |
| --- | ---: | --- |
| Crítica | 0 | No se observó una fuga real ni escalada consumada. |
| Alta | 3 | IC-01: el script de monitoreo envía credenciales por HTTP con su URL por defecto; IC-02: la plantilla de Coolify publica PostgreSQL para testers sin exigir TLS; IC-06: `/readiness` devuelve 503 sin `reason` catalogado. Los dos primeros son riesgos condicionales, no evidencia de tráfico capturado. |
| Media | 2 | IC-03: el centinela de `postgres-init` puede saltar un DDL parcialmente aplicado al reintentar; IC-04: una plantilla ordena crear a mano la red que Compose debe crear. |
| Baja | 1 | IC-05: cuatro entrypoints carecen de scripts `start:worker:*` pese a existir en el compose local. |

**Refutaciones relevantes.** Los veinte workers ausentes de Coolify no son un olvido: el archivo los declara apagados a propósito por límite de tamaño y memoria ([docker-compose.coolify.yml:757](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L757)). La API ofrece `/health` de liveness y `/readiness` de dependencias por separado ([src/app.controller.ts:38](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app.controller.ts#L38)); usar `/health` en el healthcheck del contenedor es una decisión explícita y no se reporta como falla. Los secretos principales sí tienen validación de arranque: la API concatena los esquemas Joi ([src/app.module.ts:117](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app.module.ts#L117)), y el bootstrap worker concatena `authEnvSchema`, `workerEnvSchema` y otros ([src/worker/bootstrap.ts:75](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/bootstrap.ts#L75)).

## 3. Mapa de la unidad

| Componente | Entrada y salida | Protección observada |
| --- | --- | --- |
| Imagen API/workers | `Dockerfile` compila en etapas y arranca `dist/src/main.js`; Compose cambia `command` por worker. | Etapa runtime usa `NODE_ENV=production` y usuario `nodeapp` ([Dockerfile:54](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/Dockerfile#L54), [Dockerfile:83](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/Dockerfile#L83)). |
| Compose local | API, almacenes locales/perfiles e **24** workers con sus comandos. | Healthchecks API/worker, `stop_grace_period: 45s`, variables de ejemplo de desarrollo. |
| Compose Coolify | Paso `postgres-init` → `api-migrate` → API → **4** workers esenciales. Los otros 20 se omiten deliberadamente. | Healthcheck API y workers; los secretos de aplicación se pasan por `x-app-env`; `api-migrate` espera one-shots completados ([docker-compose.coolify.yml:641](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L641)). |
| Inicialización de bases | Imágenes de `docker/db-init/Dockerfile`; `init-postgres.sh` aplica DDL y patches. | `set -euo pipefail` y `psql -v ON_ERROR_STOP=1`; guarda de `iam.users` para `apply_all.sql` ([docker/db-init/init-postgres.sh:10](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker/db-init/init-postgres.sh#L10)). |
| Monitoreo | Stack separado: Prometheus, Alertmanager, Grafana, exporters, blackbox, autoheal y bot. | Healthchecks, redes internas para proxies de socket y variables requeridas por Compose ([infra/monitoring/docker-compose.yml:189](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/docker-compose.yml#L189)). |
| Contrato de salud | API: `GET /health`, `/liveness`, `/readiness`; workers: `/health`, `/liveness`, `/readiness`, `/status`. | `/health` de API es liveness 200; `/readiness` revisa PostgreSQL, Mongo, Redis, OpenSearch y RLS cuando está activado ([src/app-readiness.service.ts:39](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app-readiness.service.ts#L39)). |

No hay entidades, tablas nuevas ni eventos de negocio que diseñar en esta unidad. Los scripts del paquete cubren 20 de los 24 entrypoints; faltan `files`, `lakehouse`, `time_series` y `vector_rag`. La ausencia de scripts no impide los comandos Docker que sí están declarados.

## 4. Hallazgos por severidad, evidencia y plan

### IC-01 — Credenciales de Coolify enviadas por HTTP en el flujo por defecto — alta

**Evidencia.** [infra/monitoring/scripts/configure-secrets.sh:17](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/scripts/configure-secrets.sh#L17) define `COOLIFY_URL` por defecto con `http://…:8000`. El script carga `COOLIFY_TOKEN` ([línea 21](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/scripts/configure-secrets.sh#L21)), arma un JSON con el token de Telegram y la contraseña de Grafana ([línea 67](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/scripts/configure-secrets.sh#L67)) y lo manda con `curl -X PATCH` y encabezado `Authorization: Bearer` a esa URL ([línea 81](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/scripts/configure-secrets.sh#L81)). También invoca el endpoint de despliegue con el mismo token ([línea 92](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/infra/monitoring/scripts/configure-secrets.sh#L92)). `curl` no recibe ninguna exigencia de HTTPS ni túnel dentro del script.

**Problema, impacto y escenario.** Si una persona sigue la invocación documentada sin fijar `COOLIFY_URL`, el token administrador y los secretos de monitoreo viajan por HTTP. Un observador de la ruta de red podría leerlos y usar el token para modificar el despliegue. No se ejecutó el script ni se comprobó si operadores reales sobreescriben la URL: **queda refutada una afirmación de fuga efectiva**. Además, `-H "Authorization: Bearer …"` y `-d "$PAYLOAD"` colocan secretos en argumentos del proceso `curl`; es un segundo canal local de exposición, sin afirmar que haya sido observado en un proceso vivo.

**Plan de corrección.** (1) Cambiar el valor por defecto a un endpoint HTTPS validado o exigir `COOLIFY_URL` explícito con `https://` y rechazar HTTP salvo un túnel local acotado. (2) Evitar secretos en `argv`: pasar encabezado y cuerpo mediante descriptores/archivo temporal de permisos 0600 o una implementación que no exponga argumentos; limpiar el archivo al finalizar. (3) Documentar la URL segura y rotar token/secretos si se confirma que este flujo se usó por HTTP. (4) Probar con un sustituto local de `curl` sin contactar Coolify. Riesgo: despliegues antiguos que dependen del default HTTP; no hay DDL.

### IC-02 — Puerto PostgreSQL público y acceso de testers sin TLS — alta

**Evidencia.** [docker-compose.coolify.yml:404](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L404) publica `"${POSTGRES_PUBLIC_PORT:-5432}:5432"` sin ligar la IP a loopback. La intención está escrita en el mismo archivo ([línea 396](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L396)) y en [docs/operations/coolify.md:308](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docs/operations/coolify.md#L308). La guía indica que la conexión remota del tester no usa TLS ([línea 315](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docs/operations/coolify.md#L315)); la URL de ejemplo no exige `sslmode` ([línea 364](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docs/operations/coolify.md#L364)). La plantilla deja `DB_SSL=` vacío ([.env.coolify.example:36](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/.env.coolify.example#L36)), pero esa variable de cliente no habilitaría TLS del servidor por sí sola.

**Problema, impacto y escenario.** Si se abre el puerto en el firewall, como indica la guía, consultas de una base clínica pueden circular sin cifrado por Internet. Un rol de sólo lectura reduce daños de escritura, pero no protege la confidencialidad de las filas. La publicación es **deliberada**, por lo que se refuta «puerto expuesto por descuido». No se observó el firewall real ni una sesión remota, así que no se afirma que hoy sea alcanzable o que haya habido interceptación. La guía menciona SCRAM; no se infiere aquí que la contraseña literal viaje en claro.

**Plan de corrección.** (1) Cerrar el binding por defecto con `127.0.0.1` y usar túnel SSH/VPN para testers; si el acceso directo es requisito, habilitar TLS del servidor y exigirlo en `pg_hba.conf` y en clientes. (2) Restringir IPs de origen en firewall en vez de `ufw allow 5432/tcp` global. (3) Mantener rol lector de permisos mínimos y credenciales temporales. (4) Verificar desde una máquina de prueba autorizada que una conexión sin TLS sea rechazada y que la cifrada/túnel funcione. Riesgo: cambia el procedimiento de testers; no hay DDL.

### IC-06 — `/readiness` responde 503 sin `reason` catalogado — alta

**Evidencia.** [src/app-readiness.service.ts:51](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app-readiness.service.ts#L51) lanza `ServiceUnavailableException` con `code: ErrorCode.DEPENDENCY_UNAVAILABLE`, mensaje y `details.checks`, sin `details.reason`. [src/common/filters/all-exceptions.filter.ts:270](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L270) copia `obj.details` de una `HttpException` sin añadir `reason`, y [línea 164](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L164) arma el cuerpo con esos mismos `details`. La ruta pública está en [src/app.controller.ts:63](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app.controller.ts#L63).

**Problema, impacto y escenario.** Cuando falla PostgreSQL, MongoDB, Redis, OpenSearch o el chequeo RLS, el cliente recibe el status y código correctos pero carece de razón de negocio estable para distinguir esta falla catalogada. La refutación confirma que `details.reason` dentro de `DependencyStatus` se usa sólo en la estructura interna y se elimina al crear `publicChecks` ([src/app-readiness.service.ts:46](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/app-readiness.service.ts#L46)); tampoco lo agrega el filtro. No se ejercitó la ruta HTTP real. Este hallazgo se solapa con `catalogo-errores` y debe deduplicarse en el informe maestro.

**Plan de corrección.** (1) Definir en el catálogo transversal un reason estable propuesto `READINESS_DEPENDENCY_UNAVAILABLE` para HTTP 503 + `ErrorCode.DEPENDENCY_UNAVAILABLE`. (2) Emitirlo en `details.reason` mediante una `DomainException` apropiada, manteniendo `checks` sin mensajes internos. (3) Añadir prueba dirigida de respuesta serializada y prueba de sanitización. (4) Contrastar el nombre final con `catalogo-errores` antes de implementar para evitar duplicados. Riesgo: consumidores que comparan el cuerpo exacto; no hay DDL.

### IC-03 — Reintento de `postgres-init` puede omitir DDL relacional incompleto — media

**Evidencia.** [docker/db-init/init-postgres.sh:27](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker/db-init/init-postgres.sh#L27) usa únicamente `to_regclass('iam.users')` como centinela para saltar **todo** `apply_all.sql`; [línea 32](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker/db-init/init-postgres.sh#L32) ejecuta `psql -f` sin `--single-transaction`. El archivo generado [database/SQL/apply_all.sql:7](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/apply_all.sql#L7) aplica módulos por `\ir` en secuencia: IAM aparece antes que la mayoría de esquemas ([línea 22](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/apply_all.sql#L22)). Un fallo después de crear `iam.users` deja objetos anteriores persistidos; al reintentar, el centinela hace `skip` y deja de procesar lo posterior. El one-shot `postgres-init` es requisito de `api-migrate` en Coolify ([docker-compose.coolify.yml:645](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L645)).

**Problema, impacto y escenario.** Un error intermedio de DDL seguido de un redespliegue puede hacer que el init declare éxito sin repetir módulos omitidos. `api-migrate` en modo `safe` puede reparar algunas tablas/columnas; no se demostró que reponga índices, constraints o todo el DDL, por lo que no se presenta la corrupción como hecho consumado. Se refuta el caso de base totalmente nueva sin error: ahí el centinela es falso y se ejecuta el archivo completo.

**Plan de corrección.** (1) Aplicar `apply_all.sql` en una sola transacción cuando sus sentencias lo permitan, o usar un registro de migración por etapa con verificación de todos los módulos, no una tabla temprana. (2) En base incompleta, abortar con diagnóstico de etapa en lugar de marcar completado. (3) Añadir prueba de fallo inyectado tras IAM y reinicio sobre una base sintética. (4) Ejecutar `scripts/db/verify-clean-init.sh` sólo en un entorno de prueba aislado tras preparar la corrección; no se ejecutó aquí. Riesgo: scripts DDL que no admitan transacción global; revisar antes de elegir esa opción. No se propone DDL clínico nuevo.

### IC-04 — Plantilla manda crear manualmente la red que Compose posee — media

**Evidencia.** [.env.coolify.example:85](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/.env.coolify.example#L85) instruye `docker network create alovida` antes del despliegue. El compose define `alovida` sin `external` y con nombre fijo ([docker-compose.coolify.yml:809](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L809)); su propia cabecera advierte que crearla a mano produce `incorrect label com.docker.compose.network` y bloquea el stack ([línea 67](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L67)). La guía operativa vigente también dice «no hay que hacer nada» ([docs/operations/coolify.md:56](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docs/operations/coolify.md#L56)).

**Problema, impacto y escenario.** Quien siga la plantilla en una instalación nueva puede crear una red sin las etiquetas de Compose y bloquear el primer despliegue. El caso está sustentado por configuración y una advertencia explícita del propio proyecto; no se creó una red real en esta revisión. **Refutación:** no falta una red `external`; que sólo cuatro workers corran en Coolify no cambia quién posee esta red.

**Plan de corrección.** (1) Quitar de `.env.coolify.example` la instrucción de crearla y enlazar la guía actual. (2) Mantener el orden backend primero, frontend después. (3) Verificar estáticamente que ningún documento activo vuelva a recomendar `docker network create alovida`. (4) Probar en un proyecto Docker aislado la creación automática de Compose; no usar la red ni el VPS reales. No hay DDL.

### IC-05 — Cuatro workers sin script de arranque en el paquete — baja

**Evidencia.** Los entrypoints [files](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker-files.ts#L1), [lakehouse](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker-lakehouse.ts#L1), [time_series](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker-time_series.ts#L1) y [vector_rag](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker-vector_rag.ts#L1) existen; el compose local los invoca ([docker-compose.yml:677](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.yml#L677), [docker-compose.yml:1169](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.yml#L1169), [docker-compose.yml:1191](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.yml#L1191), [docker-compose.yml:1145](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.yml#L1145)). El inventario de claves `package.json.scripts` encontró 20 nombres `start:worker:*`, ninguno de esos cuatro; la lista termina con audio assets antes de `infra:*` ([package.json:137](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/package.json#L137)).

**Problema, impacto y escenario.** `corepack yarn start:worker:lakehouse` y sus equivalentes no existen, lo que dificulta arranque dirigido fuera de Compose. Esto **no** rompe el compose local ni prueba que esos jobs estén inactivos: ambos puntos quedan refutados por los comandos explícitos del compose. Plan: agregar pares de scripts prod/dev para esos cuatro, mantener la convención de nombres y comprobar que los 24 scripts apuntan a archivos emitidos. Riesgo bajo; no hay DDL.

## 5. Cuatro pruebas propuestas por hallazgo

Estas pruebas **no se ejecutaron**. El contrato `HttpStatus + ErrorCode + reason` de `DomainException` sí aplica a `/readiness` (IC-06). No aplica a un script de shell, un binding de Docker, una migración CLI ni la ausencia de una clave en `package.json`; sus fallas se observan por salida de proceso, estado de conexión o SQLSTATE.

| Hallazgo | Caso | Tipo/spec propuesto | Preparación y entrada exacta | Resultado esperado |
| --- | --- | --- | --- | --- |
| IC-01 | Correcto | Unit de shell, `infra/monitoring/tests/configure-secrets.test.sh` | `COOLIFY_URL=https://coolify.example.invalid`; stub de `curl`; secretos sintéticos. | Requests al stub con esquema HTTPS y sin secreto en `argv`. |
| IC-01 | Límite | Unit de shell, mismo spec | URL `http://127.0.0.1:8000` con túnel local explícitamente autorizado. | Se acepta sólo si el modo de túnel está declarado; sin él se rechaza. |
| IC-01 | Error | Unit de shell, mismo spec | URL `http://example.invalid:8000`, secretos sintéticos. | Aborta antes del primer request; salida distinta de 0. |
| IC-01 | Falla catalogada | No aplica: script externo | Misma entrada HTTP inválida. | Diagnóstico sin valores de secreto; `HttpStatus`, `ErrorCode`, `reason`: no aplican. |
| IC-02 | Correcto | Integración de red/TLS, `test/infra/postgres-access.int-spec.ts` | Compose corregido; cliente con túnel o `sslmode=verify-full`, rol lector sintético. | `SELECT 1` funciona sólo por ruta cifrada/permitida. |
| IC-02 | Límite | Integración de red, mismo spec | Cliente desde IP fuera de allowlist. | Conexión rechazada antes de autenticación. |
| IC-02 | Error | Integración TLS, mismo spec | Cliente con `sslmode=disable` a puerto público. | Conexión rechazada; ninguna fila clínica transmitida. |
| IC-02 | Falla catalogada | No aplica: PostgreSQL, no endpoint HTTP | Conexión insegura del caso anterior. | Error de transporte/SQLSTATE comprobable; sin `DomainException`. |
| IC-03 | Correcto | Integración con DB sintética, `test/infra/postgres-init.int-spec.ts` | Base vacía; ejecutar init corregido. | Todos los módulos y FK centinela existen; salida 0. |
| IC-03 | Límite | Integración con DB sintética, mismo spec | Interrumpir después de crear `iam.users`, antes de `02_common`; reintentar. | Se completa DDL restante o aborta explícitamente; nunca éxito con módulos ausentes. |
| IC-03 | Error | Integración con DB sintética, mismo spec | Inyectar SQL inválido a mitad del DDL en fixture. | Salida distinta de 0; la siguiente corrida no salta el archivo incompleto. |
| IC-03 | Falla catalogada | No aplica: `psql` one-shot | Error SQL inyectado. | Código de salida y SQLSTATE/etapa; sin `HttpStatus`, `ErrorCode` ni `reason`. |
| IC-04 | Correcto | Estático, `test/infra/network-docs.test.mjs` | Buscar instrucciones activas en `.env.coolify.example` y guía. | No aparece `docker network create alovida`; Compose conserva red propia. |
| IC-04 | Límite | Compose en proyecto efímero, mismo spec | Red ausente; desplegar sólo red/servicio sintético aislado. | Compose crea la red con etiquetas de proyecto. |
| IC-04 | Error | Compose en proyecto efímero, mismo spec | Crear red homónima sin etiquetas y levantar fixture. | Error claro de propiedad; procedimiento documentado evita ese paso. |
| IC-04 | Falla catalogada | No aplica: Docker Compose | Colisión de red del caso anterior. | Código distinto de 0 y diagnóstico `incorrect label`; sin catálogo HTTP. |
| IC-05 | Correcto | Estático, `test/infra/worker-scripts.test.mjs` | Comparar 24 archivos `src/worker-*.ts` con 24 pares de scripts prod/dev. | Diferencia vacía; cada comando apunta al entrypoint correcto. |
| IC-05 | Límite | Estático, mismo spec | Incluir nombres con guion (`audio-assets`) y guion bajo (`time_series`). | La normalización no confunde nombres; 24 pares únicos. |
| IC-05 | Error | Estático, mismo spec | Eliminar un script en fixture. | El gate falla e informa el nombre faltante. |
| IC-05 | Falla catalogada | No aplica: `package.json`/CLI | Invocar script ausente en fixture. | Yarn devuelve error de script desconocido; sin `DomainException`. |
| IC-06 | Correcto | Integración HTTP, `test/integration/readiness.int-spec.ts` | Almacenes de prueba aislados con datos sintéticos sanos; `GET /readiness`. | HTTP 200, `status: ok` y checks sin mensajes internos. |
| IC-06 | Límite | Integración HTTP, mismo spec | Una sonda supera `READINESS_TIMEOUT_MS=3000`; `GET /readiness`. | HTTP 503 en tiempo acotado; check afectado marcado `down`. |
| IC-06 | Error | Integración HTTP, mismo spec | Una dependencia de prueba devuelve error de driver con texto sintético; `GET /readiness`. | HTTP 503; el texto del driver no aparece en respuesta. |
| IC-06 | Falla catalogada | Integración HTTP, mismo spec | Misma dependencia caída. | HTTP **503**, `code=DEPENDENCY_UNAVAILABLE`, `details.reason=READINESS_DEPENDENCY_UNAVAILABLE` tras crear ese reason en el catálogo. |

## 6. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Compose local | `config --quiet` con `.env.example`: **0 observado**. | Perfil `local-db` y `malware-scan` en parseo estático. | Variable obligatoria vacía al arrancar debe detener servicio, pendiente. | No aplica al parser; salida CLI. |
| Compose Coolify | `config --quiet` con plantilla: **0 observado**. | Red propia, cuatro workers esenciales y veinte omitidos deliberadamente. | Colisión de red preexistente; prueba aislada pendiente. | No aplica a Compose; salida CLI. |
| API | Joi valida secretos de producción; specs dirigidos pasaron. | `/health` 200 con dependencias caídas y `/readiness` separado, por diseño. | Dependencia obligatoria caída: `/readiness` debe devolver 503, prueba funcional pendiente. | IC-06: esperar HTTP 503, `DEPENDENCY_UNAVAILABLE` y reason nuevo `READINESS_DEPENDENCY_UNAVAILABLE`; falta implementar y ejecutar. |
| Workers | 24 entrypoints y 24 comandos en Compose local observados. | 4 en Coolify por decisión documentada; `worker-files` requiere perfil `malware-scan` local. | Config inválida debe abortar bootstrap, cubierto parcialmente por 19 tests dirigidos. | Sonda de worker expone 503 y `reasons` operativos ([src/worker/worker-health.server.ts:117](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/worker-health.server.ts#L117)); no es una ruta de negocio `DomainException`. |
| Monitoreo | Compose parsea; redes de proxies Docker separadas. | `HEALTHCHECKS_PING_URL` opcional y bot sin servicios reales en esta revisión. | URL HTTP predeterminada debe rechazarse después de la corrección. | Script shell, sin catálogo de API. |
| Inicialización DB | `bash -n` pasa; secuencia declarada en código. | Corte tras `iam.users` y reinicio: prueba pendiente. | DDL inválido debe abortar y no simular completitud. | `psql`/salida de proceso, no `DomainException`. |

## 7. Catálogo de errores

Reason propuesto a crear por IC-06: `READINESS_DEPENDENCY_UNAVAILABLE`, con HTTP 503 y `ErrorCode.DEPENDENCY_UNAVAILABLE`, cuando cualquier sonda obligatoria de `/readiness` falla. El nombre debe contrastarse con `catalogo-errores` antes de implementarlo. Reasons huérfanos o mal usados en otros módulos: **no evaluados**. Una falla de Compose, shell o `psql` no puede expresarse honestamente con `HttpStatus`, `ErrorCode` y `reason` de negocio.

## 8. Olas de ejecución y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia y criterio de salida |
| --- | --- | --- | --- |
| 0 | IC-01 | S | Acordar endpoint HTTPS/túnel, proteger argumentos; test con `curl` simulado, sin secretos reales. |
| 0 | IC-02 | M | Acordar acceso de testers; cerrar binding o proveer TLS y allowlist; verificar en entorno autorizado. |
| 1 | IC-06 | S | Coordinar con `catalogo-errores`; crear reason y prueba de respuesta serializada 503. |
| 1 | IC-03 | M | Elegir transacción global o ledger por etapa tras revisar compatibilidad DDL; prueba de fallo parcial sintético. |
| 1 | IC-04 | S | Corregir la plantilla y gate de contradicción documental. |
| 2 | IC-05 | S | Completar scripts y comprobar correspondencia con los 24 entrypoints. |

Ninguna corrección está implementada en esta rama por esta revisión. Las pruebas de integración propuestas requieren un entorno aislado y sintético; no se ejecutaron servicios reales.

## 9. Trabajo pendiente de integrar y decisiones

Los commits pendientes de integrar citados por el plan (§2) afectan módulos, DTOs, seeds y auth/files. `55339f05` menciona `package.json` y podría cambiar IC-05; contrastar los scripts cuando llegue a `dev`. No se clasificó como hallazgo que Coolify tenga cuatro workers: [docker-compose.coolify.yml:758](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/docker-compose.coolify.yml#L758) explica la decisión y sus límites. Tampoco se clasificó la ausencia de `HEALTHCHECK` en `Dockerfile`: ambos Compose definen sus sondas, y no se revisó un despliegue que ejecute esa imagen sola.

El `AGENTS.md` del worktree pide plan y reporte generales. El encargo de esta unidad limitó la escritura a `infra-config.md`; no se crearon otros documentos, no se modificó código y no se hizo commit ni PR.
