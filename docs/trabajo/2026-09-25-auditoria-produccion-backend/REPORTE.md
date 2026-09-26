# Auditoría estricta de preparación para producción — backend

**Dictamen: NO APTO para aprobar un despliegue del snapshot auditado.** Hay defectos de autorización e integridad reproducidos en código real con persistencia simulada, configuración de aislamiento insegura por defecto y gates de calidad fallidos. No se ha demostrado una intrusión ni una fuga en producción.

- Fecha local: 25 de septiembre de 2026, America/La_Paz. Algunas evidencias tienen fecha UTC del 26.
- Repositorio: `mantra-core-health-api`, rama local `dev`, commit **`4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650`**.
- Alcance solicitado final: backend. No se auditó frontend.
- Entorno: Windows; Node `v22.23.1`; Yarn `4.14.1`. Docker/CI declaran Node 24: los resultados locales no reemplazan la validación del artefacto Linux/Node 24.
- Worktree inicialmente limpio. No se modificó código del producto, configuración, lockfile, infraestructura ni datos existentes. Se añadieron sólo este informe y sus diagnósticos/evidencias; las herramientas generaron artefactos locales de compilación/cobertura.
- La rama remota avanzó durante la revisión. No se actualizó silenciosamente el checkout: este dictamen se refiere exclusivamente al SHA anterior, no al último `dev` remoto ni a una imagen de producción.
- Publicación solicitada después de entregar la auditoría: rama documental basada en `dev` remoto `52a696b34e56511cf7d67a7549a443f8b0740c29`. No se heredan estos resultados como verificación de esa base posterior; las referencias y resultados siguientes pertenecen al SHA auditado. Los logs se normalizaron a UTF-8 conservando su texto para que el diff sea revisable.

## Resultado de los gates

| Comprobación | Resultado observado | Interpretación |
|---|---|---|
| `yarn install --immutable` | Exit 0; se incorporó `xlsx` faltante en la instalación local | Sin modificación del lockfile; el primer typecheck fallido era ambiental |
| `yarn typecheck` después de instalar | **PASS**, exit 0 | Tipos correctos para esta ejecución |
| `yarn build` | **PASS**, exit 0 | Compila localmente; no prueba arranque productivo |
| `yarn lint --max-warnings=0` | **FAIL**, exit 1; 19 errores y 1 advertencia | Gate incumplido, principalmente formato y un `no-base-to-string` |
| `yarn test:cov --maxWorkers=1` | 711 suites aprobadas, 1 omitida; 8.639 pruebas aprobadas, 1 omitida; **exit 1** | No fallaron assertions ejecutadas, pero fallan los cuatro umbrales de cobertura |
| `yarn npm audit --all --recursive --environment production --json` | Exit 0, sin avisos devueltos | No prueba ausencia universal de vulnerabilidades ni escanea la imagen del SO |
| `yarn alovida:guardrails` | Exit 0; 8 informativos, 0 bloqueantes | Los matches heurísticos no se convierten automáticamente en vulnerabilidades |
| `yarn docs:openapi:lint` | **PASS**, exit 0 | Valida el documento versionado; no demuestra paridad con la API en ejecución |
| Reproducciones de auditoría | 9/9 assertions aprobadas | **Confirman defectos**, no su corrección ni persistencia en PostgreSQL real |
| Sondas HTTP locales | `/health` 200; `/readiness` 503, MongoDB down | Observación del contenedor de desarrollo existente, de commit desconocido |
| Integración/E2E/negativos con RLS real | **NO EJECUTADO** | No había un entorno desechable provisionado; se preservaron las bases existentes |

| Cobertura | Obtenida | Mínimo configurado | Gate |
|---|---:|---:|---|
| Statements | 73,39 % | 74 % | FAIL |
| Branches | 67,52 % | 69 % | FAIL |
| Functions | 58,37 % | 59 % | FAIL |
| Lines | 74,32 % | 75 % | FAIL |

Salidas literales y comandos: [EVIDENCIA.md](EVIDENCIA.md). No se bajaron umbrales ni se excluyeron archivos para obtener verde.

## Método y alcance real

Inventario AST: **69 directorios de módulos, 4.545 archivos TypeScript, 257 controllers, 1.365 decoradores de métodos HTTP y 712 archivos de pruebas unitarias**. Los decoradores no equivalen a 1.365 rutas probadas. Se priorizaron auth, tenant, clínica, agenda, pagos, sesiones, mensajería, errores, persistencia, entradas, workers y despliegue, cruzando tamaño/ramificación y frecuencia de cambios.

Las skills locales `code-quality-audit`, `secure-code-review` y `qa-evidence-reporting` determinaron el enfoque: causas sistémicas, prioridad por impacto, evidencia literal y límites explícitos. No se delegó trabajo a otros agentes.

Niveles de evidencia:

- **C:** camino leído en código/configuración del SHA auditado.
- **R:** reproducción local con clases reales y dobles de infraestructura; no es integración con DB ni prueba HTTP extremo a extremo.
- **O:** observación de un servicio local ya existente o metadatos remotos de CI; su artefacto se identifica por separado.
- **Pendiente:** validación que requiere staging desechable, credenciales/roles reales o contexto operativo no disponible.

Los tests de autorización usan metadatos reales del controller, `TenantScopeGuard`, `RolesGuard` y `TenantContextInterceptor`, con un actor autenticado sintético y `RLS_ENFORCE=false`, valor por defecto del compose auditado. No eluden un rechazo real de esos guards; tampoco ejecutan firma JWT, pipes, servidor HTTP, políticas SQL ni triggers. Los casos financieros/clínicos que usan repositorio real comprueban además el criterio `{ id }` o `{ appointmentId }` enviado al doble de persistencia.

## Prioridades

P1 significa bloquear la aprobación del release hasta corregir/verificar, no que exista evidencia de incidente activo. P2 significa corregir con fecha y aceptación explícita del riesgo. Estimaciones orientativas de trabajo efectivo, sujetas al modelo de permisos y a disponibilidad de entorno.

| ID | Prioridad | Problema | Evidencia | Dueño sugerido | Esfuerzo |
|---|---|---|---|---|---|
| F01 | P1 / alto | Autorización por objeto inconsistente en clínica, pagos y listado de agenda | C + R: AUD-01/02/09 | Backend dominios + Seguridad | 3–6 días, revisión transversal adicional |
| F02 | P1 / alto | Runtime de despliegue comparte usuario PostgreSQL propietario; RLS opcional y apagado por defecto | C | Plataforma/DBA | 2–4 días |
| F03 | P1 / alto | Offboarding/suspensión conserva autorización de tenant en access tokens vigentes | C + R: AUD-05 | IAM + Directory | 1–3 días |
| F04 | P1 / alto por privacidad | WebSocket sólo autentica al conectar; no aplica revocación/expiración posterior | C + R: AUD-08 | Community + IAM | 1–3 días |
| F05 | P2 / medio, condicionado | Error y URL sin sanitizar llegan a logs/trazas | C + R: AUD-04 para logs | Observabilidad + Seguridad | 1–2 días |
| F06 | P1 / alto operativo | Readiness cacheable y healthcheck del despliegue sólo de liveness | C + R: AUD-03 + O | Plataforma + Backend | 0,5–1 día |
| F07 | P1 / alto financiero | `DECLINE` puede degradar un payment intent terminal exitoso | C + R: AUD-07 | Payments | 1–2 días |
| F08 | P2 / medio | Fallback del rate limit retiene indefinidamente claves expiradas | C + R: AUD-06 | Plataforma/Backend | 0,5–1 día |
| F09 | P1 / alto de proceso | Lint/cobertura fallan; el commit auditado fue integrado con CI fallido y gates omitidos | C + ejecución + O | Tech Lead + CI/QA | 1–3 días iniciales |
| F10 | P2 / medio | Concentración de decisiones y cambios en servicios de miles de líneas | Métricas AST + Git | Leads de dominio | Plan incremental de 1–2 sprints |

### F01 — Un rol y un tenant válidos no autorizan el objeto pedido

**Clase:** CWE-862/CWE-639; OWASP API1:2023 Broken Object Level Authorization. La pertenencia al tenant declarado no comprueba la propiedad de un UUID leído desde la base. La separación entre autorización de función y autorización de objeto coincide con [OWASP API1](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).

Tres manifestaciones de la misma causa, no tres tickets inconexos:

1. **Clínica, `POST clinical/encounters/check-in`.** `src/modules/clinical/controllers/clinical-encounters.controller.ts:38` documenta el residual `BOOTSTRAP_ACCESS_RESIDUAL`; `encounters.service.ts:61` acepta paciente/episodio/cita. En `:86` intenta reutilizar un encuentro por `appointmentId`, y `:167` bloquea la cita pero no comprueba que pertenezca al paciente/tenant/actor declarados. `src/modules/clinical/repositories/encounters.repository.ts:261` y `:279` consultan por IDs sin scope. **AUD-01** reproduce que un actor CLINICIAN del tenant A, declarando paciente A, obtiene la respuesta del encuentro del paciente B/tenant B conociendo su cita. El camino de creación también carece de una política de inicio de relación asistencial; esto se verificó por lectura, no mediante inserción real. No se afirma que se haya leído toda la historia clínica.
2. **Pagos, evaluación de riesgo por ID.** `src/modules/payments/services/payments-intents.service.ts:221`, especialmente `:232`, carga el intent mediante `src/modules/payments/repositories/payment-intents.repository.ts:124`, cuyo filtro es `{ id }`. En `:255` cambia el estado. **AUD-02** reproduce que PAYMENTS_ADMIN del tenant A alcanza y modifica en memoria un intent del B. El mismo método de consulta aparece en `lockFxRate` (`:159`) y `addSplit` (`:305`): caminos revisados estáticamente, no tres reproducciones independientes. Concurrencia protegida por lock no implica autorización.
3. **Agenda, `GET scheduling/bookings?resourceId=...`.** `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:85` admite PATIENT. `scheduling-bookings.service.ts:2693` sólo verifica representación cuando se proporcionó `patientProfileId`; con sólo `resourceId` se omite. El repositorio en `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:412` filtra paciente/recurso/estado, sin ownership del actor ni tenant. **AUD-09** obtiene IDs de una cita/paciente ajenos; verifica también que `reasonText` NO se devuelve, para no exagerar el alcance. La proyección `scheduling-bookings.service.ts:3047` devuelve IDs, horarios y estado; `:3152`/`:3153` agregan motivo de cambio de estado/demora sin la compuerta aplicada al motivo de consulta. El detalle `getBookingById` sí contiene controles: su existencia no protege el listado.

**Precondiciones:** usuario autenticado con el rol correspondiente, identificadores de recurso conocidos y ausencia de una defensa SQL efectiva para el cruce de tenant. No se ha demostrado enumeración de UUID. El defecto de agenda por paciente también importa dentro del mismo tenant; activar RLS no sustituye la política por paciente.

**Acción:** resolver siempre recurso + tenant autorizado antes de leer/proyectar/mutar; propagar el scope a repositorios; autorizar paciente/representación/agenda del profesional por caso de uso. Para el bootstrap clínico, definir una política específica y auditable; no reutilizar ciegamente la política de lectura del expediente si produce una dependencia circular. Validar coherencia entre paciente, episodio, cita y encuentro. Revisar transversalmente los consumidores de consultas por ID.

**Cierre exigido:** pruebas negativas HTTP y PostgreSQL reales para tenant A/B, paciente titular/ajeno/representado, profesional propio/ajeno, identificadores cruzados y roles ordinarios; rechazo 403/404 y cero cambios persistidos. Probar con runtime de privilegio mínimo y con la defensa SQL configurada, no sólo SUPERADMIN ni mocks. Mantener positivos legítimos de admisión clínica.

### F02 — El compose no garantiza un rol de aplicación de privilegio mínimo

**Clase:** CWE-250/CWE-284; configuración insegura. `docker-compose.coolify.yml:120`/`:121` entrega a la app `POSTGRES_USER`/`POSTGRES_PASSWORD`; `:188` establece `RLS_ENFORCE` a `false` por defecto. No propaga `DB_APP_USER`/`DB_APP_PASSWORD`. `src/orm/config/orm.config.ts:50` vuelve al usuario de conexión si falta `DB_APP_USER`. La misma variable `POSTGRES_USER` inicializa el servidor PostgreSQL. `src/app-readiness.service.ts:77` no examina el rol cuando RLS no está habilitado.

Además, `docker-compose.coolify.yml:365` publica PostgreSQL como `${POSTGRES_PUBLIC_PORT:-5432}:5432`, sin limitar el bind a loopback. Esto demuestra publicación en interfaces del host, **no** accesibilidad desde Internet: firewall/red reales no fueron inspeccionados.

**Impacto:** los errores de autorización de aplicación carecen de la defensa SQL esperada; se amplifica el impacto de una credencial comprometida. PostgreSQL explica que superusuarios y roles BYPASSRLS eluden políticas, y que el propietario normalmente también las elude salvo FORCE RLS: [documentación de Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). No basta con poner el flag a `true`.

**Acción:** credenciales separadas para migración/runtime/read-only; runtime no propietario y sin SUPERUSER/BYPASSRLS; políticas aplicadas y verificadas; retirada o restricción del puerto publicado; fallo de preflight ante configuración productiva insegura. Verificar también workers, requests públicos, transacciones anidadas y `em.fork()` con contexto real.

**Cierre exigido:** prueba aislada de privilegios y RLS con el compose/imagen de release; demostrar A no lee/escribe B por SQL y HTTP, y que las tareas de sistema conservan sólo privilegios explícitos. No aplicar cambios de roles/políticas a una base existente sin migración y rollback ensayados. CVSS independiente no asignado: es una condición de despliegue/amplificación, no una explotación autónoma demostrada.

### F03 — Offboarding no invalida las autorizaciones ya emitidas

**Clase:** CWE-863/CWE-613. `src/modules/directory/services/directory-memberships.service.ts:385` termina membresía/asignaciones sin revocar sesiones; `directory-tenants.service.ts:493` suspende tenant y membresías sin invalidar esas sesiones. `src/common/auth/jwt.strategy.ts:20` toma tenants del token; `src/common/auth/session-validator.ts:47` sólo verifica sesión y usuario activos. `src/common/tenant/tenant-resolution.ts:36` usa `user.tenantIds`, no membresías actuales.

**AUD-05** demuestra el control de sesión/tenant con claims obsoletos: una sesión activa sigue aceptando el tenant sin consultar membresías. La ejecución de offboarding real sobre DB queda pendiente. La ventana es hasta la expiración del access token; `src/common/auth/auth.env.ts:36` configura **15 minutos por defecto**, no una permanencia ilimitada por refresh. El flujo de refresh reconstruye membresías.

**Acción:** invalidación síncrona transaccional de sesiones/versión de autorización al retirar membresía, suspender tenant o cambiar permisos; alternativamente resolver autorización vigente en cada petición con invalidación coherente. Evitar una caché positiva que reabra la misma ventana.

**Cierre exigido:** iniciar sesión como miembro, comprobar acceso, ejecutar offboarding/suspensión y repetir inmediatamente la misma petición con el token anterior: debe rechazarse antes de su expiración. Verificar usuario con múltiples tenants sin retirar indebidamente derechos independientes.

### F04 — WebSocket conserva una autenticación que dejó de ser válida

**Clase:** CWE-613/CWE-863. `src/modules/community/gateways/community-messaging.gateway.ts:140` autentica una sola vez en `handleConnection`; `:195` utiliza el usuario almacenado para unirse a conversación; `:458` lo recupera desde `client.data`. No se encontró temporizador de expiración ni propagación de revocación/desconexión en ese camino. `:422` distribuye eventos a las rooms existentes.

**AUD-08** conecta con un autenticador sintético válido, lo cambia a revocado y llama al handler real de unión: no se vuelve a autenticar ni se desconecta. No fue una conexión de red Socket.IO ni una revocación persistida. La pertenencia a conversación y propiedad del perfil siguen comprobándose; el defecto es la vigencia de la sesión, no ausencia total de autorización.

**Impacto:** un cliente que mantiene la conexión puede conservar acceso después de logout/revocación o expiración; los eventos salientes a rooms requieren cobertura, no sólo validar mensajes entrantes.

**Acción:** cerrar sockets al expirar token/sesión y ante revocación, con distribución entre réplicas; revalidar eventos protegidos y eliminar suscripciones. Registrar el resultado sin guardar el token.

**Cierre exigido:** dos réplicas, socket real, revocación desde otra réplica y expiración del token; comprobar tanto rechazo de handlers como ausencia de mensajes posteriores en rooms anteriores.

### F05 — Sanitizar el error HTTP no sanitiza el log ni la traza

**Clase:** CWE-532. `src/common/filters/all-exceptions.filter.ts:184` pasa el objeto `Error` completo a Pino y `:186` la URL cruda; `:237` registra la excepción en tracing. `src/logging/pino-options.ts:23` elimina autorización/cookies y determinados secretos del body, no `err.message`, stack/cause ni parámetros de la URL.

**AUD-04** inyecta exclusivamente un marcador sintético en un error: el body HTTP lo oculta, pero la configuración real de Pino lo conserva. Esto demuestra el sumidero sin sanitización; **no** demuestra que un error concreto de producción ya haya contenido PHI. Una excepción upstream/driver con valores sensibles o una URL con información clínica puede materializarlo. No se afirma que todas las consultas ORM registren parámetros: ese extremo no se comprobó.

**Acción:** serializador allowlist para errores, SQLSTATE/código/correlationId sin valores; registrar plantilla de ruta, no query cruda; sanitizar también excepciones OpenTelemetry y revisar permisos/retención del agregador. Conservar diagnóstico útil con metadatos no sensibles.

**Cierre exigido:** marcadores sintéticos en message, cause, stack, query, headers y errores de driver; comprobar su ausencia en body, logs y exportador de trazas reales. Hasta entonces el cumplimiento de no-PHI en observabilidad queda sin acreditar.

### F06 — Una readiness sana se puede servir desde caché cuando ya dejó de ser sana

`src/app.controller.ts:63` expone `/readiness` como pública sin `Cache-Control: no-store`. `src/common/http/public-cache.interceptor.ts:125` responde un hit sin llamar al handler y `:145` publica `max-age=60, stale-while-revalidate=300`; el interceptor está registrado globalmente en `src/app.module.ts:264`.

**AUD-03:** primer sondeo sano; el proveedor pasa a fallo; el segundo sondeo devuelve todavía `ok`, y el contador de consultas sigue en uno. Prueba de interceptor real con proveedor simulado. No se simuló una caída real de DB.

Por separado, `docker-compose.coolify.yml:617` usa `/health`, que sólo verifica liveness, no readiness. **Observación local:** `/health` 200 mientras `/readiness` 503 por MongoDB down, y el contenedor figura healthy. El contenedor es development, Node 24, imagen local, sin SHA de commit identificable: evidencia operativa útil, no certificación del build auditado ni de producción.

**Acción:** excluir sondas de la caché con `no-store` y prueba de contador; usar readiness para admisión/enrutamiento de tráfico y liveness para reinicio. Si Coolify usa el único healthcheck para activar tráfico, configurarlo con readiness o definir explícitamente otra comprobación de dependencias. No reiniciar en bucle por una caída externa transitoria.

**Cierre exigido:** transición healthy → dependencia caída → recuperación, observada en cada request y en el balanceador, sin 304 ni respuestas sanas obsoletas. Hallazgo operativo; no se asigna CVSS de explotación.

### F07 — Evaluación de riesgo altera estados terminales de pago

**Clase:** CWE-841, integridad de flujo. `src/modules/payments/services/payments-intents.service.ts:232` adquiere lock pero no comprueba el estado; `:254` aplica `DECLINE → PI_FAILED` de forma incondicional. **AUD-07** parte de `PI_SUCCEEDED` y termina en `PI_FAILED` en la entidad realista simulada, usando el servicio y repositorio reales.

**Impacto:** el estado del intent puede dejar de reflejar una operación ya exitosa. No se demostró movimiento de dinero, cambio de ledger ni persistencia contra triggers reales. Es independiente de F01: aquí el actor pertenece legítimamente al tenant y sigue pudiendo producir una transición inválida.

**Acción:** estados y transiciones permitidos explícitos; registrar evaluación tardía sin reescribir el resultado terminal; aplicar reembolso/reversión mediante comandos financieros específicos e idempotentes. Mantener lock y coherencia con transacciones/ledger.

**Cierre exigido:** matriz de estados, replay de decisiones y evaluación concurrente con confirmación/cancelación del pago; estado y ledger coherentes después del commit. Rechazar transición inválida o guardar evaluación sin mutar el terminal, según contrato aprobado.

### F08 — El fallback de throttling acumula memoria después del TTL

**Clase:** CWE-401/CWE-400. `src/common/security/redis-throttler.storage.ts:44` crea un Map local; `:122`–`:132` sólo reemplaza la entrada si se vuelve a usar la misma clave. No hay sweep, límite global ni eliminación de entradas antiguas de clientes que no regresan.

**AUD-06** crea 1.000 claves, adelanta el reloj más allá del TTL y agrega una nueva: siguen presentes **1.001 entradas**. Condición: Redis ausente o su operación falla, que activa este fallback. No se realizó carga ni se agotó memoria; el riesgo de indisponibilidad por acumulación es una inferencia del crecimiento no acotado.

**Acción:** caché TTL acotada con eliminación real y límite de claves, métricas de fallback y política explícita de degradación; considerar comportamiento distribuido del rate limit cuando Redis falla.

**Cierre exigido:** reloj controlado, alta rotación de claves y recuperación Redis; memoria/número de claves acotados y comportamiento seguro de cuotas durante la degradación.

### F09 — Los controles de release no están dando una señal utilizable

Tres evidencias convergen:

- `src/modules/terminology/import/xlsx-parser.ts:254` incumple `@typescript-eslint/no-base-to-string`; el archivo y su spec acumulan 18 errores de formato adicionales y una advertencia. No se elevan defectos de formato a vulnerabilidad.
- `package.json:276` exige 74/69/59/75; las cuatro métricas locales quedan por debajo y el proceso termina 1. La suite de assertions verde no satisface el contrato del gate.
- [PR #462](https://github.com/mdavila-2001/mantra-core-health-api/pull/462), que produjo exactamente el SHA auditado, se integró a las `2026-09-25T17:16:09Z` con el check `docs` en **FAILURE**. [Run 36161224519](https://github.com/mdavila-2001/mantra-core-health-api/actions/runs/36161224519) falló en “Levantar MinIO” al descargar la imagen; instalación, build, tipos, lint, audit y tests aparecen `skipped`. `.github/workflows/docs.yml:185` coloca esa dependencia de infraestructura antes de los gates estáticos.

La API de GitHub informa que `dev` está protegida, pero no se obtuvo la configuración detallada de protección. **No** se concluye que no haya protección: sí que, para ese merge concreto, el fallo no impidió integrar. Debe verificarse si hubo excepción/bypass, qué checks son obligatorios y para qué SHA.

La prueba RLS de `test/integration/rls.int-spec.ts:55` es opt-in mediante `RLS_TEST=1`; no se encontró ese opt-in en el workflow auditado. Una “suite completa” no equivale automáticamente a aislamiento por RLS validado. El harness de integración con actores privilegiados tampoco reemplaza negativos con roles ordinarios.

**Acción:** reparar lint y cobertura con pruebas útiles; separar gates estáticos de infraestructura; estabilizar/pinear suministro de imágenes; exigir checks del candidato real y gobernar excepciones de merge; añadir carril RLS desechable con credenciales runtime no privilegiadas. No bajar cobertura como arreglo cosmético.

**Cierre exigido:** candidato Node 24/Linux con build, tipos, lint, audit, cobertura, contratos, integración y negativos RLS verdes; demostrar mediante PR de prueba controlado que un gate fallido bloquea merge ordinario. No se publicó ningún PR ni se alteró la configuración remota durante esta auditoría.

### F10 — Hotspots que favorecen políticas divergentes

| Servicio | Líneas físicas | Nodos de decisión AST | Commits desde 2026-08-01 |
|---|---:|---:|---:|
| `scheduling-bookings.service.ts` | 3.331 | 160 | 39 |
| `profiles-practitioners.service.ts` | 2.805 | 137 | 66 |
| `profiles-patients.service.ts` | 2.479 | 123 | 22 |
| `scheduling-catalog.service.ts` | 2.254 | 118 | 34 |

Las líneas incluyen comentarios; los nodos de decisión por archivo **no** son complejidad ciclomática por función. Constantes generadas como `concepts.ts` no se consideran defectuosas por tamaño. No se midió porcentaje de duplicación ni mutation score.

El motivo para priorizar agenda no es estético: F01 muestra diferencia material entre política de detalle y de listado en un servicio de alta frecuencia de cambios.

**Acción:** extraer políticas y casos de uso incrementalmente, primero agenda/ownership, con tests de caracterización y contratos compartidos entre list/detail/mutación. Evitar reescritura general: tipos/build y miles de tests existentes son una base aprovechable. Cierre: una política autorizadora por caso de uso, negativos compartidos y reducción de responsabilidades sin perder comportamiento.

## CVSS v4.0 — base provisional, no certificación del entorno

Se usó la implementación de referencia FIRST/Red Hat fijada a una revisión, mediante [cvss.cjs](cvss.cjs). Vectores completos, hash del calculador y resultados en [evidencia-cvss.json](evidencia-cvss.json); criterio según [FIRST CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document). Los valores no sustituyen prioridad clínica/financiera ni estiman probabilidad de incidente.

| Variante | CVSS-B | Supuestos decisivos |
|---|---:|---|
| F01 clínica | 7,1 | Usuario clínico autenticado; lectura parcial y posible integridad alta por bootstrap; escritura valorada por código, no inserción real |
| F01 pagos | 7,1 | Rol de pagos en tenant propio, no permisos sobre la víctima; integridad alta, sin afirmar disponibilidad o extracción de dinero |
| F01 agenda | 5,3 | Usuario paciente; exposición parcial de metadatos, no historia clínica completa |
| F03 offboarding | 7,6 | Requiere retirada posterior de acceso; impacto depende de permisos previos, modelados como lectura/escritura sensible |
| F04 WebSocket | 6,0 | Conexión válida previa y revocación/expiración posterior; confidencialidad de conversaciones futuras |
| F05 logging | 2,0 | Requiere acceso a logs y que un error contenga dato sensible; exposición limitada, no acceso público a logs demostrado |
| F07 estados de pago | 6,9 | Rol administrativo de pagos; integridad alta de estado, sin impacto monetario ulterior demostrado |
| F08 throttler | 6,3 | Requiere fallback activo; degradación por crecimiento, no caída total probada |

F02, F06, F09 y F10 se valoran como configuración, operación y calidad, sin fingir un vector de ataque independiente. Recalcular CVSS con exposición, roles y controles realmente desplegados antes de registrar un informe de pentest formal.

## Controles presentes que deben conservarse

Evidencia de código y suite local, no afirmación de seguridad integral:

- `src/common/auth/jwt.strategy.ts:44` fija algoritmo y `:59` consulta sesión activa; el problema de offboarding/WS no implica que cualquier JWT HTTP revocado siga válido.
- `src/main.ts:135` aplica Helmet, `:140` limita JSON y `:160` valida DTO con whitelist/forbidNonWhitelisted. La validación estructural no reemplaza autorización del recurso.
- `src/common/http/ssrf-guard.ts:239` valida destino resuelto y proporciona DNS pinning; no se demostró SSRF en el camino revisado.
- Bloqueos pesimistas en citas/pagos y transacciones explícitas existen. F01/F07 requieren corregir política/invariantes, no quitar esos controles.
- El error genérico hacia el cliente y la redacción de auth/cookies funcionan en el caso sintético; la brecha restante es observabilidad interna.
- El inventario de código no-test/no-entidades encontró cero assertions `as any` y cero `@ts-ignore`. Esto no demuestra ausencia de todo tipo inseguro ni buen diseño por sí solo.

## Plan de salida a producción

1. **Contención de release:** no aprobar este SHA; asignar F01–F04/F06/F07/F09 a responsables y confirmar inventario del artefacto realmente desplegado. No se ha ejecutado ninguna contención sobre sistemas existentes.
2. **Cerrar autorización e integridad:** corregir política por objeto, revocación HTTP/WS y estados terminales; convertir las reproducciones en regresiones que esperan denegación/invariantes correctas. Los tests actuales de auditoría esperan el defecto: no incorporarlos como gate de seguridad verde sin invertir su expectativa.
3. **Validar infraestructura desechable equivalente a producción:** privilegio mínimo, RLS, políticas SQL, migraciones, workers, callbacks y pérdida de dependencias. Ensayar restore/rollback y asegurar que readiness controla admisión.
4. **Restaurar gates del candidato exacto:** Linux/Node 24, dependencias inmutables, cero lint, cobertura ≥ mínimos existentes, contratos generados y suite completa, incluidos opt-ins relevantes. Verificar reglas de merge.
5. **Aprobación informada:** sólo después de negativos reales y evidencia del artefacto/configuración, con aceptación fechada de P2 y revisión de privacidad/observabilidad. Cargar y medir SLO según tráfico objetivo antes de anunciar capacidad.

## Completado

Inventario y priorización de hotspots; revisión dirigida de caminos de riesgo; instalación inmutable de la dependencia faltante; tipos/build/lint/cobertura/audit/guardrails/lint OpenAPI; nueve reproducciones; sondas locales no mutantes; trazabilidad de CI; informe y plan. Terminar la auditoría **no** significa terminar las correcciones.

## A medias

Preparación para producción: compila y las assertions unitarias pasan, pero lint/cobertura y controles de seguridad/integridad impiden aprobación. La evidencia dinámica de seguridad está en clases reales con dobles, no en una integración productiva completa.

## Pendiente

Remediaciones F01–F10; validación en PostgreSQL/RLS real de las reproducciones; prueba de red WebSocket multi-réplica; reevaluación del SHA remoto/candidato final y del rol/runtime desplegado; gates CI protegidos y operativos.

## No cubierto

- No revisión semántica individual exhaustiva de los 1.365 decoradores/rutas, ni pentest negro de producción. La lectura fue dirigida por riesgo; no todos los módulos recibieron igual profundidad.
- No integración/E2E sobre DB, RLS real, triggers financieros, carrera multi-proceso, migración completa, rollback/restore, failover ni recuperación de colas. No se ejecutaron resets ni semillas en servicios existentes.
- No auditoría de IAM/cloud, TLS/balanceador/firewalls, roles de base reales de producción, secretos en gestores remotos, backups cifrados, retención legal ni cumplimiento normativo certificado.
- No escaneo exhaustivo de secretos en todo el historial Git ni SBOM/imagen OS firmada. `npm audit` no acredita dependencias distribuidas fuera del registro —incluido el tarball XLSX— ni seguridad de código propio.
- No prueba de carga, percentiles p95/p99, capacidad, OOM, SLO/SLA, ni dimensionamiento de pools y workers bajo tráfico real.
- No medición con knip/jscpd/madge, duplicación/ciclos completos, dead-code exhaustivo ni mutation testing. Las métricas AST no sustituyen esas dimensiones.
- No regeneración/comparación completa OpenAPI/AsyncAPI contra servidor; se validó el OpenAPI versionado. No inspección visual ni frontend.

## Desvíos

- Se usó `test:cov --maxWorkers=1` en vez del unitario simple previsto: incorpora assertions y cobertura en un solo runner; se respetó la restricción de recursos.
- Se corrigió sólo el entorno de dependencias con `install --immutable` para no convertir un `xlsx` ausente localmente en un falso defecto de producto.
- Se añadieron diagnósticos a documentación, no tests del producto ni parches funcionales. No se pretendió hacer pasar gates mediante cambios de código.
- La observación Docker existente se declaró separada porque no identifica el SHA auditado.

## Riesgos residuales y decisiones

El riesgo prioritario es confundir controles globales, comentarios y miles de pruebas positivas con autorización demostrada por recurso. La documentación del bootstrap reconoce la falta de política, pero reconocerla no vuelve aceptable exponerla en producción.

Decisión: **NO-GO del snapshot**, conservar el código existente y corregir incrementalmente, no reescribir. No se cambiaron permisos remotos, PRs, despliegues ni datos. El reporte no acredita ausencia de otros defectos y no reemplaza las verificaciones pendientes del candidato de release.
