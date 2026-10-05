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
