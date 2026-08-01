# Auditoría integral de preparación para producción — 2026-07-31

> Estado evaluado del repositorio `mantra-core-health-redesa-api` el 2026-07-31.
> Este documento es una fotografía verificable; no reemplaza una revisión de
> infraestructura, seguridad o cumplimiento en el entorno real de despliegue.
> El [snapshot anterior del 2026-07-30](production-readiness.md) se conserva por
> trazabilidad histórica.

## Actualización de remediación — 2026-07-31 20:05 BOT

Después de la fotografía inicial se ejecutó un ciclo adicional de cierre. Los
resultados anteriores se conservan debajo como evidencia de origen; esta tabla
es el estado vigente y evita presentar deuda ya corregida como si siguiera
abierta.

| Control                           | Estado actualizado                            | Evidencia                                                                                                                                                        |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint global                     | **APROBADO: 0 errores, 0 advertencias**       | `yarn lint --max-warnings=0` sobre runtime y pruebas                                                                                                             |
| TypeScript                        | **APROBADO**                                  | `yarn typecheck` sin diagnósticos                                                                                                                                |
| Build productivo                  | **APROBADO**                                  | `yarn build` sin diagnósticos ni errores de cierre                                                                                                               |
| Pruebas unitarias                 | **APROBADO: 402 suites, 3.945 pruebas**       | `yarn test --ci --maxWorkers=4`: 402/402 suites y 3.945/3.945 pruebas en 45,675 s                                                                                |
| Rendimiento de pruebas            | **REMEDIADO**                                 | SWC reemplaza ts-jest; la peor suite fría bajó de 59,455 s a 0,916 s; 4 workers y reciclaje a 768 MB                                                             |
| OpenAPI/Redocly                   | **APROBADO: 0 errores, 0 advertencias**       | 860 paths, 869 operaciones, 920 schemas, 174 tags, 7.262 enlaces de error; Redocly 2.43.2                                                                        |
| Catálogo Markdown de endpoints    | **APROBADO: 869/869**                         | 61 módulos y 62 archivos bajo `openapi/endpoints/`                                                                                                               |
| Auditoría de dependencias runtime | **APROBADO: 0 vulnerabilidades**              | override compatible `js-yaml` 5.2.2 para `@nestjs/swagger`                                                                                                       |
| Auditoría completa                | **Sin critical/high**                         | 3 avisos `moderate` de deprecación, confinados a tooling de build/test                                                                                           |
| AsyncAPI                          | **APROBADO: 0 errores, 0 advertencias**       | parser oficial mínimo; se eliminó el CLI que arrastraba Next.js y 900+ paquetes transitivos                                                                      |
| Catálogo de datos                 | **APROBADO: 1.185/1.185**                     | toda entidad implementada tiene propósito de negocio verificado                                                                                                  |
| Secretos de API                   | **REMEDIADO EN CÓDIGO**                       | MFA, webhooks y descargas fallan durante bootstrap si faltan o son débiles en producción                                                                         |
| Proveedor mock                    | **REMEDIADO EN CÓDIGO**                       | `MOCK_PROVIDER_BASE_URL` solo admite vacío bajo `NODE_ENV=production`                                                                                            |
| Health/readiness                  | **REMEDIADO EN CÓDIGO**                       | liveness separado y readiness con PostgreSQL, MongoDB, Redis y OpenSearch, timeout y 503                                                                         |
| RLS versionado                    | **APROBADO EN ENTORNO LOCAL DESECHABLE: 6/6** | fail-closed sin GUC; rol `NOLOGIN` al terminar, sin superuser/`BYPASSRLS`; lectura aislada, `WITH CHECK`, elevación `SYSTEM` explícita y `FORCE RLS` verificados |
| Cobertura y guardrails REDESA     | **APROBADO: 0 hallazgos**                     | 0 tablas huérfanas, 0 endpoints huérfanos, 0 accesos directos cross-domain y 0 violaciones de guardrails                                                         |
| Portal documental                 | **APROBADO**                                  | 183 páginas, 60 módulos, 565 enlaces internos sin roturas y MkDocs estricto correcto                                                                             |

El veredicto continúa siendo **NO-GO para un entorno productivo real** hasta
completar evidencia externa: restauración de los almacenes, infraestructura HA
privada, proveedores reales certificados, KMS/IAM/WAF/TLS, prueba RLS contra el
rol de cada ambiente, carga/pentest y aceptación formal de RPO/RTO. Esos puntos
no pueden cerrarse honestamente modificando únicamente este repositorio.

## 1. Veredicto ejecutivo de la fotografía inicial (histórico)

**NO-GO para producción.** El sistema compila y el contrato HTTP quedó
reconciliado con el código, pero todavía existen bloqueantes de aislamiento de
datos, operación, recuperación, integraciones externas, cadena de suministro y
calidad. Desplegar el `docker-compose.yml` actual como si fuese producción
expondría almacenes sin controles apropiados, ejecutaría la aplicación con el
usuario administrador de PostgreSQL, dejaría RLS desactivado y conectaría
procesos de negocio a proveedores simulados.

No debe interpretarse este NO-GO como que el producto carece de una base útil.
Hay controles valiosos ya implementados: JWT con algoritmo fijado, guards
globales, validación DTO, Helmet, límite de cuerpo, rate limiting, logs
estructurados, trazas OpenTelemetry opt-in, cierre ordenado, transacciones,
outbox, bloqueo optimista, imagen Docker multi-stage y usuario no root. El
problema es que los controles críticos aún no forman una cadena completa y
probada de producción.

### Resumen por severidad

| Prioridad       | Resultado                                 | Significado                                           |
| --------------- | ----------------------------------------- | ----------------------------------------------------- |
| P0 — bloqueante | 10 áreas principales identificadas        | Deben cerrarse o aceptarse formalmente antes de un GO |
| P1 — alta       | Hallazgos distribuidos en todas las capas | Deben entrar en el primer ciclo de endurecimiento     |
| P2 — media      | Deuda operativa y de sostenibilidad       | Necesaria para una operación estable                  |
| P3 — evolución  | Gobierno, eficiencia y madurez            | Evolución posterior al cierre de riesgos altos        |

## 2. Evidencia ejecutada en la fotografía inicial (histórico)

| Verificación                       | Resultado real                                                       | Estado               |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------- |
| `yarn build`                       | Compilación correcta                                                 | APROBADO             |
| `yarn typecheck`                   | Sin errores de TypeScript                                            | APROBADO             |
| `yarn docs:openapi:generate`       | Corregido el path del build; contrato regenerado desde `AppModule`   | APROBADO             |
| OpenAPI reconciliado               | 858 paths, 867 operaciones, 919 schemas, 174 tags                    | APROBADO con deuda   |
| `yarn docs:openapi:lint`           | 0 errores, 1.597 warnings                                            | APROBADO con deuda   |
| Documentación detallada            | 867/867 endpoints en 61 módulos                                      | APROBADO             |
| `yarn lint`                        | 29.110 problemas: 23.380 errores y 5.730 warnings                    | FALLIDO              |
| `yarn test --runInBand`            | No terminó después de más de 20 minutos; se interrumpió              | FALLIDO / INCONCLUSO |
| Pruebas focales de seguridad/error | 2 suites, 18 pruebas, todas correctas                                | APROBADO             |
| Auditoría de dependencias runtime  | 1 vulnerabilidad `high` (`js-yaml` 5.2.1)                            | FALLIDO              |
| Auditoría completa de dependencias | 61 hallazgos: 2 critical, 21 high, 35 moderate, 3 low                | FALLIDO              |
| Guardrails estáticos REDESA        | 4 avisos informativos en autoservicio de identidad                   | REVISAR              |
| Cobertura estática                 | 1.185 entidades, 865 decoradores de endpoint, 193 controllers        | INFORMATIVO          |
| Links documentales                 | 565 links internos, 0 rotos y 0 páginas huérfanas tras la corrección | APROBADO             |
| `yarn docs:build`                  | MkDocs estricto completó sin warnings de contenido                   | APROBADO             |
| OpenAPI / controladores            | Se detectaron y agregaron 13 operaciones ausentes; 0 eliminadas      | REMEDIADO            |

### Limitaciones de la ejecución inicial

- No se ejecutó la prueba RLS opt-in porque modifica el esquema y exige un
  entorno desechable expresamente autorizado.
- No se realizó un restore real de PostgreSQL, MongoDB, Redis, OpenSearch o
  almacenamiento de objetos; no existe evidencia versionada de un simulacro.
- No se hicieron pruebas de carga, penetración, caos, conmutación por error ni
  despliegue canary sobre infraestructura productiva.
- No se validaron DNS, TLS, WAF, KMS, IAM cloud, red privada ni observabilidad
  gestionada porque no existe manifiesto productivo ni entorno conectado.
- El resultado de auditoría de dependencias depende del advisory feed disponible
  el día indicado y debe ejecutarse de nuevo en cada build.

## 3. Correcciones seguras aplicadas durante la fotografía inicial

1. Se corrigió `tools/openapi/generate-openapi.mjs`: el build real genera
   `dist/src/app.module.js`, no `dist/app.module.js`.
2. Se regeneraron `openapi/openapi.yaml` y `openapi/openapi.json`. El contrato
   pasó de 854 a 867 operaciones y de 845 a 858 paths.
3. Se declararon correctamente como públicas las nuevas rutas de registro de
   paciente y verificación de correo. Redocly volvió a 0 errores.
4. Se eliminó una propiedad `theme` obsoleta de `redocly.yaml` que ya no era
   válida para la versión instalada del CLI.
5. Se regeneró la documentación ultra detallada: 867 endpoints distribuidos en
   61 módulos y 62 archivos Markdown bajo `openapi/endpoints/`.
6. `TenantContextInterceptor` ahora contrasta tanto `body.tenantId` como
   `query.tenantId` con el tenant autenticado. Esto protege ocho operaciones que
   aceptaban tenant por query incluso cuando `RLS_ENFORCE=false`.
7. Se añadieron tres pruebas de query multitenant y dos del contrato estable
   para 413/429; las dos suites focales quedaron en 18/18.
8. Los errores 413 y 429 ahora devuelven `PAYLOAD_TOO_LARGE` y `RATE_LIMITED`,
   en lugar de etiquetarse erróneamente como `INTERNAL`.
9. El workflow documental ahora regenera el catálogo de endpoints y falla si
   OpenAPI o la documentación generada difieren de lo versionado.
10. Se actualizó `REDESA-COBERTURA.md` con los conteos estáticos actuales.

Estas correcciones reducen riesgo, pero no convierten por sí solas el sistema en
apto para producción.

## 4. Bloqueantes P0 identificados en la fotografía inicial

### P0-01 — RLS desactivado y conexión con rol administrador

**Evidencia.** `docker-compose.yml` define `RLS_ENFORCE` con default `false` y
conecta API/workers con `DB_USER=${POSTGRES_USER}`. El interceptor solo configura
`app.current_tenant_id` cuando RLS está activo y la documentación del propio
código exige `DB_APP_USER` sin `BYPASSRLS`.

**Riesgo.** Una omisión de filtro en cualquier repositorio puede producir acceso
cruzado a datos de salud. Un usuario propietario/superuser puede saltarse las
políticas aun cuando existan.

**Cierre exigido.** Crear un rol runtime de mínimo privilegio, sin ownership,
superuser ni `BYPASSRLS`; habilitar `RLS_ENFORCE=true`; aplicar `FORCE ROW LEVEL
SECURITY` donde corresponda; ejecutar `test/integration/rls.int-spec.ts` contra
una base efímera; añadir pruebas negativas por tabla y por cada store no SQL.

### P0-02 — Aislamiento multitenant no es homogéneo entre entradas y almacenes

**Evidencia.** Se corrigió la query para ocho operaciones (`authz`, `clinical`,
`scheduling`, `time_series` y `document_store`), pero los parámetros de ruta y
los almacenes MongoDB/OpenSearch/Redis/MinIO no pueden depender del RLS de
PostgreSQL. Además existen defaults `SEED.tenantId` en servicios runtime.

**Riesgo.** IDOR/BOLA y lectura, actualización o borrado cross-tenant por una
ruta que olvide aplicar el filtro. El fallo es especialmente grave en historias
clínicas, documentos y búsquedas.

**Cierre exigido.** Definir una política única de `TenantScope`; derivar el
tenant del contexto, no del cliente; clasificar los parámetros de tenant como
propietario o contraparte; eliminar defaults de seed en producción; crear tests
de autorización por endpoint y adaptador; incluir tenant en cada clave/índice de
Mongo, Redis, búsqueda y objetos.

### P0-03 — Sin backup/restore probado ni objetivos de recuperación

**Evidencia.** No hay registro de backup automatizado, retención, cifrado,
replicación, RPO/RTO aprobado ni ejercicio de restauración para los cinco
almacenes. Los volúmenes de Compose solo aportan persistencia local, no DR.

**Riesgo.** Pérdida irreversible de datos clínicos y evidencia de auditoría;
incapacidad de demostrar continuidad o recuperación.

**Cierre exigido.** Acordar RPO/RTO por dominio; backups PITR de PostgreSQL,
snapshots/replicas de Mongo/OpenSearch, estrategia explícita para Redis, versionado
y retención de objetos; cifrado con KMS; copias cross-region/cross-account; restore
automatizado en entorno aislado; acta de simulacro con tiempos y checksums.

### P0-04 — `docker-compose.yml` es desarrollo, no un despliegue productivo

**Evidencia.** El encabezado lo identifica como desarrollo local, aunque ejecuta
`NODE_ENV=production`. Publica puertos de PostgreSQL, MongoDB, Redis, OpenSearch,
MinIO y el mock; Mongo/Redis no tienen autenticación ni TLS; OpenSearch desactiva
su plugin de seguridad y usa un único nodo.

**Riesgo.** Exposición de datos, movimiento lateral, punto único de fallo y falsa
sensación de seguridad por usar la etiqueta `production` de Node.

**Cierre exigido.** Crear manifiestos productivos independientes; red privada;
solo ingress HTTPS hacia la API; TLS/mTLS interno según riesgo; secretos desde
un secret manager; HA/multi-AZ; políticas de red; Pod Security; PDB; autoscaling;
servicios gestionados o clusters endurecidos. Nunca promover el Compose local.

### P0-05 — Proveedores simulados configurados por defecto

**Evidencia.** `MOCK_PROVIDER_BASE_URL` apunta por defecto a
`mock-provider-server`. Mensajería, borrado cross-store, embeddings y verificación
de identidad se cablean al mock o fallan con `PROVIDER_NOT_CONFIGURED`. Gmail es
la única integración real identificada para email cuando se aportan sus cuatro
credenciales.

**Riesgo.** Procesos de negocio pueden aparentar éxito sin ejecutar una acción
real, o acumular trabajos fallidos en producción.

**Cierre exigido.** Prohibir `MOCK_PROVIDER_BASE_URL` bajo `NODE_ENV=production`;
implementar y certificar cada proveedor real; contratos, timeouts, retries,
circuit breaker, idempotencia y DLQ; health/readiness de credenciales; sandbox y
pruebas end-to-end; reconciliación periódica con el proveedor.

### P0-06 — Secretos críticos se validan tarde o se derivan de una raíz común

**Evidencia.** JWT sí falla al arrancar en producción, pero
`MFA_ENCRYPTION_KEY`, `WEBHOOK_SIGNING_KEY` y `DOWNLOAD_URL_SECRET` se resuelven
cuando se usa la función. El Compose no pasa los dos últimos. Webhooks de pagos,
integraciones y mensajería contienen TODOs y derivan secretos deterministas de
una misma raíz en vez de resolver un secreto por conexión.

**Riesgo.** Primer uso en producción termina en 500; comprometer una raíz afecta
múltiples integraciones; no hay rotación ni revocación granular.

**Cierre exigido.** Esquema Joi productivo fail-fast; secret manager/KMS; secreto
aleatorio y versionado por conexión; rotación dual sin downtime; no registrar
material sensible; alertar expiración; inventario de propietarios y caducidad.

### P0-07 — Almacenamiento de archivos local en runtime

**Evidencia.** `FILE_STORAGE_ADAPTERS` solo contiene `local`; la API monta un
volumen local. El servicio de archivos genera URLs HMAC internas y documenta que
un presign S3 real queda pendiente.

**Riesgo.** Pérdida de archivos al mover réplicas, inconsistencia entre pods,
imposibilidad de escalar horizontalmente y control incompleto de cifrado/retención.

**Cierre exigido.** Implementar adaptador S3/objeto gestionado; URLs prefirmadas
de corta vida; SSE-KMS; antivirus/DLP antes de publicar; checksum; metadata de
tenant; lifecycle/retención; bloqueo legal; replicación; pruebas multi-réplica.

### P0-08 — Cadena de suministro con vulnerabilidad runtime alta

**Evidencia.** `yarn npm audit --all --recursive --environment production`
reporta `js-yaml@5.2.1`, traído por `@nestjs/swagger@11.4.6`, afectado por parsing
exponencial. La auditoría completa añade 2 critical y 21 high, principalmente en
la cadena AsyncAPI/build (`jsonpath-plus`, `tar`, Next.js y otros).

**Riesgo.** DoS en runtime/build y compromiso de pipeline o artefactos.

**Cierre exigido.** Actualizar/forzar una versión corregida tras validar
compatibilidad; separar herramientas de documentación del runtime image;
`yarn npm audit --environment production` como gate; SBOM CycloneDX/SPDX;
escaneo de imagen y secretos; firma y provenance SLSA; política de excepciones
con fecha de expiración.

### P0-09 — Suite completa no es un gate confiable

**Evidencia.** `yarn test --runInBand` no terminó después de más de 20 minutos.
El historial ya registraba handles activos. El lint acumula 23.380 errores.

**Riesgo.** Una regresión puede integrarse sin señal confiable; los pipelines se
vuelven lentos o se cancelan; errores reales quedan ocultos por deuda masiva.

**Cierre exigido.** Localizar handles con `--detectOpenHandles`; cerrar timers,
clientes y módulos; límites de tiempo por suite; particionar/parallelizar;
publicar JUnit; cero pruebas `.only`/`.skip` no justificadas; baseline de lint
por archivo y reducción monotónica hasta cero; gate estricto en código nuevo.

### P0-10 — Sin readiness ni validación operativa de dependencias

**Evidencia.** `/health` solo comprueba que Node responde. No verifica
PostgreSQL ni dependencias críticas. Los workers no tienen healthchecks en el
Compose. No hay `/metrics`, backend de métricas ni alertas verificadas.

**Riesgo.** El orquestador envía tráfico a una instancia incapaz de operar o no
detecta un worker congelado. Los incidentes se descubren por usuarios.

**Cierre exigido.** Separar liveness/readiness/startup; readiness con chequeos
acotados y dependencias realmente obligatorias; heartbeat/lag por worker;
métricas RED/USE; dashboards; alertas accionables; SLO y burn-rate; synthetic
checks de flujos críticos.

## 5. OpenAPI y Swagger

### Estado cuantitativo actual

| Métrica                           |                        Valor |
| --------------------------------- | ---------------------------: |
| Paths                             |                          858 |
| Operaciones                       |                          867 |
| Schemas de componentes            |                          919 |
| Tags                              |                          174 |
| Operation IDs                     |   867/867 presentes y únicos |
| Operaciones con descripción       |                          313 |
| Operaciones sin descripción       |                          554 |
| Parámetros                        |                          631 |
| Parámetros con descripción        |                           27 |
| Operaciones con respuesta 4xx/5xx |                            0 |
| Respuestas con `content`/schema   |                     0 de 867 |
| Ejemplos formales de request      |                            0 |
| Ejemplos formales de response     |                            0 |
| Servers                           | Solo `http://localhost:3000` |
| Redocly                           |    0 errores, 1.597 warnings |

Las 1.597 advertencias se explican casi por completo por 867 operaciones sin
4xx, 554 sin descripción, 174 tags sin descripción y 2 ambigüedades de rutas.
El documento es sintácticamente válido, pero todavía no es un contrato de
integración suficientemente preciso para clientes generados ni QA contractual.

### Deriva corregida

Se incorporaron 13 rutas presentes en código y ausentes del contrato anterior:

- `POST /iam/auth/register-patient`
- `POST /iam/auth/verify-email`
- `GET /profiles/patients/me/summary`
- `POST /common/files/upload`
- `GET /common/files/{id}/content`
- `POST /identity/me/identity-verification`
- `POST /identity/me/practitioner/identity-verification`
- `POST /identity/me/practitioner/license-verification`
- `POST /identity/me/tenants/{tenantId}/verification`
- `GET /identity/me/verification-cases/{caseId}`
- `GET /internal/identity/checks/dispatchable`
- `POST /internal/identity/checks/{id}/attempts`
- `POST /internal/identity/checks/{id}/results`

La fuente de verdad exacta es el diff de `openapi/openapi.json` y el catálogo
`openapi/endpoints/`.

### Mejoras P1 de contrato

| ID     | Mejora                                                  | Criterio de aceptación                                        |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| API-01 | Añadir `@ApiResponse` tipado para cada 2xx              | Toda operación expone schema real, no solo descripción        |
| API-02 | Documentar 400/401/403/404/409/422/429 y 5xx aplicables | 0 warnings `operation-4xx-response`                           |
| API-03 | Crear `ErrorResponseDto` reusable                       | Mismo envelope que `AllExceptionsFilter`, con ejemplos        |
| API-04 | Completar descripciones de 554 operaciones              | 0 warnings `operation-description`                            |
| API-05 | Describir 604 parámetros restantes                      | Propósito, formato, límites y semántica claros                |
| API-06 | Agregar ejemplos sanitizados                            | Request mínimo/completo y response éxito/error válidos        |
| API-07 | Describir 174 tags                                      | Propietario y capacidad del dominio                           |
| API-08 | Definir servers por variable/overlay                    | URLs reales de staging/producción sin secretos                |
| API-09 | Completar `info`                                        | Contacto, términos, soporte, política de deprecación          |
| API-10 | Versionar la API                                        | Prefijo o negociación, SemVer de contrato y sunset            |
| API-11 | Resolver 2 rutas ambiguas                               | Rediseño compatible o deprecación por versión                 |
| API-12 | Detectar breaking changes como gate                     | Un cambio incompatible falla el PR salvo aprobación explícita |
| API-13 | Probar contrato generado vs runtime                     | Smoke automático para los 867 pares método/ruta               |
| API-14 | Eliminar lista manual de rutas públicas                 | Decorador/extensión que derive `security: []` automáticamente |

### Swagger/Scalar en producción

Definir una política explícita. Alternativas válidas: deshabilitar completamente
las UIs en producción, exponerlas solo en red administrativa/VPN, o protegerlas
con autenticación y rate limiting. El YAML público no debe revelar rutas internas
como `/internal/*` si no son parte del contrato para consumidores externos.

## 6. Seguridad y autenticación

| Prioridad | Hallazgo/mejora                                           | Acción requerida                                                                                   |
| --------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P1        | JWT no consulta el estado de sesión en cada request       | Definir revocación: access TTL corto + denylist/versionado de sesión o introspección cacheada      |
| P1        | Roles y tenants permanecen en claims hasta expirar        | `tokenVersion`, evento de invalidación y pruebas de revocación inmediata para roles críticos       |
| P1        | `SUPERADMIN` depende de un claim con wildcard             | MFA fuerte, step-up, aprobación, token de corta vida, auditoría y red administrativa               |
| P1        | Rate limiting en memoria por réplica                      | Backend Redis distribuido, cuotas por IP/actor/tenant/ruta y protección de login/registro/webhooks |
| P1        | No se encontró configuración explícita de proxy confiable | Configurar `trust proxy` con hops/redes exactas; probar IP real y spoofing de headers              |
| P1        | CORS `origin:false` por defecto                           | Allowlist explícita por entorno si existe frontend web; nunca `*` con credenciales                 |
| P1        | Verificación de webhook debe usar bytes exactos           | Capturar raw body, validar timestamp/nonce, tolerancia temporal y replay cache                     |
| P1        | Claves HMAC simétricas compartidas                        | Secretos separados por propósito, rotación y versionado de key id                                  |
| P1        | MFA key con derivación desde passphrase                   | KMS/envelope encryption, key id por ciphertext y plan de re-encriptación                           |
| P1        | Endpoints internos usan HTTP hacia API                    | Identidad workload, mTLS o JWT de servicio rotado, audiencia/issuer y network policy               |
| P2        | Política de contraseñas y credenciales                    | Lista de contraseñas comprometidas, Argon2id/bcrypt calibrado, rehash progresivo                   |
| P2        | Protección contra enumeración                             | Respuestas y tiempos homogéneos en login, registro, recuperación y verificación                    |
| P2        | Sesiones concurrentes/dispositivos                        | Inventario visible, revocación por dispositivo, alertas de sesión sospechosa                       |
| P2        | Cabeceras de seguridad                                    | Verificar HSTS, CSP para UIs, referrer/permissions policy y cookies seguras si aparecen            |
| P2        | Auditoría de acceso clínico                               | Actor, paciente, propósito, tenant, decisión de autorización, correlación y retención WORM         |

También deben realizarse SAST, DAST autenticado, análisis de dependencias, escaneo
IaC/containers, revisión OWASP API Top 10 y pentest independiente antes del GO.

## 7. Servicios, dominio y consistencia

### Hallazgos P1/P2

1. **Eliminar `SEED.tenantId` de caminos runtime.** Los seeds son datos de
   arranque, no una fuente de autorización. Todo tenant propietario debe venir
   del contexto validado.
2. **Definir límites transaccionales.** Cada caso de uso debe documentar qué
   cambia atómicamente, qué sale por outbox y cómo se compensa un fallo externo.
3. **Idempotencia obligatoria en mutaciones sensibles.** Pagos, órdenes,
   notificaciones, ingestas, webhooks y jobs deben persistir una clave con scope,
   hash del payload, resultado y expiración.
4. **Reconciliadores.** Crear procesos que comparen pagos, archivos, mensajes,
   verificaciones y borrados con el proveedor; no confiar solo en el request
   inicial.
5. **Timeouts y budgets.** Toda llamada HTTP/DB/store debe tener timeout,
   cancelación y presupuesto de reintentos. No reintentar errores no transitorios.
6. **Circuit breakers y bulkheads.** Aislar proveedor/dominio; evitar que la caída
   de una integración agote conexiones o workers del resto del sistema.
7. **DLQ operable.** Cada cola necesita razón estable, payload sanitizado,
   contador de intentos, próxima ejecución, replay auditado y runbook.
8. **Control de concurrencia.** Mantener `row_version`, exigir precondición en
   updates críticos y documentar 409/422. Validar operaciones masivas.
9. **N+1 y consultas sin límites.** Presupuestos de query, paginación máxima,
   cursores estables, índices corroborados con planes reales y slow-query budget.
10. **Mapeo de errores.** Esta auditoría añadió `PAYLOAD_TOO_LARGE` para 413 y
    `RATE_LIMITED` para 429. Queda decidir y documentar 412 frente a 422 cuando
    se usen precondiciones HTTP formales.
11. **Datos personales en logs.** Mantener redacción central, añadir tests de
    snapshot y escaneo para documento, email, teléfono, tokens, payload clínico.
12. **Feature flags.** Cambios de alto riesgo e integraciones nuevas deben poder
    activarse por tenant y revertirse sin redeploy.

### Proveedores que requieren decisión explícita antes del GO

| Capacidad           | Estado observado                             | Requisito de producción                                                          |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Email               | Adaptador Gmail disponible; mock por default | Credenciales gestionadas, dominio verificado, cuotas, bounce/complaint, fallback |
| Mensajería no email | Mock o no configurado                        | Vendor real, consentimiento, opt-out, plantillas aprobadas y delivery receipts   |
| Identidad/licencia  | Mock o no configurado                        | Proveedor contractual, evidence handling, timeout, revisión manual y SLA         |
| Embeddings          | Mock o no configurado                        | Proveedor/modelo aprobado, privacidad, residencia, costo, dimensiones y fallback |
| Borrado cross-store | Mock o no configurado                        | Ejecución real y evidencia por store; compensación y reconciliación              |
| Pagos/webhooks      | Secretos derivados temporalmente             | Gateway real, secreto por conexión, raw-body verification y reconciliación       |
| Objetos/archivos    | Local/HMAC de aplicación                     | Object storage real, KMS, presign, AV/DLP y lifecycle                            |

## 8. Persistencia, migraciones y gobierno de datos

### P1 — Migraciones

El esquema se aplica mediante SQL plano y bootstrap aditivo. Además,
`ORM_SCHEMA_SYNC` tiene default de código `safe` y el Compose no lo fija, pese a
que `.env.example` recomienda `off`. Un proceso marcado como producción puede
intentar modificar DDL durante el arranque.

Acciones:

- Fijar `ORM_SCHEMA_SYNC=off` obligatoriamente en producción y fallar si no.
- Adoptar migraciones versionadas, checksum, tabla de historial y locking.
- Separar credenciales de migración y runtime.
- Pipeline expand/contract para cambios compatibles.
- Ensayar migración y rollback sobre copia anonimizada de tamaño real.
- Medir locks, duración, espacio temporal y compatibilidad N/N-1.
- Prohibir seeds de demo en producción; seeds de catálogo deben ser idempotentes,
  versionados y auditables.

### P1 — Modelo de datos y cumplimiento

- Completar clasificación y retención real de las 1.185 entidades, no solo el
  mecanismo de catálogo.
- Identificar PHI/PII, base legal, residencia, custodio, finalidad y consumidores.
- Automatizar borrado/anominización con legal hold y evidencia.
- Cifrado en tránsito y reposo en todos los stores; cifrado de campo para datos
  de riesgo extraordinario.
- Revisar índices multitenant: tenant primero cuando corresponda, cardinalidad y
  ausencia de fugas por constraints globales.
- CDC/outbox con orden, deduplicación, schema evolution y replay.
- Quality gates para integridad referencial, orfandad, duplicados y conceptos.
- Datos de prueba sintéticos; nunca clonar producción sin anonimización fuerte.

### P2 — Stores secundarios

- Mongo: auth, TLS, replica set, roles mínimos, backup y límites de colección.
- Redis: ACL/TLS, HA, maxmemory/eviction explícita, persistencia según cada dato,
  key namespace y protección contra hot keys.
- OpenSearch: security plugin, TLS, autenticación, snapshots, réplicas, lifecycle,
  límites de query y filtrado tenant obligatorio.
- Object storage: bucket policy mínima, bloqueo público, KMS, versionado y eventos.
- Consistencia cruzada: fuente de verdad declarada, SLA de propagación, estado de
  reconciliación y procedimiento de reparación.

## 9. Plataforma, contenedores y despliegue

### Controles mínimos P1

- Imágenes por digest, usuario no root, filesystem read-only, `/tmp` separado,
  sin capabilities, seccomp/AppArmor y límites efectivos del runtime.
- Verificar que `deploy.resources` se aplica en el orquestador elegido; no asumir
  que todo Docker Compose lo respeta igual.
- Un build inmutable promovido dev → staging → producción; no rebuild por entorno.
- Registry privado, retención, escaneo, firma y admisión solo de imágenes firmadas.
- Ingress TLS 1.2+, WAF/API gateway, límite de body y request timeout coherentes.
- Network policies deny-by-default y egress allowlist a proveedores.
- Secret manager con identidad workload, sin secretos largos en `.env`.
- Multi-AZ, anti-affinity, rolling update, PDB y capacity headroom.
- Readiness antes de tráfico, preStop/drain y termination grace medido.
- Estrategia canary/blue-green, rollback automático y compatibilidad DB N/N-1.
- Healthcheck y lag para cada uno de los 20 workers.
- Entorno staging representativo sin mocks silenciosos.

### Configuración que debe fallar al arrancar en producción

`RLS_ENFORCE` distinto de `true`; ausencia de `DB_APP_USER`; usuario runtime igual
al owner/admin; `ORM_SCHEMA_SYNC` distinto de `off`; adaptador de archivos local;
URL de mock no vacía; secretos MFA/webhook/download ausentes o inseguros; CORS no
decidido; OTEL/metrics sin destino; endpoints internos sin credencial de workload.

## 10. Observabilidad, SRE y operación

### P1

1. Implementar `/live`, `/ready` y `/startup` con semántica distinta.
2. Exponer métricas Prometheus u OTLP: rate, errors, duration y saturation por
   API, repositorio, proveedor y worker.
3. Métricas de colas: pending, oldest age, attempts, success/failure, DLQ y lag.
4. Dashboards por servicio y flujo de negocio, no solo por host.
5. SLO de disponibilidad/latencia y éxito de flujos clínicos; alertas por burn
   rate, no umbrales arbitrarios aislados.
6. Correlación trace/request/job/event id de extremo a extremo.
7. Sampling productivo: nunca ratio 1.0 por defecto a escala; head/tail sampling
   con conservación de errores y operaciones críticas.
8. Política de retención y acceso de logs; redacción verificada y costo estimado.
9. Synthetic checks: login, consulta autorizada, creación idempotente y ciclo de
   proveedor en sandbox.
10. On-call, escalamiento, runbooks ejecutables, plantillas de incidente y
    postmortem sin culpa.

### P2

- Capacidad y load test con objetivos p50/p95/p99, throughput y utilización.
- Prueba de degradación de cada store/proveedor y recuperación automática.
- Seguimiento de pool DB, event-loop lag, heap, GC, file descriptors y sockets.
- Control de cardinalidad en métricas/trazas; nunca IDs de paciente como labels.
- Auditoría de relojes/NTP y timestamps para firmas, tokens y secuencia clínica.

## 11. Calidad, pruebas y CI/CD

### Estrategia de recuperación del lint

No conviene apagar reglas ni aceptar 23.380 errores como baseline eterno.

1. Hacer blocking el lint de archivos modificados desde ya.
2. Generar un baseline por ruta/regla y prohibir que aumente.
3. Priorizar runtime antes que specs: guards, interceptors, filters, auth,
   persistencia, webhooks y workers.
4. Corregir `no-unsafe-*` con DTOs/type guards, no con `eslint-disable` masivo.
5. Ejecutar auto-fix de los 115 hallazgos mecánicos en un cambio aislado.
6. Reducir por módulo hasta llegar a `yarn lint` completamente verde.

### Pirámide mínima antes del GO

| Nivel       | Gate esperado                                                                  |
| ----------- | ------------------------------------------------------------------------------ |
| Unit        | Termina limpiamente, 0 handles, 0 flakes, cobertura útil en seguridad/dominio  |
| Integration | PostgreSQL y stores reales; transacciones, constraints, índices, RLS           |
| Contract    | OpenAPI/AsyncAPI; schemas request/response/error y breaking changes            |
| E2E         | Flujos críticos con identidad/roles/tenants y proveedores sandbox              |
| Security    | BOLA/IDOR, authz horizontal/vertical, replay, SSRF, injection, mass assignment |
| Load        | Objetivos por flujo, soak, spike, pools y colas                                |
| Resilience  | Timeouts, retry storms, store/provider down, kill/restart y DLQ                |
| DR          | Backup + restore + verificación funcional y de integridad                      |

### CI/CD P1

- Jobs obligatorios: format, lint incremental/global, typecheck, unit, integration,
  contract, audit runtime, secret scan, SAST, IaC scan, image scan y SBOM.
- La detección de breaking changes actual no es funcional: el CLI Redocly
  instalado no expone el comando `diff` y el workflow traga el error con un
  warning. Sustituirlo por una herramienta compatible y fijada en el lockfile;
  un cambio incompatible debe exigir aprobación, nueva versión y guía de
  migración.
- Probar el workflow actual en GitHub Actions real; hoy la propia documentación
  reconoce que no se validó en runner.
- `git diff --exit-code` para artefactos generados; ya se añadió a OpenAPI/docs.
- Ambientes protegidos, aprobación para producción, OIDC sin credenciales cloud
  estáticas, concurrency lock y audit log del deploy.
- Smoke post-deploy, canary analysis y rollback automatizado.
- Dependabot/Renovate con ventanas, agrupación y pruebas, sin auto-merge ciego.

## 12. Documentación y gobierno

### P1/P2

- Actualizar conteos históricos que aún afirman 60 módulos/841 operaciones/1.184
  entidades; distinguir snapshots históricos de páginas vivas.
- Declarar owner técnico y owner de negocio por módulo/tag.
- ADR para estrategia productiva: hosting, RLS, secretos, almacenamiento,
  proveedores, migraciones, DR y observabilidad.
- Catálogo de API con estado: experimental, beta, estable, deprecated, internal.
- Matriz requisito → control → prueba → evidencia; no marcar un control
  “implementado” solo porque existe documentación.
- Runbooks con comandos parametrizados, permisos necesarios y rollback.
- Manual de release, deprecación, incidentes, acceso de emergencia y restauración.
- Revisión trimestral de threat model y data-flow diagrams.
- Fijar una versión compatible de MkDocs/Material y evaluar por separado la
  transición a MkDocs 2; el build actual emite el aviso upstream de cambios
  incompatibles aunque finaliza correctamente.
- Servir Mermaid y demás assets del portal desde artefactos versionados o un CDN
  corporativo con integridad/CSP, en vez de depender implícitamente de `unpkg`.

## 13. Plan de remediación recomendado

### Fase 0 — congelar riesgo y definir el destino

- Prohibir el Compose local para producción.
- Nombrar responsables de seguridad, plataforma, datos, QA y dominios críticos.
- Elegir orquestador, servicios gestionados, proveedor de secretos y regiones.
- Definir datos regulados, RPO/RTO, SLO y proveedores reales.
- Bloquear nuevas rutas que no aporten response/error schemas y pruebas.

**Salida:** arquitectura productiva aprobada, inventario de datos/proveedores y
registro de riesgos P0 con owner y fecha.

### Fase 1 — seguridad y datos

- Rol runtime mínimo + RLS obligatorio y probado.
- Tenant scope para todos los stores y endpoints.
- Secrets/KMS fail-fast y rotación.
- Migraciones versionadas; schema sync off.
- Object storage real.
- Backup/restore automático y primer simulacro.

**Salida:** no existe acceso cross-tenant en pruebas negativas; restore cumple
RPO/RTO; aplicación no arranca con configuración insegura.

### Fase 2 — integraciones y ejecución asíncrona

- Sustituir mocks por proveedores reales certificados.
- Idempotencia, reconciliadores, DLQ, retries y circuit breakers.
- Webhooks raw-body, anti-replay y secreto por conexión.
- Health/lag de cada worker.

**Salida:** E2E sandbox y fallos forzados demuestran éxito, compensación y replay
sin duplicados.

### Fase 3 — calidad y contrato

- Resolver bloqueo de Jest y hacer la suite determinista.
- Gate de lint incremental y reducción sostenida.
- OpenAPI con respuestas/esquemas/errores/ejemplos.
- CI de seguridad, contratos y breaking changes.

**Salida:** todos los gates obligatorios verdes; Redocly 0 errores y 0 warnings
acordados; artefactos sin deriva.

### Fase 4 — SRE y lanzamiento controlado

- Readiness, métricas, dashboards, SLO y alertas.
- Load/soak/chaos, pentest y DR final.
- Canary con synthetic checks y rollback.
- Revisión formal Go/No-Go y aceptación residual firmada.

**Salida:** dos ensayos de despliegue/rollback y uno de restore satisfactorios;
on-call y runbooks probados; capacidad suficiente con margen.

## 14. Checklist obligatorio de GO

No declarar “listo para producción” hasta que todos estén comprobados con
evidencia del entorno objetivo:

- [ ] Cero riesgos P0 abiertos sin aceptación ejecutiva y compensación verificable.
- [ ] RLS obligatorio con rol no privilegiado y suite negativa cross-tenant verde.
- [ ] Aislamiento equivalente en Mongo, Redis, OpenSearch y objetos.
- [ ] Backups automáticos y restore real dentro de RPO/RTO.
- [ ] Ningún proveedor mock activo; integraciones reales en sandbox/producción.
- [ ] Secretos por gestor/KMS, fail-fast y rotación ensayada.
- [ ] Migraciones versionadas; runtime sin permiso DDL; schema sync off.
- [ ] Almacenamiento de archivos distribuido, cifrado y con lifecycle.
- [ ] Cero vulnerabilidades runtime critical/high sin excepción aprobada y expirable.
- [ ] Unit, integration, E2E, contract, security y load gates verdes.
- [ ] Suite Jest termina sin handles; lint no aumenta y runtime crítico está limpio.
- [ ] OpenAPI sin deriva, con schemas de éxito/error y breaking-change gate.
- [ ] Liveness/readiness/startup y health/lag de workers funcionando.
- [ ] Métricas, trazas y logs llegan al backend; alertas y SLO probados.
- [ ] Infraestructura privada/HA, TLS, WAF, network policies y mínimos privilegios.
- [ ] Deploy inmutable, firmado, canary y rollback ensayado.
- [ ] Pentest independiente sin críticos/altos abiertos.
- [ ] Clasificación, retención, legal hold y auditoría de datos aprobadas.
- [ ] Runbooks, on-call, escalamiento e incident response ejercitados.
- [ ] Go/No-Go firmado por producto, ingeniería, seguridad, datos y operaciones.

## 15. Orden de trabajo inmediato

1. Cerrar P0-01/P0-02 con RLS y tenant isolation end-to-end.
2. Diseñar infraestructura productiva; retirar el Compose local del camino de
   promoción y prohibir mocks/configuración insegura.
3. Implementar backup/restore y object storage real.
4. Corregir secretos/webhooks y vulnerabilidad runtime alta.
5. Desbloquear Jest y establecer gates CI que realmente terminen.
6. Implementar readiness/métricas/alertas.
7. Certificar proveedores reales y reconciliadores.
8. Elevar OpenAPI de inventario de rutas a contrato completo de integración.

Hasta completar al menos los puntos 1–6 con evidencia, el estado correcto sigue
siendo **NO-GO**.
