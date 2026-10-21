<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Glosario

66 términos de los glosarios de la API y del frontend, con su fuente. Un término que figura en los dos se muestra dos veces: no se unifican definiciones. Los enlaces relativos de las definiciones se quitaron (apuntaban a otro árbol de documentos); queda su texto.

| Término | Definición | Tablas relacionadas | Fuente |
|---|---|---|---|
| PHI | Protected Health Information — dato de salud identificable. El PDP clínico (`authz`) exige rol **y** alcance clínico vigente para acceder a PHI, no basta con el rol (ver autorización). | — | `mantra-core-health-api:docs/business/glossary.md:7` |
| PDP | Policy Decision Point — el punto que decide si una petición de acceso clínico se concede, implementado en `src/modules/authz/services/authz-pdp.service.ts`. | — | `mantra-core-health-api:docs/business/glossary.md:8` |
| RBAC | Role-Based Access Control — autorización por rol global (`RolesGuard`, `@Roles(...)`), 120 roles distintos en uso (ver actores y roles). | — | `mantra-core-health-api:docs/business/glossary.md:9` |
| RLS | Row-Level Security — aislamiento de filas por tenant a nivel de PostgreSQL, controlado por `RLS_ENFORCE` (ver `SEC-001` en la matriz de trazabilidad). | — | `mantra-core-health-api:docs/business/glossary.md:10` |
| Tenant | Unidad de aislamiento multi-organización del sistema (una clínica, cadena o red de salud). | — | `mantra-core-health-api:docs/business/glossary.md:11` |
| Outbox | Patrón de mensajería transaccional propio sobre PostgreSQL (`messaging.message_queues`); un cambio de dominio y su evento se escriben en la misma transacción, y `worker-messaging` los despacha después. | — | `mantra-core-health-api:docs/business/glossary.md:12` |
| row_version | Columna de bloqueo optimista presente en el modelo de datos (`version: true` en MikroORM); dos escrituras concurrentes sobre la misma fila se detectan en vez de pisarse silenciosamente. | — | `mantra-core-health-api:docs/business/glossary.md:13` |
| Concepto / catálogo de terminología | El modelo resuelve casi todos sus valores cerrados contra `terminology.catalog_concepts` (columnas `*_concept_id`) en vez de enums nativos — añadir un valor es un `INSERT`, no una migración. | — | `mantra-core-health-api:docs/business/glossary.md:14` |
| Worker | Proceso Node independiente (17 en total) que ejecuta ticks periódicos de un dominio, llamando a la API por HTTP (`/internal/*`) — no accede a la base directamente. Ver mapa de integraciones. | — | `mantra-core-health-api:docs/business/glossary.md:15` |
| DDD por schema | Cada uno de los 57-60 módulos de negocio corresponde a un *schema* PostgreSQL propio del "modelo canónico SALUD" — el límite de módulo en código es también el límite de schema en base de datos. | — | `mantra-core-health-api:docs/business/glossary.md:16` |
| @Public() | Decorador que exime un endpoint del guard JWT global — 9 endpoints en todo el sistema, lista verificada en notas de generación de OpenAPI. | — | `mantra-core-health-api:docs/business/glossary.md:17` |
| Modelo canónico SALUD | Nombre del modelo de datos versionado (**v4.0.10**, declarado en `Mantra Core Health Context/model-manifest.yaml` — la fuente que leen los generadores) del que derivan los 60 módulos y sus 1 186 entidades. | — | `mantra-core-health-api:docs/business/glossary.md:18` |
| Break-the-glass | Mecanismo de acceso clínico de emergencia que otorga acceso excepcional a PHI fuera del flujo normal de autorización, auditado explícitamente (módulo `authz`). | — | `mantra-core-health-api:docs/business/glossary.md:19` |
| DomainException | Jerarquía de excepciones propia (`ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException`, ...) que homogeneiza el modelo de error entre los 60 módulos. Ver modelo de error. | — | `mantra-core-health-api:docs/business/glossary.md:20` |
| ALOVIDA | El ecosistema de salud al que pertenece la aplicación | — | `mantra-core-health:docs/business/glossary.md:13` |
| ALOVIDA | El sistema de diseño, v1.0 | — | `mantra-core-health:docs/business/glossary.md:14` |
| M34 | El modelo canónico. Declara 81 secciones, 9 estados de interfaz y 14 proyecciones materializadas | — | `mantra-core-health:docs/business/glossary.md:15` |
| PHI | *Protected Health Information*. Información de salud protegida | — | `mantra-core-health:docs/business/glossary.md:16` |
| Tenant | Organización a la que pertenece un usuario | — | `mantra-core-health:docs/business/glossary.md:17` |
| Practitioner | Profesional de salud | — | `mantra-core-health:docs/business/glossary.md:18` |
| Patient | Paciente | — | `mantra-core-health:docs/business/glossary.md:19` |
| Person | Registro del directorio, distinto de la cuenta de acceso | — | `mantra-core-health:docs/business/glossary.md:20` |
| Account link | Vínculo entre una persona y una cuenta | — | `mantra-core-health:docs/business/glossary.md:21` |
| Value set | Conjunto de valores de terminología | — | `mantra-core-health:docs/business/glossary.md:24` |
| Concept ID | Identificador estable de un concepto. **Lo que se manda**; `display` es solo para mostrar | — | `mantra-core-health:docs/business/glossary.md:25` |
| Expansión | La lista de opciones vigentes de un conjunto de valores | — | `mantra-core-health:docs/business/glossary.md:26` |
| Proyección materializada | Vista precalculada del servidor. **Puede estar atrasada** → S7 | — | `mantra-core-health:docs/business/glossary.md:27` |
| S1 | `route-auth-pending` | — | `mantra-core-health:docs/business/glossary.md:58` |
| S2 | `loading` | — | `mantra-core-health:docs/business/glossary.md:59` |
| S3 | `empty` | — | `mantra-core-health:docs/business/glossary.md:60` |
| S4 | `validation` | — | `mantra-core-health:docs/business/glossary.md:62` |
| S5 | `forbidden` | — | `mantra-core-health:docs/business/glossary.md:63` |
| S6 | `not-found` | — | `mantra-core-health:docs/business/glossary.md:64` |
| S7 | `stale` | — | `mantra-core-health:docs/business/glossary.md:65` |
| S8 | `offline` | — | `mantra-core-health:docs/business/glossary.md:66` |
| S9 | `error` | — | `mantra-core-health:docs/business/glossary.md:67` |
| core/ | Infraestructura sin interfaz: sesión, HTTP, estados, tokens | — | `mantra-core-health:docs/business/glossary.md:97` |
| shared/ | Interfaz reutilizable: 48 componentes en tres niveles | — | `mantra-core-health:docs/business/glossary.md:98` |
| features/ | Pantallas | — | `mantra-core-health:docs/business/glossary.md:99` |
| Átomo / molécula / organismo | Los tres niveles de atomic design. **El nivel es la carpeta**, no un decorador | — | `mantra-core-health:docs/business/glossary.md:100` |
| Barril | `shared/index.ts`, la API pública de `shared/`. Hoy **no lo importa nadie** | — | `mantra-core-health:docs/business/glossary.md:101` |
| ViewStateHost | El organismo que pinta los nueve estados, una vez para todo el proyecto | — | `mantra-core-health:docs/business/glossary.md:102` |
| FORM_CONTROL_CONTEXT | El contrato de accesibilidad entre un campo y su control | — | `mantra-core-health:docs/business/glossary.md:103` |
| Fan-in | Cuántos archivos importan a uno. **Lo que cuesta cambiarlo** | — | `mantra-core-health:docs/business/glossary.md:104` |
| Radio de firma | `28px 4px 28px 4px`. Un elemento por pantalla, nunca en botones ni entradas | — | `mantra-core-health:docs/business/glossary.md:105` |
| Excepciones E1–E4 | Las excepciones WCAG declaradas por el sistema de diseño, con su medición | — | `mantra-core-health:docs/business/glossary.md:106` |
| Access token | JWT de acceso. **Memoria**, minutos | — | `mantra-core-health:docs/business/glossary.md:112` |
| Refresh token | Canjea por un par nuevo. **`localStorage`**, se rota entero | — | `mantra-core-health:docs/business/glossary.md:113` |
| sub | Identificador del usuario. **El único claim obligatorio** | — | `mantra-core-health:docs/business/glossary.md:114` |
| sid | Identificador de sesión, para cerrarla del lado del servidor | — | `mantra-core-health:docs/business/glossary.md:115` |
| tenants[] | Organizaciones del usuario | — | `mantra-core-health:docs/business/glossary.md:116` |
| tenantNames{} | Su nombre legible, «para no mostrar uuid crudos» | — | `mantra-core-health:docs/business/glossary.md:117` |
| X-Tenant-Id | Cabecera con la organización activa. **Se omite si no está resuelta** | — | `mantra-core-health:docs/business/glossary.md:118` |
| requestId | Identificador de correlación. En la interfaz: **«código de soporte»** | — | `mantra-core-health:docs/business/glossary.md:119` |
| Prerenderizado | HTML generado en el build. **4 rutas** | — | `mantra-core-health:docs/business/glossary.md:126` |
| Hidratación | Angular toma el HTML del servidor y lo hace interactivo | — | `mantra-core-health:docs/business/glossary.md:127` |
| outputHashing | Hash en el nombre de cada archivo. Permite cachear un año | — | `mantra-core-health:docs/business/glossary.md:128` |
| Presupuesto | Límite de tamaño de `angular.json`. Hoy avisa a 500 kB | — | `mantra-core-health:docs/business/glossary.md:129` |
| env.generated.ts | Puente entre `.env` y el paquete. **Generado, no versionado** | — | `mantra-core-health:docs/business/glossary.md:130` |
| --st-error-* | **No es severidad clínica.** Es semántica de producto (`identidad-visual.md` 11.3) | — | `mantra-core-health:docs/business/glossary.md:137` |
| --st-primary-* | **No es un estado.** Es un chip de marca con la misma receta tonal | — | `mantra-core-health:docs/business/glossary.md:138` |
| --border-default | **No delimita controles.** Es un divisor decorativo. El de controles es `--border-strong` | — | `mantra-core-health:docs/business/glossary.md:139` |
| isDevMode() | **No es una bandera de funcionalidad.** Es el modo de compilación | — | `mantra-core-health:docs/business/glossary.md:140` |
| Bandera de funcionalidad | **No es autorización.** La autoridad es la API | — | `mantra-core-health:docs/business/glossary.md:141` |
| generatedAt | **No es cuándo se calculó el dato.** Es cuándo se armó la respuesta. El dato es `refreshedAt` | — | `mantra-core-health:docs/business/glossary.md:142` |
| Cobertura global (≈56 %) | **No es la métrica del proyecto.** Los umbrales son por área | — | `mantra-core-health:docs/business/glossary.md:143` |

