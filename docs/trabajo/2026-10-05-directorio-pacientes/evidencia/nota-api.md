# Avance API — 2026-10-05

Estado: código escrito; unitarios dirigidos en verde antes del último cambio de logging.

- POST /insurance/patients/search y /conversation, GET /options; Cache-Control private,no-store.
- Scope por cobertura CURRENT y aseguradora activa; administración global usa padrón. Membresía, fechas y rol vigente OWNER/ADMIN o INSURANCE_OPERATOR exigidos en cada petición de aseguradora.
- SQL por cursor limit+1, count exacto con mismos filtros; no documento/póliza/afiliación. Profesión por catálogo/texto libre, teléfono normalizado y fechas inclusivas.
- Chat resuelve perfiles desde cuentas activas y vínculo SELF vigente; reutiliza CommunityMessagingService con sus restricciones de visibilidad/bloqueo. No envía mensajes.
- Auditoría sólo ids por paciente. LoggerContext query sin query-params para que debug ORM no exponga filtros; Pino estándar instalado no serializa body (ver pino-std-serializers/lib/req.js), aunque README logging afirma lo contrario.
- Test integración real escrito test/integration/insurer-patients.int-spec.ts, sin reset ni dobles backend; todavía sin ejecutar.

## Evidencia literal hasta ahora

Unit inicial api-unit.txt: 36 passed / 2 failed. Causa del fallo: fixture controller no adjuntaba request.user; CurrentUser lanza 500 cuando falta autenticación. Fixture arreglado, sin cambio de producción.

Unit final api-unit-final.txt:
```
Test Suites: 4 passed, 4 total
Tests:       38 passed, 38 total
Time:        32.031 s
```

Typecheck api-typecheck.txt:
```
src/modules/insurance/controllers/insurer-patients.controller.spec.ts(7,15): error TS2724: '"../../../common"' has no exported member named 'AuthenticatedRequest'. Did you mean 'AuthenticatedUser'?
```
Causa: tipo no exportado por barrel, import corregido a archivo real; reejecución pendiente.

## Bloqueo integración local

- .env declara DB_HOST no loopback (inspección booleana, sin imprimir secretos). No se utilizó remoto.
- No listeners locales detectados para PostgreSQL/Redis/OpenSearch.
- Docker Desktop ejecutado oculto; servicio com.docker.service Stopped.
- Start-Service falla: No se puede abrir el servicio com.docker.service en el equipo '.'.
- api-docker.txt registra daemon/pipe inexistente. Agente principal reprodujo con escalación y mismo rechazo del SO.
- Sin binarios postgres/pg_ctl/psql locales encontrados.

## Pendiente

Reejecutar unit tras loggerContext e import de test; typecheck global y build; lint; OpenAPI desde controller real aislado sin DB. Ejercitar SQL y chat persistido requiere stack local operativo; los unitarios no demuestran SQL ni integración.

## Hallazgo de trazas (corregido sólo en el directorio)

Inspección del SDK instalado: @mikro-orm/sql/AbstractSqlConnection.js prepara SQL con platform.formatQuery y envía el texto formateado a pg. @opentelemetry/instrumentation-pg/build/src/utils.js guarda queryConfig.text como db.query.text independientemente de enhancedDatabaseReporting. Por eso ambas consultas que contienen filtros/cursor se ejecutan bajo suppressTracing(context.active()), API existente de @opentelemetry/core, y loggerContext debugMode query sin query-params. Se conserva el span HTTP y la métrica ORM. Se añadió aserción unitaria del contexto suprimido y logger sin parámetros. Resto del repositorio fuera de alcance: patrón de SQL interpolado puede afectar otros buscadores.

## Continuación tras Docker Desktop operativo

- `api-unit-privacy-final.txt`: 4 suites / 39 tests passed, exit 0, 74.218 s, incluye tracing suppressed y query sin parámetros.
- `api-typecheck-final.txt`: yarn typecheck exit 0 sin diagnósticos.
- Evidencia anterior queda invalidada para autorización transporte tras agregar metadata opt-in `PlatformTenantOptional` exclusivamente al directorio: global SECURITY_ADMIN/SUPERADMIN no necesitan tenant; guard e interceptor conservan resolución ordinaria para insurer y rechazan bypass scoped. Se añadieron 2 tests con los guards/interceptor reales. Reejecución pendiente.
- AppModule `envFilePath: process.env.DOTENV_CONFIG_PATH ?? '.env'` alinea ConfigModule con dotenv/config del ORM para QA aislada y conserva default. Ajuste autorizado por agente principal y documentado en PLAN.
- Compose aislado `directory-stack.compose.yaml` validado config --services exit0. Sin recursos preexistentes afectados; imágenes de versiones del repo, puertos loopback55435/56385/57025/59205 y volúmenes del proyecto alovida-directory-20261005. Todavía no iniciado.
- Runner `run-directory-local.cjs` elimina configuración heredada de conexiones y carga únicamente directory-local.env sintético. Auth browser opt-in se guarda en node_modules/.cache/directory-qa/browser.json ignorado por git.
- No cubierto: build/lint/OpenAPI actuales, SQL real, persistencia de chat, recorrido browser, logs runtime.

## Estado exacto al solicitar push antes de nuevas pruebas

- Unit final auth `api-unit-auth-final.txt`: `Test Suites: 1 failed, 5 passed, 6 total`; `Tests: 3 failed, 67 passed, 70 total`; exit1. Causa: guard opt-in aplicado pero faltaba insertar la rama correspondiente en interceptor (reemplazo de texto no aplicado). Rama insertada en interceptor; reejecucion pendiente por instruccion de priorizar push/PR.
- No hay gate pesado activo. No se arrancaron contenedores ni se genero OpenAPI.
- Los 39 unit anteriores PASS y typecheck anterior PASS no cubren el ultimo cambio de autorizacion; estado final WRITTEN para esa capa. Build/lint/OpenAPI/integracion siguen pendientes.

## Gates tras primer push (antes de actualizar nuevas bases remotas)

- api-unit-auth-rechecked.txt: `Test Suites: 6 passed, 6 total`; `Tests: 70 passed, 70 total`; `Time: 14.761 s`; exit0. Verifica directorio y regresion tenant guard/interceptor.
- api-typecheck-auth-final.txt: yarn typecheck exit0, sin diagnosticos.
- api-build-final.txt: yarn build, `EXIT_CODE=0`.
- api-openapi-generate.txt: `Generated 3 directory paths and 8 schemas from real Nest metadata; other paths preserved.`; exit0.
- api-lint-final.txt: yarn lint global, `EXIT_CODE=0`, sin diagnosticos.
- Hallazgo posterior: Swagger declaraba412 para PreconditionFailedException, cuya clase real devuelve422. Decorador cambiado a ApiUnprocessableEntityResponse y aserciones del contrato exigen422/no412. Regeneracion OpenAPI y reunit pendientes; no cambian semantica runtime.
- El remoto dev/test avanzo durante gates. Agente principal integra nuevas bases al checkpoint; las salidas anteriores describen la instantanea previa, no las nuevas bases. No se arranco Docker ni se ejecuto SQL/chat real todavia.

## Bases nuevas y stack aislado operativo

- Current dev HEAD1c894e32 incorpora nueva origin/dev. api-unit-current-bases.txt: `Test Suites: 6 passed, 6 total`; `Tests: 70 passed, 70 total`; `Time: 15.555 s`; exit0.
- api-openapi-final422.txt: `Generated 3 directory paths and 8 schemas from real Nest metadata; other paths preserved.`; exit0. Contrato Swagger ahora422 coherente con DomainException.
- Docker compose up aislado exit0, evidencia api-local-stack.txt recortada literalmente. Progreso bruto de descarga conservado en node_modules/.cache/directory-qa/stack-pull-raw.txt, fuera de git.
- postgres-init inspeccionado: `exited 0`; `=== postgres-init completado`. PG healthy. Consulta psql real: `profiles.patient_profiles|insurance.patient_coverages|community.conversations`.
- Integracion real aun NO ejecutada mientras agente principal verifica frontend serialmente. Se prepararon9 casos, incluyendo STAFF+INSURANCE_OPERATOR scoped propio y negativa scoped ajena; todas las fixtures son propias sinteticas.
- Se mantuvo negativa400 de whitelist(documentNumber extra); cross-tenant tenantId recibe403 antes del pipe por TenantContextInterceptor, asercion separada para conservar ambos controles.

## Primer intento real: fallo de bootstrap ajeno al directorio

- api-integration-real.txt conserva salida literal: suite FAIL, 9 failed por mismo beforeAll, timeout180000ms, Time272.419s. No se ejecutaron las aserciones del directorio. Node16504 quedo abierto por bootstrap incompleto; detenido solo ese hijo identificado (exit-1).
- Diagnostico: ClinicalFormsSeedService estaba materializando contenido clinico; CPU221s en Node, PostgreSQL idle/commit y sin lock. No se aumento timeout ni se debilitaron aserciones.
- Salida bruta queda en node_modules/.cache/directory-qa/integration-timeout-raw.txt ignorado. Evidencia publicable contiene solamente fragmento literal del fallo, sin SQL/catalogos ni posibles credenciales de otros seeds.
- Tras PLAN H3.S1.M6 aprobado, runnerQA usa seleccion NATIVA SEED_CONTENT_ON_BOOT=false solo en integration. Conserva todos los seeds core (terminologia, ocupacion/profesion, afiliacion, geografia, roles, mensajeria, admin), AppModule real y PostgreSQL real. Las aseguradoras/productos/planes propios se crean via API, sin depender de contenido comercial precargado. Sin cambios al harness ni al comportamiento de produccion.
- Segundo intento pendiente de liberar slot global frontend.

## Integracion real completada en AppModule y PostgreSQL aislados

- Primer intento core: api-integration-core-first.txt, 9 failed/47.144s/exit1 por fixture plan422: requiere X-Tenant-Id. Alta de producto/plan ajustada para enviar tenant propio conforme contrato nativo; no se cambio autorizacion API.
- Reejecucion core: api-integration-core-pass.txt, `Test Suites: 1 passed, 1 total`; `Tests: 9 passed, 9 total`; `Time: 39.506 s`; EXIT_CODE=0. Sin mocks de servidor/SQL y sin ampliar timeout.
- Cubierto real: SQL pagina10+2/total12/cursor, payload minimo, alcance aseguradora propia vs ajena y Ninguno sin ampliar acceso; STAFF+INSURANCE_OPERATOR scoped y negativa scoped ajena; plataforma SECURITY_ADMIN sin tenant pasando guards/interceptor AppModule; combinacion profesion/fechas inclusivas; fechas/limites/whitelist invalidos; GETlegacy404; dos aperturas mismo conversationId con una fila persistida y auditoria; cobertura expirada404 aun con chat previo; membresia revocada403 listado/options/chat.
- api-directory-log-privacy.txt contiene25 lineas HTTP reales literales. Aserciones sobre cada registro: query vacia, cuerpo de request ausente y authorization header ausente. Sin datos personales en URL del directorio. La prueba no activa exportador OTEL; supresion del SQL con parametros se demuestra por unit/contexto y SDK inspeccionado, no por captura de spans real.
- Fixture browser sintetica guardada solamente en node_modules/.cache/directory-qa/browser.json ignorado; cobertura y membresia propias restauradas tras pruebas de revocacion. No versionar archivo de auth ni directory-local.env.
- Pendiente: build/typecheck actuales tras merge de bases, listener3105 y recorrido frontend contra API real; gates de variante test coordinados por agente principal.

## Matriz real final y listener disponibles

- api-integration-core-final.txt: 1 suite/9 tests PASS, 39.4s, EXIT_CODE=0. El mismo caso agrega solicitudes reales limit25/50 (total12/items12/nextCursor null), ademas de10+2; verifica birthDate1990-01-01 y canalinternal.
- api-directory-log-privacy-final.txt registra27 solicitudes literales de esta corrida, todas sin filtros en query, cuerpo de request ni authorization header.
- api-build-current-bases.txt y api-typecheck-current-bases.txt: EXIT_CODE=0, sin diagnosticos, sobre dev actualizado. No se cambia codigo de produccion despues de estos gates.
- Listener compilado real PID17880/sesion34264 en3105, livenessHTTP200. Log ignorado api-listener-raw.txt confirma Nest started, ORM_SCHEMA_SYNC=off y SEED_ON_BOOT=false. Disponible para agente principal; recorrido navegador real aun pendiente en esta nota.
- Pendientes de API: lint de archivos QA nuevos y OpenAPI lint, gates de variante test tras cambio coordinado de rama/dependencias. Lint global previo PASS corresponde instantanea anterior y no se reetiqueta como actual.

## Variante test: validacion con su base y dependencias

- yarn install --immutable PASS2.18s (api-test-install-immutable.txt), sin alterar yarn.lock/resolutions.
- Typecheck inicial FAIL2 por helper fn() de public-profile-projection.service.spec.ts heredado de origin/test; diff de spec/service a base vacio. PLAN H3.S1.M8 previo al fix, helper acepta implementation opcional y la pasa a jest.fn, assertions intactas. Reejecucion api-test-typecheck-final.txt EXIT0. Dev ya trae arreglo propio: no trasladar este fix a dev.
- api-test-build-final.txt EXIT0 y api-test-build-metadata-final.txt EXIT0 tras completar Swagger. api-test-unit-final.txt: 7 suites/74 tests PASS,15.249s (70 directorio/auth +4 projection). Incluye regresion del helper real.
- api-test-lint-final.txt global FAIL53 prettier en5 archivos ajenos; todos identicos origin/test, demostrado api-test-baseline-gate-failures.txt. NO se aplico --fix global. api-test-lint-scoped.txt17archivospropios PASS; api-test-lint-metadata-final.txt controller Swagger final PASS. No declarar lint global actual PASS.
- OpenAPI inicial FAIL2 errores heredados +2 warnings propios (descripciones options/conversation). ApiOperation propio completado y generacion aislada real PASS3paths8schemas. api-test-openapi-lint-rechecked.txt FAIL solo2 errores heredados, sin warnings propios: operaciones publicas services/products sin security, objetos identicos origin/test demostrados. No tocar contratos publicos ajenos ni declarar OpenAPI global PASS.
- api-test-integration-real-final.txt: AppModule/SQL/chat reales,1 suite/9tests PASS49.019s EXIT0 con10/25/50, scopedoperatorSTAFF,tenantlessadmin,minimizacion,kill-test y reuso persistido/revocaciones. api-test-directory-log-privacy.txt contiene27 logs literales minimos sin queryfiltros/body/auth. Fixtureauth ignorada renovada.
- Incidencia de orquestacion: lint controller devolvio sessionID y se inicio integración antes de comprobar su cierre; lint se confirmo terminado PASS inmediatamente al revisar. No hubo otros runners despues. Se registra desviacion en vez de afirmar serializacion perfecta.
- Listener TEST real3105 PID19064/sesion98411, livenessHTTP200 y Neststarted. Root realiza segundo navegador real y capturas positivas; aun pendiente en esta nota. No editar/resetear fixtures existentes; cleanup se limita al stack propio al finalizar ambos flujos.

## Cierre API dev final y recursos

- Dev HEAD639c9722 incorpora metadatos finales propios. api-dev-install-final.txt: install--immutable PASS47.133s (rebuild nativo cpu-features/ssh2 por tree distinto). api-dev-typecheck-final.txt, api-dev-build-final.txt y api-dev-lint-final.txt: todos EXIT_CODE=0 sin diagnosticos. Lint global actual DEV PASS; no confundir con TEST global53errores heredados.
- No se repitieron unit/SQL dev por cambio exclusivo en textos ApiOperation: unit70 directorio/auth y SQL9 dev ya PASS; test74unit/SQL9 y metadata final build/lint tambien ejecutados. La documentacion no cambia autorizacion o consulta.
- Root informo E2E frontend real contraAPIdevPASS1/4.9s y contraAPItestPASS1/5.6s, apertura/recarga/reapertura mismo conversationId, consola/red limpias. Evidencia navegador la mantiene root en frontend; no se presenta como ejecutada por este agente.
- P2 independiente final abrio26 capturas interceptadas y2 positivas reales conservadas, con10preguntas y nota por pantalla en frontend revision-visual-p2.md. ReservaMENORplaceholder1024, sin MAYOR/BLOQUEANTE abierto. Captura historica de fallo TEST_BUG no conservada por limpiezaPlaywright, anotado limite y no usada para validar estado actual.
- Ambos listeners propios se cerraron por root verificando PID. api-local-cleanup.txt: compose down EXIT0 limitado a proyectoalovida-directory-20261005, sin-v, contenedores y network propios retirados;3volumenes sinteticos conservados, DockerDesktop intacto. No reset ni cambios a recursos preexistentes.
- Cierre honesto: directorio/API funcional verificado en ambasbases; lint global TEST y OpenAPIglobal siguen FAIL por baseline demostrado. No afirmar DoDglobal completo/mergeable; checksPR/reportes finales los coordina root. Credenciales locales y caches auth permanecen fuera de git.
