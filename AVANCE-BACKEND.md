# Avance del backend — qué está construido y por qué cuenta

> Fecha de corte: **2026-08-01**. Documento de **logros**: recoge lo que ya está implementado y
> verificado en `mantra-core-health-redesa-api`, explicado en prosa, no sólo enumerado.
>
> Lo que **falta** no se cubre aquí a propósito: eso vive en
> [`ESTADO-Y-PENDIENTES.md`](ESTADO-Y-PENDIENTES.md) y en
> [`docs/reports/production-readiness-2026-07-31.md`](docs/reports/production-readiness-2026-07-31.md).
> Cada cifra de este documento sale de un comando reproducible; al final hay una sección con
> exactamente cuáles.

---

## 1. Resumen ejecutivo

Lo que existe hoy no es un esqueleto ni un prototipo: es una API de salud multi-tenant completa en
superficie, con el dominio modelado hasta el nivel de tabla, el contrato HTTP generado desde el
propio código, aislamiento por tenant impuesto en la base de datos, 20 procesos de fondo separados,
trazabilidad distribuida y un portal de documentación que se rompe en CI si alguien lo deja
desactualizado.

En una frase: **el backend está construido; lo que queda por cerrar es infraestructura de
producción y proveedores externos reales, no funcionalidad.**

| Dimensión | Cifra | Cómo se obtiene |
| --- | --- | --- |
| Módulos NestJS | **60** (57 con entidades propias) | `docs/modules/index.md`, generado |
| Endpoints HTTP | **876** decoradores en **194** controllers | `grep` sobre `*.controller.ts` |
| Entidades mapeadas (tablas) | **1.185** | `yarn alovida:coverage` |
| Servicios / repositorios / DTO | **261 / 352 / 370** | catálogo generado |
| Archivos TypeScript | **3.514** (~515.000 líneas) | `find` + `wc` |
| Pruebas unitarias | **409/409 suites y 4.048/4.048 pruebas en verde** (corrida del 2026-08-01, 170 s) | `yarn test` |
| Pruebas de integración contra stores reales | **21** especificaciones | `test/integration/` |
| Pruebas de humo por módulo | **24** módulos | `test/smoke/modules/` |
| Procesos worker independientes | **20** | `src/worker-*.ts` |
| Jobs de fondo | **29** | `src/worker/jobs/` |
| Páginas de documentación | **183** (60 módulos + 20 ADR) | `yarn docs:build` |
| Hallazgos de guardrails ALOVIDA | **0** | `yarn alovida:guardrails` |

---

## 2. Arquitectura: una sola forma, repetida 60 veces

El mayor activo del proyecto no es ningún módulo concreto, sino que **los 60 se parecen entre sí**.
Cada uno tiene la misma anatomía:

```text
src/modules/<dominio>/
  ├── <dominio>.module.ts     ← wiring NestJS
  ├── controllers/            ← sólo HTTP: decoradores, DTO, códigos de estado
  ├── services/               ← reglas de negocio y transacciones
  ├── repositories/           ← único punto que habla con el EntityManager
  ├── entities/               ← mapeo MikroORM 1:1 con la tabla SQL
  ├── dto/                    ← contrato de entrada/salida, validado con class-validator
  └── README.md               ← qué hace el dominio y por qué (fuente del portal docs)
```

Por qué importa, en concreto:

- **Un desarrollador nuevo aprende un módulo y sabe leer los 60.** No hay dialectos internos.
- **El límite entre dominios es verificable, no aspiracional.** Un analizador estático
  (`DIRECT_CROSS_DOMAIN_ACCESS`) detecta si un repositorio importa entidades de otro dominio. Hoy
  marca **0**.
- **La capa de repositorio es el único sitio donde se toca el `EntityManager`.** Eso es lo que hace
  posible auditar el aislamiento por tenant estáticamente (§4), porque hay un número finito de
  lugares que consultar.
- **El README de cada módulo es la fuente del portal documental**, así que la documentación no puede
  divergir del módulo sin que alguien lo note al regenerar.

### Capa transversal (`src/common/`)

Lo que sería copiado 60 veces vive una sola vez:

| Carpeta | Responsabilidad |
| --- | --- |
| `auth/` | JWT, estrategia Passport, guards de rol e identidad verificada, decoradores `@Roles`/`@Public` |
| `tenant/` | interceptor de contexto de tenant y validación de propiedad declarada en el cuerpo |
| `errors/` | catálogo de códigos de error estables (parte del contrato) |
| `filters/` | filtro global de excepciones: una sola forma de cuerpo de error en toda la API |
| `persistence/` | campos de auditoría (`createdBy`/`updatedBy`/timestamps) aplicados uniformemente |
| `http/` | despachador HTTP saliente con **guardia anti-SSRF** y pipes de paginación |
| `storage/`, `crypto/`, `security/`, `seed/`, `pagination/` | almacenamiento de objetos, cifrado, validación de secretos al arranque, siembra idempotente, paginación por cursor |

---

## 3. Cobertura funcional: los 60 módulos, agrupados por para qué sirven

Esto es lo que un producto de salud necesita, y está modelado:

**Identidad y acceso** — `iam`, `authz`, `auth_providers`, `identity_assurance`,
`delegated_access`, `consent`, `directory`, `profiles`.
Cubren registro y login, verificación de correo, recuperación de contraseña, MFA, roles, políticas
de autorización, verificación de identidad (KYC clínico), acceso delegado de un cuidador o
representante, consentimiento informado con revocación, y el árbol organizativo de tenants.

**Clínico** — `clinical`, `clinical_ext`, `chart`, `health_data`, `health_context`, `diagnostics`,
`diagnostic_units`, `procedures_perioperative`, `pharmacy`, `pharmacy_inventory`, `terminology`.
Historia clínica, notas versionadas con enmienda (nunca borrado), órdenes y resultados de
diagnóstico, unidades de diagnóstico, flujo perioperatorio con verificación real de credenciales
profesionales, prescripción y dispensación, inventario farmacéutico con lotes y caducidad, y un
servidor de terminología propio.

**Financiero** — `accounting`, `billing`, `payments`, `insurance`, `erp`.
Libro mayor con asientos inmutables, facturación, cobranza (*dunning*) automatizada por tenant,
pagos, seguros y aseguradoras como contraparte, y recursos empresariales.

**Operación de la práctica** — `practice`, `scheduling`, `forms`, `workflow`, `automation`,
`qa_lab`, `system_ops`, `platform_ops`.
Agenda con lista de espera, formularios dinámicos con presupuesto por tenant, motor de flujos,
automatizaciones sobre registros, laboratorio de calidad y operación de plataforma.

**Comunicación y crecimiento** — `messaging`, `community`, `marketing`, `crm`, `ads`, `promotions`,
`education`, `tracking`.
Mensajería multicanal con outbox y suscripciones a webhooks, comunidad de pacientes, campañas,
CRM, publicidad, programas de lealtad, contenidos educativos y seguimiento de envíos por hitos.

**Datos e integración** — `integrations`, `integration_contracts`, `read_models`, `reporting`,
`lakehouse`, `time_series`, `vector_rag`, `graph_intelligence`, `search_platform`,
`document_store`, `object_storage`, `redis_runtime`, `polyglot_storage`,
`cross_store_consistency`, `telemetry`, `audit`, `geo`, `common`, `system_context`,
`organization_extensions`.
Integraciones externas con contrato declarado, vistas materializadas de lectura, informes, un
lakehouse con *releases* de investigación, series temporales sobre TimescaleDB, RAG vectorial con
cola de embeddings, proyecciones de grafo, búsqueda sobre OpenSearch, documentos en MongoDB,
objetos en MinIO, runtime de Redis, consistencia entre almacenes heterogéneos y auditoría
transversal.

El módulo con más entidades es `audit` (**123 tablas**), lo cual es coherente con un sistema de
salud: casi todo lo relevante deja rastro.

---

## 4. Seguridad: los controles que ya están puestos

Este es, con diferencia, el apartado más maduro del repositorio, y lo destacable es que casi todos
los controles **fallan cerrado** (deniegan por defecto) en vez de fallar abierto.

### 4.1 Aislamiento multi-tenant en tres capas independientes

El riesgo número uno de una API de salud multi-tenant es que un usuario de una clínica lea
historias de otra. Está cerrado tres veces, a propósito, porque cada capa cubre lo que las otras no:

**Capa 1 — Row Level Security en PostgreSQL** (`database/SQL/99_rls/01_tenant_rls.sql`).
La aplicación corre con el rol `mantra_app`, que **no es superusuario y no tiene `BYPASSRLS`**, así
que está sujeto a las políticas como cualquier otro. Cada petición fija la variable de sesión
`app.current_tenant_id` sólo después de comprobar la membresía real del actor en
`directory.tenant_memberships`. La política compara `tenant_id` contra esa variable — y **si la
variable no está fijada, no devuelve ni escribe ninguna fila**. Es decir: un bug futuro que olvide
fijar el contexto produce cero resultados, no resultados de otro tenant. El script es idempotente y
cubre automáticamente *todas* las tablas con una columna `tenant_id uuid`, incluidas las que se
creen después. Verificado 6/6 contra una base real (`test/integration/rls.int-spec.ts`): fallo
cerrado sin GUC, aislamiento de lectura, `WITH CHECK` en escritura, elevación `SYSTEM` explícita y
`FORCE RLS`.

**Capa 2 — Validación del tenant declarado en el cuerpo** (`src/common/tenant/`).
Los DTO de escritura llevan el tenant propietario en el JSON (`tenantId`, `custodianTenantId`) —
son **453 usos repartidos por 250 servicios**. Sin control, el tenant sería un dato que elige el
cliente. Un interceptor global comprueba, una sola vez, que el tenant declarado coincide con el
verificado del actor; eso cierra los 453 sitios sin reescribir ninguno. El detalle fino está bien
resuelto: los tenants de *contraparte* (`insurerTenantId`, `supplierTenantId`, …) quedan
deliberadamente fuera de la comprobación, porque referencian legítimamente a otra organización.

**Capa 3 — Guardrail estático `TENANT_SCOPE_MISSING`** (`tools/alovida/guardrails.mjs`).
Detecta en tiempo de análisis un `em.find`/`em.count` sobre una entidad con `tenant_id` que no acota
por tenant ni por un identificador puntual. Nació de un bug real y, al escribirse, encontró **tres
fugas más** que nadie había visto: suscripciones de webhook en `messaging`, catálogo de hitos en
`tracking` y presupuesto de asignaciones en `forms`. Tiene *allowlist* explícita para los barridos
`SYSTEM` legítimamente cross-tenant, así que no es un control que se apague por ruidoso.

### 4.2 Autenticación

- **JWT con algoritmo fijado** (no se acepta el algoritmo que proponga el token), guard global: una
  ruta es privada salvo que se marque `@Public()` explícitamente.
- **Contraseñas con argon2id**, con los mismos parámetros en todos los caminos: la siembra del
  primer administrador reutiliza `IamUsersService.createUser` en lugar de duplicar la configuración
  del hash.
- **Recuperación de contraseña que no filtra qué cuentas existen**: responde 202 con el mismo cuerpo
  exista o no el correo, sólo persiste el SHA-256 del token, y restablecer **revoca todas las
  sesiones y refresh tokens** del usuario.
- La tabla de *reset* está separada de la de verificación de correo a propósito: comparten forma
  pero no consecuencia, y con una sola tabla un token emitido para verificar un correo serviría para
  reescribir una credencial.
- **Siembra del primer `SECURITY_ADMIN`** idempotente y opt-in, que **se niega a ejecutarse en
  `NODE_ENV=production`** salvo autorización explícita.

### 4.3 Autorización

- **RBAC declarativo** con `@Roles` sobre cada endpoint mutante. El analizador confirma **0
  endpoints mutantes sin política explícita** — no hay puertas traseras olvidadas.
- **PDP clínico conjuntivo**: un rol *por sí solo* no concede acceso a datos de salud; se exige
  además un alcance clínico vigente. Un administrativo con rol amplio no ve la historia de un
  paciente con el que no tiene relación asistencial activa.
- **Revocación en cascada del consentimiento**: retirar el consentimiento que sustenta un *grant* lo
  revoca.
- **Guard de identidad verificada** separado del de rol, con **código de error propio**
  (`IDENTITY_VERIFICATION_REQUIRED`). Es un detalle de producto, no sólo técnico: rol insuficiente es
  un muro sin salida e identidad sin verificar es una puerta, y el cliente puede distinguirlos sin
  parsear textos.

### 4.4 Inmutabilidad y auditoría

- **Protección WORM en base de datos** para auditoría (`2026-07-28_audit_worm_guard.sql`):
  *write once, read many* impuesto por la base, no por convención de código.
- **Historial versionado** y `AuditTrailService` transversal.
- **Guardrails que prohíben CRUD genérico sobre lo inmutable**: `HARD_DELETE_RESTRICTED_DATA` y
  `GENERIC_CRUD_ON_IMMUTABLE` rompen el build si alguien añade un `@Delete` o un `@Patch` sobre
  dominios clínico, legal, financiero o de auditoría. Sólo se admiten verbos de negocio explícitos
  (`amend`, `addend`, `invalidate`, `reverse`, `sign`, `cosign`, `finalize`…).
- **`CASCADE_ON_RESTRICTED`**: impide `ON DELETE CASCADE` apuntando a dominios protegidos.

### 4.5 Endurecimiento HTTP

Todo esto está en `src/main.ts`, con el razonamiento escrito al lado de cada línea:

- **Helmet** (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **Límite explícito de cuerpo** a 1 MB; las cargas grandes (imágenes, DICOM) van por el flujo de
  almacenamiento de objetos, no por el body JSON.
- **CORS denegado por defecto** de forma explícita, pendiente de allowlist cuando exista frontend.
- **`ValidationPipe` global con `whitelist` + `forbidNonWhitelisted`**: cualquier propiedad no
  declarada en el DTO se **rechaza**, lo que cierra el *mass-assignment* de raíz.
- **Rate limiting global** (300 peticiones/minuto) como red anti-fuerza bruta, con posibilidad de
  límites más estrictos por endpoint.
- **Swagger y Scalar sólo fuera de producción**, para no publicar el mapa completo de la superficie
  de ataque.
- **Guardia anti-SSRF** en el despachador de peticiones salientes (`common/http/ssrf-guard.ts`).
- **Validación de secretos al arranque**: MFA, firmas de webhook y descargas **fallan durante el
  bootstrap** si los secretos faltan o son débiles en producción, en vez de arrancar inseguros.

---

## 5. Procesamiento en segundo plano: 20 procesos, un patrón

Hay **20 procesos worker independientes** (`src/worker-<dominio>.ts`), uno por dominio, arrancados
por un `bootstrapWorker` común y desplegados como servicios separados en `docker-compose.yml`.

La decisión de diseño que los hace valiosos: **cada worker es un cliente HTTP autenticado de la
propia API** (`SystemApiClient`, rol `SYSTEM`) y **nunca importa servicios de dominio
directamente**. Consecuencias reales:

- Un worker no puede saltarse un guard, una validación de DTO ni una política de tenant, porque
  entra por la misma puerta que cualquier cliente.
- Escalan por separado: si la cobranza se satura, se replica `worker-billing` sin tocar la API.
- Un worker caído no tumba la API ni a los otros 19.

Cubren scheduling, inventario farmacéutico, consentimiento, acceso delegado, verificación de
identidad, promociones, workflow, reporting, automatización, QA lab, contexto de salud,
consistencia entre almacenes, mensajería, integraciones, billing, tracking, read models, RAG
vectorial (drena la cola de embeddings), lakehouse (cierra *releases* vencidos) y series temporales
(compresión y rollups automáticos; la retención destructiva es **opt-in por tabla** — sin
configurarla no borra nada).

`graph_intelligence` deliberadamente **no** tiene worker: sus proyecciones se alimentan de evidencia
externa, y un bucle que "descubra" algo estaría fabricando datos. Que esa ausencia esté razonada y
escrita vale más que un worker de relleno.

### Outbox transaccional

`OutboxService.publishDomainEvent` es la pieza que desacopla los módulos: **70+ puntos de llamada**
en automation, cross_store_consistency, graph_intelligence, lakehouse, time_series, vector_rag,
workflow, authz y procedures_perioperative. Un evento de dominio y su mensaje de outbox se escriben
en la misma transacción que el cambio de negocio, y un job de relay los entrega después. Está
cubierto por integración contra Postgres real (`outbox-relay-race.int-spec.ts`), no sólo por
unitarias con repositorio simulado.

### Adaptadores de proveedor: puntos de extensión reales

Los tres puntos donde el sistema toca el mundo exterior (envío de notificaciones, borrado en el
store destino, cálculo de embeddings) siguen el mismo patrón: un tipo `XxxProviderAdapter`, un
*default* que **falla visiblemente** con `PROVIDER_NOT_CONFIGURED` en lugar de fingir éxito, una
propiedad mutable y un `*WiringService` que la sustituye según variable de entorno.

Lo importante es que está **demostrado de punta a punta**, no sólo afirmado:
`worker-provider-adapter-swap.int-spec.ts` prueba que sin proveedor el job falla visible y que con
`MOCK_PROVIDER_BASE_URL` la siguiente llamada es una petición HTTP real, sin tocar el job. Conectar
Twilio, SendGrid u OpenAI es escribir un adapter que cumpla el tipo y registrarlo — nada más.

Ya hay **un proveedor real conectado**: Gmail API vía OAuth2 para el canal EMAIL de `messaging`,
explícitamente marcado como adapter de **desarrollo**, con su propia prueba de integración opt-in y
su guía de operación (`docs/operations/gmail-provider-setup.md`).

---

## 6. Persistencia políglota, con cada almacén donde tiene sentido

Cinco motores, todos levantados en `docker-compose.yml` y todos con pruebas de integración reales:

| Almacén | Uso | Evidencia |
| --- | --- | --- |
| **PostgreSQL + TimescaleDB** | Verdad transaccional: 1.185 tablas en 57 esquemas + series temporales | `rls.int-spec.ts`, `outbox-relay-race.int-spec.ts` |
| **MongoDB** | Documentos flexibles (`document_store`) | `document-store.int-spec.ts` |
| **Redis** | Runtime, caché y coordinación | `redis-runtime.int-spec.ts` |
| **OpenSearch** | Búsqueda (`search_platform`) | `search-platform.int-spec.ts` |
| **MinIO** | Objetos y archivos (`object_storage`) | flujo de subida cubierto |

El esquema SQL está organizado por dominio numerado (`01_iam`, `02_common`, … `63_lakehouse`), con
migraciones aditivas fechadas en `99_migrations/` y el RLS en `99_rls/`. Los mapeos MikroORM son
1:1 con las tablas y hay herramienta propia para auditarlo (`yarn orm:audit`,
`yarn orm:entities:missing`).

El módulo `cross_store_consistency` existe precisamente porque cinco almacenes implican
divergencia: hay un dominio dedicado a detectarla y reconciliarla, con su propio worker.

---

## 7. El contrato de la API es un artefacto, no una promesa

- **OpenAPI generado desde los decoradores del código**, no escrito a mano: 860 paths, 869
  operaciones, 920 schemas, 174 tags, 7.262 enlaces a códigos de error. **0 errores y 0
  advertencias** en Redocly.
- **Catálogo Markdown de endpoints** (`openapi/endpoints/`, 62 archivos): 869/869 documentados.
- **AsyncAPI** para los eventos de dominio: 0 errores, 0 advertencias.
- **Referencia interactiva Scalar** en `/reference` y Swagger en `/docs`, alimentados por el
  contrato real.
- **Colección Postman** versionada con su entorno local (`docs/postman/`), generada.
- **Modelo de error uniforme**: un filtro global de excepciones y un enum de **12 códigos estables**
  documentados como parte del contrato. El cliente ramifica sobre `error.code`, nunca sobre el texto
  del mensaje — y el enum lo dice explícitamente. Cada respuesta incluye además `correlationId` en
  formato de texto plano, que es lo que el contrato promete.
- **Idempotencia por dominio**: 202 archivos participan del patrón; un reintento de creación
  devuelve 409 en vez de 500 o de duplicar.

---

## 8. Observabilidad: trazas de punta a punta, medidas

Los **21 procesos** (API + 20 workers) exportan trazas OpenTelemetry por OTLP a Jaeger.

Lo bien resuelto:

- **Apagada por defecto** (`OTEL_ENABLED`): encenderla es una decisión explícita del operador.
- **Cada respuesta HTTP lleva `x-trace-id`, y cada línea de log lleva `trace_id`.** Eso convierte
  soporte en algo operable: el usuario entrega un identificador y soporte llega a la traza exacta.
- **Logs estructurados con pino** para todo, incluido el arranque del ORM — no hay dos formatos de
  log conviviendo.
- **Catálogo de spans de negocio** documentado (no sólo spans automáticos de HTTP y SQL).
- **Política de privacidad de datos en trazas** escrita, que en un sistema de salud no es opcional.
- **Verificación end-to-end automatizada**: `yarn jaeger:verify` comprueba Jaeger, backend, traza y
  privacidad.

Y está **medido con números reales**, no estimado (`docs/observability/05-performance-results.md`):

| Configuración | p50 | Sobrecarga |
| --- | --- | --- |
| Sin telemetría | 3,13 ms | referencia |
| Telemetría al 100 % | 3,25 ms | **+0,12 ms (+3,8 %)** |
| Telemetría con Jaeger caído | 3,49 ms | +0,36 ms, sin degradación funcional |

Con 12 spans por petición, la sobrecarga es del mismo orden que la variación entre corridas de la
propia línea base. Y el comportamiento con Jaeger caído está verificado: `/health` sigue en 200, el
login sigue devolviendo su 401 de negocio (no un 5xx), y el exportador emite **una** línea de error
sin cascada. El invariante — *una petición de negocio nunca espera a la exportación ni falla por
ella* — está comprobado, no supuesto.

Mención aparte para la honestidad metodológica del documento: la primera tanda de mediciones dio
resultados contradictorios por contención de la máquina, y **se descartó por inválida** en lugar de
publicarse. Eso es lo que hace que el resto de los números sean creíbles.

---

## 9. Calidad: qué se prueba y qué impide una regresión

### Pirámide de pruebas completa

- **409 suites unitarias** (última corrida documentada: 402/402 suites, 3.945/3.945 pruebas, 45,7 s).
- **21 especificaciones de integración contra almacenes reales**, no simulados: RLS, WORM de
  auditoría, IAM, common, terminología, outbox, document store, redis runtime, search platform,
  observabilidad, siembra, swap de adaptador de proveedor, proveedor Gmail, y las importaciones de
  vocabularios clínicos.
- **24 módulos con pruebas de humo** sobre la API viva, con *kit* y registro compartidos.
- **E2E** con su configuración Jest propia.

La lección ya aprendida y aplicada: **los cambios sobre persistencia se validan contra una base
real**. Los bugs más caros del proyecto (el outbox roto el 100 % de las veces, la expansión de
conjuntos de valores que nunca devolvía un miembro) eran invisibles para las unitarias porque éstas
simulan el repositorio y devuelven lo que se les pide. Ahora existen las integraciones que los
habrían atrapado.

### Rendimiento de la propia suite

Se sustituyó `ts-jest` por **SWC**: la peor suite en frío bajó de **59,5 s a 0,9 s**. Es una mejora
de proceso con efecto diario — una suite que tarda tres cuartos de minuto en una sola prueba no se
ejecuta, y una que tarda uno se ejecuta siempre.

### Análisis estático propio (`tools/alovida/`)

Además de ESLint type-aware (0 errores, 0 advertencias) y `tsc` (0 diagnósticos), hay dos
herramientas escritas para este proyecto:

- **`yarn alovida:coverage`** — informe estático que reporta entidades sin consumidor, endpoints
  mutantes sin política y accesos directos cross-domain. Hoy: **0, 0 y 0**.
- **`yarn alovida:guardrails`** — cinco reglas que rompen el build ante los antipatrones prohibidos
  (§4.4 y §4.1). Hoy: **0 hallazgos**.

Estas dos herramientas son, probablemente, el activo de calidad más subestimado del repositorio:
convierten reglas de arquitectura que normalmente viven en la cabeza de alguien en checks que
fallan solos.

### Dependencias

**0 vulnerabilidades** en dependencias de runtime. Los 3 avisos `moderate` restantes son
deprecaciones confinadas a herramientas de build y test. Se retiró el CLI de AsyncAPI —arrastraba
Next.js y 900+ paquetes transitivos— y se sustituyó por el parser oficial mínimo: menos superficie
de cadena de suministro por la misma función.

---

## 10. Documentación: 183 páginas que CI obliga a mantener vivas

Un portal MkDocs con **183 páginas**, **565 enlaces internos sin roturas** y `mkdocs build
--strict` en verde. No es documentación decorativa; está estructurada como la necesita alguien que
entra al proyecto:

| Sección | Contenido |
| --- | --- |
| `getting-started/` | prerrequisitos, montaje local, variables de entorno, cómo correr pruebas |
| `architecture/` | contexto de sistema, contenedores, componentes, ciclo de vida de una petición, dependencias entre módulos, procesamiento de fondo |
| `business/` | contexto de negocio, actores y roles, capacidades, reglas, flujos críticos, glosario |
| `modules/` | 60 fichas generadas desde los README reales de cada módulo |
| `data/` | arquitectura de datos, catálogo de 1.185 entidades, relaciones, índices, clasificación, retención, migraciones, seeds |
| `api/` | autenticación, autorización, convenciones, modelo de errores |
| `events/` | catálogo de eventos, semántica de entrega, reintentos y DLQ, guía para consumidores |
| `security/` | arquitectura de seguridad, aislamiento por tenant, control de acceso, auditabilidad, modelo de amenazas, gestión de secretos, respuesta a incidentes |
| `observability/` | 14 documentos: diseño, spans de negocio, topología, privacidad, rendimiento medido, runbook, SLO, alertas, dashboards |
| `operations/` | despliegue, configuración, entornos, health checks, escalado, rollback, recuperación ante desastres, mantenimiento |
| `testing/` | estrategia y una página por tipo de prueba |
| `governance/` | propiedad, proceso de revisión, gestión de cambios, matriz de trazabilidad |
| `adr/` | **20 registros de decisión de arquitectura** |

Los 20 ADR merecen mención propia: framework, ORM, PostgreSQL políglota, JWT propio, RBAC + PDP
clínico, multi-tenancy con RLS, eventos sin broker externo, caché, almacenamiento de archivos,
observabilidad, versionado de API, estrategia de errores, idempotencia, despliegue, secretos,
migraciones, seeds, consistencia transaccional, outbox y trazas. Cuando alguien pregunte "¿por qué
no usamos Kafka?", hay una respuesta escrita y fechada en lugar de una discusión repetida.

Y lo que lo sostiene: **un workflow de CI (`.github/workflows/docs.yml`) que replica los almacenes
reales** (TimescaleDB, MongoDB, Redis, OpenSearch) y falla el PR si se rompe el contrato
OpenAPI/AsyncAPI, si queda un enlace roto o si `mkdocs build --strict` falla. Buena parte de la
documentación se **genera** (`docs:modules:sync`, `docs:data:sync`, `docs:endpoints:generate`), así
que no puede envejecer en silencio.

> Nota de honestidad, escrita en el propio workflow: fue construido por fidelidad a
> `docker-compose.yml` pero aún no se ejecutó contra un runner real de GitHub Actions. Se verificará
> en el primer PR que lo dispare.

---

## 11. Terminología clínica real, no de juguete

El módulo `terminology` es un servidor de terminología propio (sistemas, versiones, conceptos,
conjuntos de valores, expansión) con **importadores de vocabularios reales**, cada uno con su
prueba de integración:

**LOINC**, **ICD-10-CM**, **RxNorm** (completo), **RxTerms**, **NDC**, **HCPCS**, **NUCC** y un
**vademécum** sembrado.

El ciclo de vida está resuelto correctamente: los conceptos nacen en `TERM_DRAFT`, publicar la
versión los promueve a `TERM_ACTIVE`, y la expansión selecciona sólo los activos. La lectura de la
expansión (`GET /terminology/value-sets/:id/$expand`) está **paginada por cursor keyset** sobre
`(ordinal, concept_id)` y **no exige rol de administración**, porque es justo lo que un frontend
necesita para rellenar un desplegable; el `POST` homónimo sí lo exige, porque materializa.
Verificado contra la API viva: 25 conceptos importados → publicados → `includedMembers: 25`.

---

## 12. Operación y despliegue

- **`docker-compose.yml` con la topología completa**: 5 almacenes + API + 20 workers +
  mock-provider-server, con `healthcheck` y límites de recursos declarados.
- **Dockerfile multi-stage** (deps → build → prod-deps → runtime) con **usuario no root**
  (`nodeapp`): la imagen final no arrastra dependencias de compilación.
- **Sondas separadas**: `/health` y `/liveness` responden sin tocar dependencias externas (lo que un
  orquestador necesita para no reiniciar en cascada), y `/readiness` verifica de verdad PostgreSQL,
  MongoDB, Redis y OpenSearch con timeout y 503. Confundir ambas es un error clásico y aquí está
  evitado explícitamente.
- **Cierre ordenado**: `enableShutdownHooks()` en API y workers, así que `docker stop` drena las
  peticiones en vuelo y cierra conexiones de MikroORM y Redis en lugar de cortar en seco.
- **Seeds idempotentes al arranque**, re-ejecutables sin efectos secundarios.
- **`mock-provider-server`**: un proyecto NestJS independiente que emula notificaciones, borrado
  cross-store y embeddings, **conectado por defecto** en desarrollo. Los tres workers que antes
  fallaban con `PROVIDER_NOT_CONFIGURED` ahora tienen un camino feliz completo en local.
- **Jaeger opcional** con su propio compose (`yarn jaeger:up` / `jaeger:down` / `jaeger:verify`).
- **Modelo C4 en Structurizr** (`structurizr/workspace.dsl`) — la arquitectura como código, no como
  diagrama suelto en una carpeta compartida.

---

## 13. Prácticas de ingeniería que se notan en el código

Además de las funcionalidades, hay una serie de hábitos consolidados que explican por qué el
proyecto sigue siendo manejable con 3.514 archivos:

1. **Los comentarios explican el *porqué*, no el *qué*.** `main.ts` documenta por qué la
   instrumentación de OpenTelemetry debe ser la primera importación del proceso; `tenant-scope.ts`
   explica por qué existe y por qué excluye tenants de contraparte; `error-codes.ts` explica por qué
   `IDENTITY_VERIFICATION_REQUIRED` merece código propio. Esos comentarios son los que impiden que
   alguien "limpie" una línea crítica dentro de seis meses.

2. **Los invariantes frágiles están señalados donde se rompen**, no en un wiki aparte.

3. **Deny-by-default como norma**: RLS sin GUC no devuelve nada, CORS denegado, rutas privadas salvo
   `@Public()`, adapters de proveedor que fallan visiblemente, secretos débiles que impiden el
   arranque en producción.

4. **Las decisiones de no hacer algo están escritas y razonadas** (por qué `graph_intelligence` no
   tiene worker, por qué la retención de series temporales es opt-in, por qué Swagger no se publica
   en producción, por qué la primera tanda de benchmarks se descartó).

5. **Herramienta propia donde la genérica no llega**: los guardrails ALOVIDA codifican reglas de este
   dominio que ningún linter de mercado conoce.

6. **Autocrítica registrada.** Los documentos del repositorio marcan explícitamente lo que *no* se
   verificó (el workflow de CI sin runner real, el NO-GO de producción). Un repositorio que
   distingue "implementado" de "verificado" es un repositorio en el que se puede confiar cuando dice
   "verificado".

---

## 14. Cómo comprobar cada afirmación de este documento

Nada de lo anterior pide fe. Los comandos:

```bash
# Inventario y límites de dominio (entidades, endpoints, huérfanos, cross-domain)
yarn alovida:coverage        # → ALOVIDA-COBERTURA.md

# Antipatrones prohibidos (borrado duro, CRUD sobre inmutables, tenant sin acotar…)
yarn alovida:guardrails

# Compilación, tipos y estilo
yarn build && yarn typecheck && yarn lint --max-warnings=0

# Pruebas
yarn test                   # unitarias
yarn test:integration       # contra almacenes reales (requiere docker compose up)
yarn smoke                  # humo contra la API viva

# Contrato de API
yarn docs:openapi:generate && yarn docs:openapi:lint
yarn docs:asyncapi:validate
yarn docs:endpoints:generate

# Documentación completa (enlaces, cobertura, mkdocs estricto)
yarn docs:validate && yarn docs:build

# Mapeo ORM ↔ SQL
yarn orm:audit && yarn orm:entities:missing

# Observabilidad de punta a punta
yarn jaeger:up && OTEL_ENABLED=true yarn start:dev && yarn jaeger:verify
```

---

## 15. Conclusión

El backend tiene **60 módulos, 876 endpoints, 1.185 entidades y 20 workers**, con el aislamiento
multi-tenant cerrado en tres capas independientes, el contrato de API generado y validado
automáticamente, trazabilidad distribuida medida contra una línea base real, una pirámide de
pruebas que incluye integración contra almacenes reales, análisis estático propio del dominio y 183
páginas de documentación que CI obliga a mantener sincronizadas.

Lo que queda para producción es de otra naturaleza: infraestructura HA privada, KMS/IAM/WAF/TLS,
proveedores externos certificados, pruebas de carga y pentest, y aceptación formal de RPO/RTO —
cosas que no se cierran editando este repositorio. Ese detalle está en
[`docs/reports/production-readiness-2026-07-31.md`](docs/reports/production-readiness-2026-07-31.md).

La base sobre la que se apoyará todo eso ya está construida.
