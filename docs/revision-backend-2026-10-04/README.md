# Revisión estricta del backend ALOVIDA

- Fecha de inicio: 2026-10-05.
- Base revisada: `origin/dev` en `02af1e09`, worktree `pablo/revision-backend-2026-10-04`.
- Estado: **revisión documental de módulos, núcleo, transversales y workers en cierre**. Este informe no declara el backend aprobado ni sustituye correcciones, pruebas de integración o revisión de producción.

## 1. Metodología y cobertura

Cada unidad documentada se revisó leyendo código, intentando refutar los hallazgos mediante guards, filtros, servicios, DDL, configuración y pruebas existentes. Sólo se conservan hallazgos con evidencia de archivo y línea. Los informes incluyen el plan de corrección y cuatro pruebas propuestas: correcto, límite, error y falla catalogada cuando existe contrato HTTP o de job.

| Grupo | Unidades documentadas | Cobertura real |
|---|---|---|
| Transversal | [autorización](./transversal/authz-transversal.md), [catálogo de errores](./transversal/catalogo-errores.md), [deriva de esquema](./transversal/deriva-esquema.md), [contrato OpenAPI/AsyncAPI](./transversal/contrato-openapi.md), [build y dependencias](./transversal/build-dependencias.md), [infraestructura](./transversal/infra-config.md), [suite de pruebas](./transversal/suite-pruebas.md) | Inventarios globales y recorridos en profundidad declarados en cada informe; no todos los endpoints, entidades ni rutas de despliegue. |
| Módulos | [clinical_ext](./modulos/clinical_ext.md), [clinical](./modulos/clinical.md), [profiles](./modulos/profiles.md), [community](./modulos/community.md), [ads](./modulos/ads.md), [pharma_lab](./modulos/pharma_lab.md), [procedures_perioperative](./modulos/procedures_perioperative.md), [audit](./modulos/audit.md), [automation](./modulos/automation.md), [chart](./modulos/chart.md), [crm](./modulos/crm.md), [payments](./modulos/payments.md), [billing](./modulos/billing.md), [accounting](./modulos/accounting.md), [insurance](./modulos/insurance.md), [health_data](./modulos/health_data.md), [consent](./modulos/consent.md), [delegated_access](./modulos/delegated_access.md), [scheduling](./modulos/scheduling.md), [pharmacy_inventory](./modulos/pharmacy_inventory.md), [pharmacy](./modulos/pharmacy.md), [identity_assurance](./modulos/identity_assurance.md), [diagnostics](./modulos/diagnostics.md), [terminology](./modulos/terminology.md), [medical_groups](./modulos/medical_groups.md), [quotations](./modulos/quotations.md), [ops_console](./modulos/ops_console.md), [geo](./modulos/geo.md), [public](./modulos/public.md), [qa_execution](./modulos/qa_execution.md), [audio_assets](./modulos/audio_assets.md), [organization_extensions](./modulos/organization_extensions.md), [auth_providers](./modulos/auth_providers.md), [content_packs](./modulos/content_packs.md), [redis_runtime](./modulos/redis_runtime.md), [search_platform](./modulos/search_platform.md), [document_store](./modulos/document_store.md), [polyglot_storage](./modulos/polyglot_storage.md), [tracking](./modulos/tracking.md), [cross_store_consistency](./modulos/cross_store_consistency.md), [object_storage](./modulos/object_storage.md) | Cobertura y pruebas dirigidas declaradas en cada informe. |
| Workers | [marco común](./workers/worker-framework.md) | 24 entrypoints, bootstrap, salud, ciclo de vida, cliente de API y Compose; no todos los jobs. |

Informes de módulos incorporados en esta tanda: [directory](./modulos/directory.md), [data_catalog](./modulos/data_catalog.md), [forms](./modulos/forms.md), [iam](./modulos/iam.md), [erp](./modulos/erp.md), [messaging](./modulos/messaging.md), [practice](./modulos/practice.md), [diagnostic_units](./modulos/diagnostic_units.md), [system_ops](./modulos/system_ops.md), [system_context](./modulos/system_context.md), [graph_intelligence](./modulos/graph_intelligence.md), [telemetry](./modulos/telemetry.md), [vector_rag](./modulos/vector_rag.md), [marketing](./modulos/marketing.md), [read_models](./modulos/read_models.md), [integration_contracts](./modulos/integration_contracts.md), [education](./modulos/education.md), [reporting](./modulos/reporting.md), [time_series](./modulos/time_series.md), [lakehouse](./modulos/lakehouse.md), [workflow](./modulos/workflow.md), [surveys](./modulos/surveys.md), [platform_ops](./modulos/platform_ops.md), [qa_lab](./modulos/qa_lab.md), [promotions](./modulos/promotions.md), [integrations](./modulos/integrations.md), [authz](./modulos/authz.md) y [health_context](./modulos/health_context.md).

Núcleo incorporado en esta tanda: [common](./nucleo/common.md), [auth/seguridad](./nucleo/common-auth-seguridad.md), [errores/HTTP](./nucleo/common-errores-http.md), [infraestructura común](./nucleo/common-infra.md), [seed](./nucleo/common-seed.md), [catálogo ORM](./nucleo/orm-catalogo.md), [núcleo ORM](./nucleo/orm-nucleo.md) y [app/persistencia/observabilidad](./nucleo/app-persistencia-observabilidad.md).

Workers complementarios: [24 entrypoints y 38 jobs](./workers/jobs-24.md).

La revisión estática no ejecutó flujos contra almacenes aislados ni despliegues reales. Cada informe delimita explícitamente lo no cubierto y propone sus pruebas de integración y extremo a extremo.

## 2. Resumen ejecutivo

Se confirmaron tres grupos de riesgo crítico que requieren corrección antes de considerar un despliegue de confianza:

| Prioridad | Riesgo consolidado | Evidencia y acción inicial |
|---|---|---|
| Crítica | Un webhook de transportista público altera estados sin autenticar al emisor. | [AUTHZ-T01](./transversal/authz-transversal.md#authz-t01--crítica--webhook-de-transportista-sin-autenticación): firma por transportista, protección anti-replay y comprobación de pertenencia antes de escribir. |
| Crítica | Rutas clínicas permiten operar con IDs de paciente o encuentro sin comprobar el acceso al recurso. | [AUTHZ-T02](./transversal/authz-transversal.md#authz-t02--crítica--aplicación-de-plantilla-crea-órdenes-para-pacienteencuentro-arbitrarios) y [CE-01](./modulos/clinical_ext.md#ce-01--crítica--autorización-por-id-clínico-incompleta): reutilizar la política clínica de lectura/escritura dentro de los servicios y verificar relación paciente–encuentro. |
| Crítica | El smoke puede truncar todas las tablas de negocio de la DB configurada sin comprobar que sea descartable. | [SP-01](./transversal/suite-pruebas.md#sp-01--crítico-el-reset-del-smoke-admite-una-base-no-descartable): bloquear antes de conectar si falta evidencia de DB aislada. |
| Crítica | Los comandos contables aceptan práctica y recursos financieros sin atarlos al tenant autorizado. | [ACC-01](./modulos/accounting.md#acc-01--crítica--los-writes-y-referencias-financieras-no-validan-el-alcance-de-prácticatenant): resolver alcance de práctica y cada recurso antes de mutar. |
| Crítica | La presentación legacy de un reclamo acepta cobertura y práctica sin comprobar que sean del actor/tenant. | [INS-01](./modulos/insurance.md#ins-01--crítica--alta-legacy-de-reclamos-sin-alcance-de-cobertura-ni-práctica): unificar autorización de reclamo antes de crear. |
| Crítica | `$everything` puede servir historia longitudinal sin comprobar acceso del actor al paciente y custodio. | [HD-01](./modulos/health_data.md#hd-01--crítica--everything-no-comprueba-acceso-del-actor-al-paciente-ni-al-custodio): aplicar política clínica antes de expandir y leer. |
| Crítica | Decisiones de consentimiento aceptan paciente y tenant sin autorización de recurso. | [CON-01](./modulos/consent.md#con-01--crítica--decisiones-de-privacidad-no-atan-paciente-y-tenant-al-actor): resolver alcance antes de persistir. |
| Crítica | Delegaciones y grants pueden combinar IDs de tenant, set, asignación y paciente de ámbitos distintos. | [DLG-01](./modulos/delegated_access.md#dlg-01--crítica--se-pueden-componer-delegaciones-y-grants-de-ámbitos-distintos): verificar la cadena completa antes de autorizar. |
| Crítica | El listado de agenda por recurso permite a un paciente obtener reservas de otros pacientes sin política de actor o tenant. | [SCHED-01](./modulos/scheduling.md#sched-01--crítica--el-listado-por-recurso-no-autoriza-al-actor-ni-acota-el-tenant): autorizar recurso y paciente antes de consultar y filtrar tenant en SQL. |
| Crítica | Comandos de inventario aceptan farmacia, sede, ubicación, lote y paciente sin comprobar que pertenezcan al actor/tenant. | [PINV-01](./modulos/pharmacy_inventory.md#pinv-01--crítica--los-writes-de-inventario-no-atan-actor-farmacia-sede-ubicación-lote-y-producto): resolver y validar la cadena antes de mutar stock. |
| Crítica | La administración de farmacias permite mutar una farmacia o tenant por UUID sin autorización de recurso. | [PHARM-01](./modulos/pharmacy.md#pharm-01--crítica--administración-global-sin-alcance-de-farmacia-o-tenant): resolver la farmacia dentro del tenant y membresía del actor. |
| Crítica | Casos y evidencia de identidad se cargan por UUID sin atar tenant ni sujeto autorizado. | [IDA-01](./modulos/identity_assurance.md#ida-01--crítica--casos-y-evidencia-de-identidad-se-operan-por-uuid-sin-alcance-de-tenant-o-sujeto): resolver alcance antes de leer o mutar. |
| Crítica | Las operaciones diagnósticas aceptan tenant, paciente y recursos clínicos sin imponer una política de recurso consistente. | [DIAG-01](./modulos/diagnostics.md#diag-01--crítica--escrituras-diagnósticas-sin-autorización-de-tenant-paciente-o-recurso): resolver y autorizar toda la cadena antes de crear o liberar resultados. |
| Crítica | La política de catálogo de terminología se escribe para cualquier tenant desde un rol global sin comprobar alcance organizacional. | [TERM-01](./modulos/terminology.md#term-01--crítica--política-de-catálogo-de-tenant-sin-autorización-de-ámbito): derivar el tenant de la sesión o exigir una pertenencia verificable. |
| Crítica | La creación de grupos médicos puede asociar un paciente sin aplicar la política clínica cuando no se proporciona un diagnóstico. | [MG-01](./modulos/medical_groups.md#mg-01--crítica--crear-un-grupo-con-paciente-no-aplica-la-política-clínica-si-no-llega-condición): autorizar el paciente siempre, antes de guardar o listar miembros. |
| Crítica | Una cotización valida la práctica pero no la relación del actor con el paciente ni las referencias clínicas citadas. | [QUOTE-01](./modulos/quotations.md#quote-01--crítica--alta-de-cotización-sin-política-de-paciente-ni-validación-de-referencias-clínicas): autorizar paciente y referencias antes de persistir. |
| Crítica | La administración de prácticas altera sedes, personal, configuración, acreditaciones e inventario por UUID sin comprobar el tenant activo. | [PRAC-01](./modulos/practice.md#prac-01--crítica--escrituras-administrativas-por-uuid-no-se-acotan-al-tenant-activo): resolver cada recurso dentro del tenant antes de escribir. |
| Crítica | La administración de unidades diagnósticas publica o altera recursos por UUID sin comprobar el tenant activo. | [DUNIT-01](./modulos/diagnostic_units.md#dunit-01--crítica--las-mutaciones-administrativas-resuelven-unidades-y-recursos-por-uuid-sin-alcance-de-tenant): resolver unidad y recursos hijos dentro del tenant antes de escribir. |
| Crítica | Las mutaciones del grafo por UUID no comparan el tenant activo con la definición, corrida, scope o hallazgo cargado. | [GRAPH-01](./modulos/graph_intelligence.md#graph-01--crítica--las-mutaciones-por-uuid-no-comparan-el-tenant-de-la-sesión-con-el-recurso-cargado): resolver cada agregado dentro del tenant antes de mutar. |
| Crítica | Cualquier JWT puede crear, aceptar o retirar consentimiento de telemetría en nombre de otro usuario. | [TEL-01](./modulos/telemetry.md#tel-01--crítica--un-usuario-puede-otorgar-aceptar-o-retirar-consentimiento-por-otra-persona): derivar el titular de la sesión y separar la operación administrativa auditada. |
| Crítica | El gobierno y runtime RAG cargan colecciones, sesiones y jobs por UUID sin acotar el tenant. | [VEC-01](./modulos/vector_rag.md#vec-01--crítica--colecciones-sesiones-y-jobs-cargados-por-uuid-no-se-acotan-al-tenant-activo): resolver cada recurso dentro del tenant antes de mutar. |
| Crítica | El borrado de embeddings selecciona documentos sin predicado de tenant. | [VEC-02](./modulos/vector_rag.md#vec-02--crítica--el-borrado-de-embeddings-no-filtra-documentos-por-tenant): incluir tenant en la selección y verificar la cadena antes de borrar. |
| Crítica | Marketing confía el tenant del DTO y muta segmentos, campañas y journeys por UUID sin alcance autenticado. | [MKT-01](./modulos/marketing.md#mkt-01--crítico--recursos-y-altas-no-se-vinculan-al-tenant-autenticado): derivar tenant y comprobar todas las relaciones antes de escribir. |
| Crítica | Los contratos de integración y recursos hijos se mutan por UUID sin comprobar el tenant activo. | [ICON-01](./modulos/integration_contracts.md#icon-01--crítica--contratos-y-recursos-hijos-se-cargan-por-uuid-sin-comprobar-el-tenant-activo): resolver cada recurso dentro del tenant antes de transicionar o escribir. |
| Crítica | Reporting resuelve definición, ejecución y programación por UUID sin comprobar el tenant activo. | [REP-01](./modulos/reporting.md#rep-01--crítica--definiciones-ejecuciones-y-programaciones-se-resuelven-por-uuid-sin-alcance-de-tenant): resolver la cadena dentro del tenant antes de exponer o mutar artefactos. |
| Crítica | Education muta curso, cohorte, inscripción, intento y certificado por UUID sin alcance de tenant. | [EDU-01](./modulos/education.md#edu-01--crítica--las-mutaciones-por-uuid-no-verifican-que-el-recurso-pertenezca-al-tenant-activo): resolver cada agregado mediante la cadena del curso y tenant. |
| Crítica | Lakehouse carga y relaciona recursos de catálogo e investigación por UUID sin alcance de tenant. | [LAKE-01](./modulos/lakehouse.md#lake-01--crítica--búsquedas-por-uuid-sin-tenant-permiten-cruzar-recursos-y-releases-entre-tenants): resolver recursos y releases dentro del tenant antes de crear o transicionar. |
| Crítica | Surveys lista y responde invitaciones por perfil sin cotejar el tenant de la invitación. | [SURV-01](./modulos/surveys.md#surv-01--crítica--las-invitaciones-y-respuestas-de-paciente-no-se-acotan-al-tenant-activo): resolver invitación y cuestionario dentro del tenant antes de leer o escribir. |
| Crítica | Platform operations muta cambios, despliegues, incidentes y prácticas por UUID sin comprobar el tenant activo. | [POPS-01](./modulos/platform_ops.md#pops-01--crítica--recursos-operativos-se-cargan-por-uuid-y-el-tenant-de-dto-se-confía-sin-alcance-del-recurso): resolver cada agregado y relación dentro del tenant antes de operar. |
| Crítica | QA Lab carga suites, corridas, resultados y evidencia por UUID sin comprobar el tenant activo. | [QALAB-01](./modulos/qa_lab.md#qalab-01--crítica--suites-corridas-y-evidencia-se-cargan-por-uuid-sin-comparar-el-tenant-activo): resolver cada agregado dentro del tenant antes de devolver o mutar evidencia. |
| Crítica | Promotions opera programas, descuentos y lealtad por UUID sin comprobar el tenant activo. | [PROM-01](./modulos/promotions.md#prom-01--crítica--programas-promociones-membresías-reglas-y-redenciones-se-resuelven-por-uuid-sin-alcance-de-tenant): resolver la cadena del programa/promoción dentro del tenant antes de operar. |
| Crítica | Integrations resuelve conexiones y mensajes por UUID sin comprobar el tenant activo. | [INT-01](./modulos/integrations.md#int-01--crítica--recursos-de-tenant-se-resuelven-por-uuid-sin-cotejar-el-tenant-activo): resolver la cadena conexión/mensaje/callback dentro del tenant antes de operar. |
| Crítica | Authz persiste relaciones clínicas, break-the-glass y representación legal sin resolver custodia de paciente/encuentro/consentimiento. | [AUTHZ-M01](./modulos/authz.md#authz-m01--crítica--las-relaciones-de-acceso-clínico-se-persisten-y-evalúan-sin-comprobar-custodia): resolver y autorizar la cadena antes de emitir o evaluar grants. |

Los informes individuales declaran además hallazgos altos sobre control de propiedad de archivos, contrato de errores, secretos de infraestructura, DDL incompleto, consistencia clínica y exposición del estado de workers. Los conteos no se suman mecánicamente: `CE-01` amplía parcialmente `AUTHZ-T02`; `IC-06` es una manifestación del contrato incompleto de `ERR-01`; y la ausencia de scripts de workers aparece en dos superficies.

## 3. Tablero por unidad

| Unidad | Crítica | Alta | Media | Baja | Informe |
|---|---:|---:|---:|---:|---|
| Autorización transversal | 2 | 1 | 1 | 0 | [authz-transversal](./transversal/authz-transversal.md) |
| Catálogo de errores | 0 | 3 | 2 | 0 | [catalogo-errores](./transversal/catalogo-errores.md) |
| Deriva de esquema | 0 | 2 | 1 | 0 | [deriva-esquema](./transversal/deriva-esquema.md) |
| Infraestructura y configuración | 0 | 3 | 2 | 1 | [infra-config](./transversal/infra-config.md) |
| Build y dependencias | 0 | 0 | 1 | 2 | [build-dependencias](./transversal/build-dependencias.md) |
| Suite de pruebas | 1 | 0 | 2 | 0 | [suite-pruebas](./transversal/suite-pruebas.md) |
| Contrato OpenAPI/AsyncAPI | 0 | 1 | 3 | 0 | [contrato-openapi](./transversal/contrato-openapi.md) |
| `clinical_ext` | 1* | 3 | 1 | 0 | [clinical_ext](./modulos/clinical_ext.md) |
| `payments` | 0 | 3 | 4 | 0 | [payments](./modulos/payments.md) |
| `billing` | 1 | 2 | 3 | 0 | [billing](./modulos/billing.md) |
| `accounting` | 1 | 1 | 2 | 0 | [accounting](./modulos/accounting.md) |
| `insurance` | 1 | 2 | 2 | 0 | [insurance](./modulos/insurance.md) |
| `health_data` | 1 | 2 | 1 | 0 | [health_data](./modulos/health_data.md) |
| `consent` | 1 | 1 | 1 | 0 | [consent](./modulos/consent.md) |
| `delegated_access` | 1 | 1 | 1 | 0 | [delegated_access](./modulos/delegated_access.md) |
| `scheduling` | 1 | 0 | 1 | 0 | [scheduling](./modulos/scheduling.md) |
| `pharmacy_inventory` | 1 | 1 | 1 | 0 | [pharmacy_inventory](./modulos/pharmacy_inventory.md) |
| `pharmacy` | 1 | 1 | 1 | 0 | [pharmacy](./modulos/pharmacy.md) |
| `identity_assurance` | 1 | 1 | 1 | 0 | [identity_assurance](./modulos/identity_assurance.md) |
| `diagnostics` | 1 | 1 | 1 | 0 | [diagnostics](./modulos/diagnostics.md) |
| `terminology` | 1 | 0 | 1 | 0 | [terminology](./modulos/terminology.md) |
| `medical_groups` | 1 | 1 | 1 | 0 | [medical_groups](./modulos/medical_groups.md) |
| `quotations` | 1 | 0 | 1 | 0 | [quotations](./modulos/quotations.md) |
| `ops_console` | 0 | 0 | 0 | 0 | [ops_console](./modulos/ops_console.md) |
| `geo` | 1 | 1 | 1 | 0 | [geo](./modulos/geo.md) |
| `public` | 0 | 0 | 0 | 0 | [public](./modulos/public.md) |
| `qa_execution` | 0 | 0 | 0 | 0 | [qa_execution](./modulos/qa_execution.md) |
| `audio_assets` | 0 | 0 | 0 | 0 | [audio_assets](./modulos/audio_assets.md) |
| `organization_extensions` | 1 | 0 | 1 | 0 | [organization_extensions](./modulos/organization_extensions.md) |
| `auth_providers` | 0 | 0 | 1 | 0 | [auth_providers](./modulos/auth_providers.md) |
| `content_packs` | 0 | 0 | 0 | 0 | [content_packs](./modulos/content_packs.md) |
| `redis_runtime` | 0 | 1 | 0 | 0 | [redis_runtime](./modulos/redis_runtime.md) |
| `search_platform` | 0 | 0 | 0 | 0 | [search_platform](./modulos/search_platform.md) |
| `document_store` | 1 | 0 | 0 | 0 | [document_store](./modulos/document_store.md) |
| `polyglot_storage` | 0 | 0 | 1 | 0 | [polyglot_storage](./modulos/polyglot_storage.md) |
| `tracking` | 2 | 0 | 0 | 0 | [tracking](./modulos/tracking.md) |
| `cross_store_consistency` | 0 | 0 | 0 | 1 | [cross_store_consistency](./modulos/cross_store_consistency.md) |
| `object_storage` | 1 | 0 | 0 | 0 | [object_storage](./modulos/object_storage.md) |
| `clinical` | 0 | 0 | 0 | 0 | [clinical](./modulos/clinical.md) |
| `profiles` | 0 | 0 | 1 | 0 | [profiles](./modulos/profiles.md) |
| `community` | 0 | 0 | 0 | 0 | [community](./modulos/community.md) |
| `ads` | 0 | 0 | 1 | 0 | [ads](./modulos/ads.md) |
| `pharma_lab` | 0 | 0 | 0 | 0 | [pharma_lab](./modulos/pharma_lab.md) |
| `procedures_perioperative` | 1 | 0 | 0 | 0 | [procedures_perioperative](./modulos/procedures_perioperative.md) |
| `audit` | 0 | 1 | 0 | 0 | [audit](./modulos/audit.md) |
| `automation` | 1 | 1 | 0 | 0 | [automation](./modulos/automation.md) |
| `chart` | 1 | 0 | 1 | 0 | [chart](./modulos/chart.md) |
| `crm` | 1 | 1 | 0 | 0 | [crm](./modulos/crm.md) |
| `directory` | 0 | 0 | 1 | 0 | [directory](./modulos/directory.md) |
| `data_catalog` | 0 | 0 | 1 | 0 | [data_catalog](./modulos/data_catalog.md) |
| `forms` | 0 | 1 | 0 | 0 | [forms](./modulos/forms.md) |
| `iam` | 0 | 0 | 2 | 0 | [iam](./modulos/iam.md) |
| `erp` | 1 | 2 | 0 | 0 | [erp](./modulos/erp.md) |
| `messaging` | 0 | 2 | 0 | 0 | [messaging](./modulos/messaging.md) |
| `practice` | 1 | 0 | 0 | 0 | [practice](./modulos/practice.md) |
| `diagnostic_units` | 1 | 0 | 0 | 0 | [diagnostic_units](./modulos/diagnostic_units.md) |
| `system_ops` | 0 | 2 | 1 | 0 | [system_ops](./modulos/system_ops.md) |
| `graph_intelligence` | 1 | 1 | 0 | 0 | [graph_intelligence](./modulos/graph_intelligence.md) |
| `telemetry` | 1 | 3 | 0 | 0 | [telemetry](./modulos/telemetry.md) |
| `vector_rag` | 2 | 0 | 0 | 0 | [vector_rag](./modulos/vector_rag.md) |
| `marketing` | 1 | 2 | 0 | 0 | [marketing](./modulos/marketing.md) |
| `read_models` | 0 | 3 | 0 | 0 | [read_models](./modulos/read_models.md) |
| `integration_contracts` | 1 | 0 | 0 | 0 | [integration_contracts](./modulos/integration_contracts.md) |
| `education` | 1 | 1 | 1 | 0 | [education](./modulos/education.md) |
| `reporting` | 1 | 0 | 0 | 0 | [reporting](./modulos/reporting.md) |
| `time_series` | 0 | 1 | 0 | 0 | [time_series](./modulos/time_series.md) |
| `lakehouse` | 1 | 1 | 1 | 0 | [lakehouse](./modulos/lakehouse.md) |
| `workflow` | 0 | 1 | 0 | 0 | [workflow](./modulos/workflow.md) |
| `surveys` | 1 | 1 | 0 | 0 | [surveys](./modulos/surveys.md) |
| `platform_ops` | 1 | 0 | 0 | 0 | [platform_ops](./modulos/platform_ops.md) |
| `qa_lab` | 1 | 0 | 0 | 0 | [qa_lab](./modulos/qa_lab.md) |
| `promotions` | 1 | 0 | 0 | 0 | [promotions](./modulos/promotions.md) |
| `integrations` | 1 | 2 | 1 | 0 | [integrations](./modulos/integrations.md) |
| `authz` | 1 | 0 | 0 | 0 | [authz](./modulos/authz.md) |
| `health_context` | 0 | 3 | 2 | 0 | [health_context](./modulos/health_context.md) |
| `system_context` | 0 | 3 | 1 | 0 | [system_context](./modulos/system_context.md) |
| Núcleo `common` | 0 | 1 | 1 | 0 | [common](./nucleo/common.md) |
| Núcleo auth/seguridad | 0 | 1 | 1 | 0 | [common-auth-seguridad](./nucleo/common-auth-seguridad.md) |
| Núcleo errores/HTTP | 0 | 2 | 1 | 0 | [common-errores-http](./nucleo/common-errores-http.md) |
| Núcleo infraestructura común | 0 | 1 | 1 | 0 | [common-infra](./nucleo/common-infra.md) |
| Núcleo seed | 0 | 1 | 1 | 0 | [common-seed](./nucleo/common-seed.md) |
| Núcleo catálogo ORM | 0 | 0 | 1 | 0 | [orm-catalogo](./nucleo/orm-catalogo.md) |
| Núcleo ORM | 0 | 2 | 0 | 0 | [orm-nucleo](./nucleo/orm-nucleo.md) |
| App, persistencia y observabilidad | 0 | 1 | 1 | 0 | [app-persistencia-observabilidad](./nucleo/app-persistencia-observabilidad.md) |
| Jobs de workers | 0 | 2 | 1 | 0 | [jobs-24](./workers/jobs-24.md) |
| Marco común de workers | 0 | 1 | 1 | 1 | [worker-framework](./workers/worker-framework.md) |

`*` Incluye y amplía parcialmente el cluster de autorización clínica ya registrado transversalmente; no debe contarse dos veces al priorizar.

## 4. Tabla única de críticos y altos

| Grupo | ID | Severidad | Corrección propuesta | Ola |
|---|---|---|---|---|
| Autorización | AUTHZ-T01 | Crítica | Firmar y asociar webhooks de transportista antes de mutar. | 0 |
| Autorización / clínica | AUTHZ-T02 + CE-01 | Crítica | Autorizar recurso clínico dentro del servicio, validar paciente–encuentro y destino de referencia. | 0 |
| Pruebas | SP-01 | Crítica | Preflight de base descartable y base temporal por corrida de smoke. | 0 |
| Archivos | AUTHZ-T03 | Alta | Política transaccional de escritura y de vínculo por dueño/destino. | 0 |
| Errores | ERR-03 | Alta | Redactar `detail`/causas de driver antes de loguear. | 0 |
| Infraestructura | IC-01 | Alta | Exigir HTTPS o túnel y sacar secretos de argumentos de proceso. | 0 |
| Infraestructura | IC-02 | Alta | Cerrar PostgreSQL público por defecto; túnel/VPN o TLS obligatorio. | 0 |
| Esquema | SCH-01, SCH-02 | Alta | Conciliar entidades sin DDL y completar el mecanismo verificable de materialización. | 0 |
| Errores | ERR-01, ERR-02 | Alta | Hacer obligatorio un `reason` catalogado para fallas de negocio y migrar guardas/rutas. | 1 |
| Infraestructura | IC-06 | Alta | Entregar `reason` catalogado en `/readiness`, coordinado con ERR-01. | 1 |
| Clínica | CE-02 | Alta | Obtener nacimiento desde fuente canónica, no desde el request. | 1 |
| Clínica | CE-03 | Alta | Persistir versiones de CDS o cambiar el contrato de rollback. | 1 |
| Clínica | CE-04 | Alta | Índices/constraints y manejo de conflictos para unicidades de negocio. | 1 |
| Workers | WF-01 | Alta | No exponer mensajes de error en `/status`; limitar la escucha. | 1 |
| Pagos | PAY-01 | Alta | Usar aritmética decimal exacta en splits, FX, payout, conciliación y billeteras. | 1 |
| Pagos | PAY-02 | Alta | Bloquear deuda por tenant/conexión y validar intención/sesión relacionadas. | 0 |
| Pagos | PAY-03 | Alta | Resolver endpoint de callback y validar path, antigüedad, red y evento del proveedor. | 0 |
| Billing | BILL-01 | Crítica | Autorizar práctica/documento antes de cada write y rechazar relaciones entre tenants. | 0 |
| Billing | BILL-02 | Alta | Validar signos y límite de asignación, descuento/retención y saldo con trazabilidad contable. | 1 |
| Billing | BILL-03 | Alta | Validar y restringir importes de líneas antes de calcular totales. | 1 |
| Accounting | ACC-01 | Crítica | Autorizar práctica, cuentas, periodo, partidas y banco dentro del servicio antes de cada write. | 0 |
| Accounting | ACC-02 | Alta | Alinear la clave de número de asiento entre contrato, consulta e índice y traducir la carrera. | 1 |
| Insurance | INS-01 | Crítica | Resolver actor, práctica, cobertura, carrier y autorización previa como un único alcance antes de escribir. | 0 |
| Insurance | INS-02 | Alta | Exigir coincidencia de carrier/prestador entre lote, reclamo y versión antes de conciliar. | 0 |
| Insurance | INS-03 | Alta | Decidir y probar la matriz de roles de lectura; corregir contrato y test rojo. | 1 |
| Health data | HD-01 | Crítica | Autorizar paciente y custodio para `$everything` antes de expandir el clúster. | 0 |
| Health data | HD-02, HD-03 | Alta | Derivar tenant de sesión/conexión y validar alcance en ingesta, de-identificación y exportación. | 0 |
| Consent | CON-01 | Crítica | Autorizar paciente/tenant y relaciones de propósito antes de crear decisiones. | 0 |
| Consent | CON-02 | Alta | Buscar y mutar documentos de consentimiento sólo dentro del alcance autorizado. | 0 |
| Delegated access | DLG-01 | Crítica | Verificar cadena tenant/asignación/set/delegación/paciente antes de emitir grants. | 0 |
| Delegated access | DLG-02 | Alta | Vincular el actor efectivo a la delegación y recurso en la evaluación. | 0 |
| Scheduling | SCHED-01 | Crítica | Autorizar actor y recurso, y filtrar el tenant en la consulta de reservas. | 0 |
| Pharmacy inventory | PINV-01 | Crítica | Resolver cadena tenant/farmacia/sede/ubicación/lote/producto antes de cada write. | 0 |
| Pharmacy inventory | PINV-02 | Alta | Derivar farmacia y sede reales para los asientos de conteo y recall; conciliar datos existentes. | 0 |
| Pharmacy | PHARM-01 | Crítica | Exigir tenant/membresía para cada farmacia y derivar el tenant del contexto. | 0 |
| Pharmacy | PHARM-02 | Alta | Validar cadena farmacia–sede–práctica–aseguradora antes de persistir. | 0 |
| Identity assurance | IDA-01 | Crítica | Asociar caso a tenant/sujeto y autorizar la cadena antes de toda mutación. | 0 |
| Identity assurance | IDA-02 | Alta | Derivar tenant y validar autoridad/endpoint antes de persistir. | 0 |
| Diagnostics | DIAG-01 | Crítica | Autorizar tenant, paciente, orden y recurso diagnóstico como una cadena antes de cada write. | 0 |
| Diagnostics | DIAG-02 | Alta | Aplicar política clínica antes de devolver estudios de imagen por paciente. | 0 |
| Terminology | TERM-01 | Crítica | Derivar y comprobar tenant organizacional antes de cambiar políticas de catálogo. | 0 |
| Medical groups | MG-01 | Crítica | Aplicar política clínica al paciente aunque la condición sea opcional. | 0 |
| Medical groups | MG-02 | Alta | Incorporar specs dirigidas para creación, invitación, lectura y transiciones. | 1 |
| Quotations | QUOTE-01 | Crítica | Comprobar acceso clínico al paciente y existencia/relación de cada cita antes de crear. | 0 |
| Geo | GEO-01 | Crítica | Derivar tenant del contexto y autorizar sujeto, consentimiento, sesión y geofence antes de toda lectura o mutación. | 0 |
| Geo | GEO-02 | Alta | Impedir eventos que combinen geofence y sujeto de tenants distintos. | 0 |
| Organization extensions | ORGEXT-01 | Crítica | Resolver cada hospital, licencia y afiliación dentro del tenant autorizado antes de mutar. | 0 |
| Redis runtime | REDIS-01 | Alta | Consumir challenges con comparación y borrado atómicos en Redis. | 1 |
| Document store | DOCSTORE-01 | Crítica | Aplicar autorización de lectura por tipo, recurso y finalidad antes de devolver el payload. | 0 |
| Tracking | TRACK-01 | Crítica | Autenticar cada webhook de transportista antes de mutar el timeline. | 0 |
| Tracking | TRACK-02 | Crítica | Resolver envíos y sujetos dentro del tenant y política del actor antes de mutar. | 0 |
| Object storage | OBJ-01 | Crítica | Aplicar tenant y acceso clínico antes de resolver o devolver referencias DICOMweb. | 0 |
| Procedures perioperative | PERIOP-01 | Crítica | Filtrar detalle y equipo por tenant y política clínica antes de devolverlos. | 0 |
| Audit | AUD-01 | Alta | Verificar la cadena completa o marcar el resultado parcial sin atestación positiva. | 1 |
| Automation | AUTO-01 | Crítica | Resolver toda la cadena de ejecución dentro del tenant y política del actor antes de mutar o escribir. | 0 |
| Automation | AUTO-02 | Alta | Validar destinos/mapeos al activar y devolver razones catalogadas desde el escritor dinámico. | 1 |
| Chart | CHART-01 | Crítica | Resolver y validar la relación paciente–encuentro antes de cada alta que acepte ambos UUID. | 0 |
| CRM | CRM-01 | Crítica | Derivar tenant del contexto y resolver cada recurso CRM dentro de ese alcance antes de leer o mutar. | 0 |
| CRM | CRM-02 | Alta | Validar la cadena tenant–pipeline–etapa–cuenta antes de convertir o avanzar oportunidades. | 1 |
| Forms | FORM-01 | Alta | Aplicar la política clínica del paciente antes de leer instancias o valores por encuentro. | 0 |
| ERP | ERP-01 | Crítica | Resolver recursos y relaciones ERP dentro del tenant autorizado antes de leer o mutar. | 0 |
| ERP | ERP-02 | Alta | Derivar el empleado de la sesión y enlazar la aprobación con la solicitud de ausencia. | 1 |
| ERP | ERP-03 | Alta | Validar que cada línea recibida pertenezca a la orden de compra en el tenant. | 0 |
| Messaging | MSG-01 | Alta | Corregir la clave de entrega para permitir una fila inicial por suscripción y evento. | 1 |
| Messaging | MSG-02 | Alta | Alinear DTO y DDL del destinatario y devolver una falla catalogada. | 1 |
| Practice | PRAC-01 | Crítica | Resolver práctica y todo recurso hijo por `id + tenantId` antes de cada write. | 0 |
| Diagnostic units | DUNIT-01 | Crítica | Derivar tenant del contexto y resolver unidad y recursos hijos dentro de ese alcance antes de mutar. | 0 |
| System operations | SYSOPS-01 | Alta | Ejecutar disposición paginada por entidad o rechazar entidades sin executor, sin marcar éxito vacío. | 1 |
| System operations | SYSOPS-03 | Alta | Unificar la fuente de política de residencia y validar referencias antes de insertar el binding. | 1 |
| Graph intelligence | GRAPH-01 | Crítica | Resolver cada agregado por `id + tenantId` antes de escribir o transicionar. | 0 |
| Graph intelligence | GRAPH-02 | Alta | Evaluar consentimiento y restricciones antes de recorrer con contexto de paciente. | 0 |
| Telemetry | TEL-01 | Crítica | Derivar el titular de consentimiento de la sesión y verificar propiedad al retirar. | 0 |
| Telemetry | TEL-02 | Alta | Derivar identidad y tenant de la sesión, y resolver toda referencia dentro de ese alcance. | 0 |
| Telemetry | TEL-03 | Alta | Aplicar allowlist y clasificación de propiedades antes de persistir o reenviar. | 0 |
| Telemetry | TEL-04 | Alta | Incorporar tenant al scope SQL de toda consulta analítica. | 1 |
| Vector RAG | VEC-01 | Crítica | Resolver colección, sesión, job y política por `id + tenantId` antes de mutar. | 0 |
| Vector RAG | VEC-02 | Crítica | Filtrar por tenant y validar cadena de colección antes de seleccionar y borrar documentos. | 0 |
| Marketing | MKT-01 | Crítica | Derivar tenant del contexto y resolver cada recurso y relación dentro de ese alcance. | 0 |
| Marketing | MKT-02 | Alta | Migrar unicidades de código a `(tenant_id, code)` y traducir la carrera a conflicto. | 1 |
| Marketing | MKT-03 | Alta | Reemplazar identidad pública por token firmado y ligado al destinatario. | 0 |
| Read models | RM-01 | Alta | Autorizar audiencia, permiso, propósito, feature flag y contextos antes de exponer contrato o filas. | 0 |
| Read models | RM-02 | Alta | Ejecutar la proyección autorizada, con columnas/filtros/cursor allow-listed, o devolver indisponibilidad. | 1 |
| Read models | RM-03 | Alta | Diferenciar resultado vacío de indisponibilidad de MV con error saneado y alerta. | 1 |
| Integration contracts | ICON-01 | Crítica | Resolver contrato y cada recurso hijo por `id + tenantId` antes de mutar o entregar. | 0 |
| Education | EDU-01 | Crítica | Resolver curso y recursos hijos por la cadena con tenant antes de mutar. | 0 |
| Education | EDU-02 | Alta | Derivar aprendiz de la sesión y exigir propiedad de inscripción/intento. | 0 |
| Reporting | REP-01 | Crítica | Resolver fuente, definición, ejecución y schedule por `id + tenantId` antes de operar. | 0 |
| Time series | TS-01 | Alta | Verificar consentimiento activo, sujeto, propósito y tenant antes de aceptar ubicación. | 0 |
| Lakehouse | LAKE-01 | Crítica | Resolver recursos y relaciones de catálogo/investigación por `id + tenantId` antes de operar. | 0 |
| Lakehouse | LAKE-02 | Alta | Alinear campos obligatorios de DTO, defaults de servicio, entidad y DDL antes del flush. | 1 |
| Núcleo common | CMM-01 | Alta | Emitir reasons estables desde guards, resolución de tenant e interceptor, y preservarlos en el filtro. | 1 |
| Workers | WJ-01 | Alta | Derivar el tenant real del recurso para mantenimiento Timescale y registrar la atribución correcta. | 1 |
| Workers | WJ-02 | Alta | Exigir adapters productivos y gates de arranque para cross-store, identidad y vector. | 1 |
| Contrato | CO-01 | Alta | Alinear `ErrorResponse` OpenAPI y los estados/códigos emitidos por el filtro global. | 1 |
| Núcleo auth/seguridad | CAS-01 | Alta | Convertir rechazos de autenticación y tenant a `DomainException` con reason estable. | 1 |
| Núcleo errores/HTTP | CEH-01 | Alta | Catalogar rechazos de pipes de query con código y reason. | 1 |
| Núcleo errores/HTTP | CEH-02 | Alta | Traducir secreto cifrado inválido a falla catalogada sin detalle interno. | 1 |
| Núcleo infraestructura | CIF-01 | Alta | Validar S3 en el arranque y emitir falla catalogada antes de la primera operación. | 1 |
| Núcleo seed | SEED-01 | Alta | Hacer fallar el bootstrap de forma atómica cuando falla un seed core. | 1 |
| Núcleo ORM | ORMN-01 | Alta | Hacer fatal y observable el fallo al crear FKs e índices críticos. | 0 |
| Núcleo ORM | ORMN-02 | Alta | Redactar SQL y detalles sensibles antes del logger ORM. | 0 |
| App/persistencia | APO-01 | Alta | Hacer que `/readiness` responda con reason estable y contrato consistente. | 1 |
| System context | SYSCTX-01 | Alta | Acotar la clave de idempotencia al contexto y respaldarla con índice compuesto. | 1 |
| System context | SYSCTX-02 | Alta | Proteger bindings y ventanas contra carreras mediante constraints o locks estables. | 1 |
| System context | SYSCTX-03 | Alta | Exigir procedencia completa en el DTO antes de llegar a constraints de base. | 2 |
| Workflow | WF-02 | Alta | Evaluar el propósito de uso contra la política del actor antes de transicionar. | 0 |
| Surveys | SURV-01 | Crítica | Resolver invitación/cuestionario por tenant y validar la cadena antes de listar o responder. | 0 |
| Surveys | SURV-02 | Alta | Respaldar idempotencia, versiones y respuestas con UNIQUE/CHECK y traducir las carreras. | 1 |
| Platform operations | POPS-01 | Crítica | Resolver todos los recursos operativos por `id + tenantId` antes de transicionar o desplegar. | 0 |
| QA Lab | QALAB-01 | Crítica | Resolver suite, entorno, corrida, resultado y defecto por `id + tenantId` antes de operar. | 0 |
| Promotions | PROM-01 | Crítica | Resolver programa/promoción y todo hijo por `id + tenantId` antes de canjear, emitir o revertir. | 0 |
| Integrations | INT-01 | Crítica | Resolver conexión, mensaje y callback dentro del tenant antes de encolar, rotar o transicionar. | 0 |
| Integrations | INT-02 | Alta | Resolver `secretRef` en la bóveda por conexión activa para firmar y validar webhooks. | 1 |
| Integrations | INT-03 | Alta | Respaldar la deduplicación de callback con UNIQUE e inserción atómica. | 1 |
| Authz | AUTHZ-M01 | Crítica | Resolver paciente, encuentro, consentimiento y custodio dentro del tenant antes de persistir o evaluar acceso. | 0 |
| Health context | HC-01 | Alta | Validar país/tier y procedencia antes de aceptar una fuente en el contexto clínico. | 1 |
| Health context | HC-02 | Alta | Derivar agente y país desde schedule/contexto y rechazar contradicciones del DTO. | 1 |
| Health context | HC-03 | Alta | Respaldar la idempotencia de corrida con clave única e inserción/relectura atómica. | 1 |

## 5. Patrones transversales

1. La autenticación y el rol global no prueban permiso sobre un recurso concreto. La corrección sistémica es una política de autorización por paciente, encuentro, archivo y dueño que los servicios ejecuten antes de leer o mutar.
2. El contrato HTTP tiene `status` y `code`, pero `reason` no es obligatorio ni centralizado. Definir la forma de razón una vez y migrar por módulos evita parches incompatibles.
3. Las pruebas pueden existir y aun así no demostrar el contrato: el smoke acepta status sin code/reason, el e2e actual sólo prueba el saludo, y el reset de smoke necesita aislamiento verificable.
4. La salud de workers y despliegue requiere no exponer diagnóstico sensible y comprobar realmente los límites de red, proceso y base de datos.
5. DDL, entidades y catálogo deben verificarse como una cadena; comparar sólo una fuente puede ocultar objetos que no se crean con el repositorio.

## 6. Política de falla catalogada y pruebas

Para rutas HTTP de negocio, cada prueba negativa debe afirmar `HttpStatus`, `ErrorCode` y una razón estable (`details.reason` o una forma versionada acordada). Ningún reason debe incluir IDs, datos clínicos, secretos ni texto libre del usuario. Para herramientas CLI, Docker, SQL one-shot y sondas técnicas no corresponde inventar un `ErrorCode` de negocio: el contrato es salida de proceso, SQLSTATE o diagnóstico técnico saneado.

La matriz concreta por endpoint o job está en cada informe. La base de helpers recomendada debe cubrir respuestas catalogadas, dos actores del mismo tenant, dos tenants, recursos clínicos relacionados y base de datos temporal por prueba destructiva.

## 7. Plan maestro por olas

| Ola | Objetivo | Salida y gates |
|---|---|---|
| 0 | Detener riesgos de acceso, datos y secretos. | Corregir los críticos, propiedad de archivos, logging de driver, URL de Coolify, PostgreSQL público y DDL incompleto. Pruebas de integración aisladas y revisión de red/DB. |
| 1 | Consolidar contratos y consistencia clínica. | Catálogo `reason`, `/readiness`, nacimiento canónico, CDS versionado, unicidades, salud de workers y DB segura para smoke. Ejecutar cuatro puntos por ruta afectada. |
| 2 | Endurecer regresión y esquema. | Migración de excepciones por módulos, límites de DTO/consultas, RLS por ambiente, semántica de idempotencia de pagos y reconciliación completa de entidades/DDL. |
| 3 | Completar cobertura. | Resto de módulos, 24 jobs, contratos OpenAPI/AsyncAPI, E2E por actor, dependencias y retiro de deuda operativa. |

Cada corrección debe ir en un cambio acotado con su prueba dirigida. Ningún informe autoriza modificar datos reales o habilitar una migración sin entorno desechable y plan de rollback.

## 8. Estado de README

| Documento | Estado |
|---|---|
| [`README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/README.md) | Reescrito: arquitectura, procesos, comandos, errores, observabilidad y operación. |
| [`src/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/README.md) | Reescrito: composición de API, módulos, ORM y workers. |
| [`src/modules/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/README.md) | Reescrito: índice de 70 módulos por dominio. |
| [`src/worker/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/worker/README.md) | Creado: mapa de 24 entrypoints, jobs, scripts y límites. |
| [`src/modules/clinical_ext/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/clinical_ext/README.md) | Reescrito contra los controladores, servicios y límites revisados. |
| [`src/modules/accounting/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/README.md) | Corregido: roles reales, evidencia de 16 suites/150 tests y límites de alcance, dinero y lotes. |
| [`src/modules/insurance/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/insurance/README.md) | Actualizado: enlace de revisión, límites identificados y resultado dirigido con un rojo reproducible. |
| [`src/modules/health_data/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_data/README.md) | Actualizado: enlace de revisión, límites de alcance y evidencia dirigida. |
| [`src/modules/consent/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/consent/README.md) | Actualizado: límites de alcance, fallback seed y evidencia dirigida. |
| [`src/modules/geo/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/geo/README.md), [`src/modules/public/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/public/README.md), [`src/modules/qa_execution/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/qa_execution/README.md), [`src/modules/audio_assets/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/audio_assets/README.md) | Creados o actualizados contra sus rutas reales, pruebas dirigidas y auditorías. |
| [`src/modules/organization_extensions/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/organization_extensions/README.md), [`src/modules/auth_providers/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/auth_providers/README.md), [`src/modules/content_packs/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/content_packs/README.md), [`src/modules/redis_runtime/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/redis_runtime/README.md) | Actualizados con alcance, evidencia dirigida y enlace a cada auditoría. |
| [`test/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/test/README.md), [`test/smoke/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/test/smoke/README.md) | Corregidos: alcance de suites y advertencia destructiva del smoke. |

Los README de las unidades no revisadas sólo describen su estado de base; no se los presenta como certificados por esta revisión.

## 9. Trabajo pendiente de integrar y evidencia

El plan original enumera cambios aún fuera de `origin/dev`: `fa74b78c` (reasons en 16 módulos), `2372d42a` (DTOs), `6a362e8e`/`b74203f3` (seeds) y `55339f05` (checkpoint auth/files). No se les atribuye ningún arreglo hasta comparar los commits contra esta rama.

Evidencia ejecutada durante esta tanda:

```text
corepack yarn install --immutable                                      → exit 0
corepack yarn typecheck                                                → exit 0
corepack yarn eslint src --no-cache                                   → exit 0
corepack yarn test --runInBand --silent src/worker                    → 33 suites, 173 tests passed; 1 suite/test skipped
corepack yarn test --runInBand --silent src/common/filters/...        → 2 suites, 32 tests passed
corepack yarn test src/modules/clinical_ext --runInBand --silent      → 15 suites, 88 tests passed
corepack yarn test src/modules/payments --runInBand --silent          → 7 suites, 104 tests passed
corepack yarn test src/modules/billing --runInBand --silent           → 16 suites, 94 tests passed
corepack yarn test src/modules/accounting --runInBand --silent        → 16 suites, 150 tests passed
corepack yarn test src/modules/insurance --runInBand --silent         → 37 suites, 626 tests passed; 1 test failed (matriz de roles desactualizada)
corepack yarn test src/modules/health_data --runInBand --silent       → 7 suites, 98 tests passed
corepack yarn test src/modules/consent --runInBand --silent           → 13 suites, 54 tests passed
corepack yarn test src/modules/delegated_access --runInBand --silent  → 10 suites, 47 tests passed
corepack yarn test src/modules/scheduling --runInBand --silent        → 30 suites, 621 tests passed
corepack yarn test src/modules/pharmacy_inventory --runInBand --silent → 7 suites, 117 tests passed
corepack yarn test src/modules/pharmacy --runInBand --silent           → 22 suites, 278 tests passed (2 advertencias de import JSON)
corepack yarn test src/modules/identity_assurance --runInBand --silent → 17 suites, 139 tests passed
corepack yarn test src/modules/diagnostics --runInBand --silent        → 20 suites, 146 tests passed (3 advertencias de import JSON)
corepack yarn test src/modules/terminology --runInBand --silent        → 26 suites, 302 tests passed
corepack yarn test src/modules/medical_groups --runInBand --silent     → exit 1, no se encontraron tests
corepack yarn test src/modules/quotations --runInBand --silent         → 4 suites, 53 tests passed
corepack yarn test src/modules/ops_console --runInBand --silent        → 2 suites, 17 tests passed
corepack yarn test src/modules/geo --runInBand --silent                → 8 suites, 43 tests passed
corepack yarn test src/modules/public --runInBand --silent             → 4 suites, 31 tests passed
corepack yarn test src/modules/qa_execution --runInBand --silent       → 3 suites, 58 tests passed
corepack yarn test src/modules/audio_assets --runInBand --silent       → 7 suites, 31 tests passed
corepack yarn test src/modules/organization_extensions --runInBand --silent → 8 suites, 34 tests passed
corepack yarn test src/modules/auth_providers --runInBand --silent     → 3 suites, 96 tests passed
corepack yarn test src/modules/content_packs --runInBand --silent      → 1 suite, 13 tests passed (advertencias JSON preexistentes)
corepack yarn test src/modules/redis_runtime --runInBand --silent      → 1 suite, 7 tests passed
corepack yarn test src/modules/search_platform --runInBand --silent    → 1 suite, 22 tests passed
corepack yarn test src/modules/document_store --runInBand --silent     → 1 suite, 12 tests passed
corepack yarn test src/modules/polyglot_storage --runInBand --silent   → 6 suites, 84 tests passed
corepack yarn test src/modules/tracking --runInBand --silent           → 2 suites, 57 tests passed
corepack yarn test src/modules/cross_store_consistency --runInBand --silent → 6 suites, 99 tests passed
corepack yarn test src/modules/object_storage --runInBand --silent          → 5 suites, 110 tests passed (2 advertencias JSON preexistentes)
corepack yarn test src/modules/clinical --runInBand --silent                → 51 suites, 518 tests passed (2 advertencias JSON preexistentes)
corepack yarn test src/modules/profiles --runInBand --silent                → 29 suites, 535 tests passed (3 advertencias JSON preexistentes)
corepack yarn test src/modules/community --runInBand --silent               → 41 suites, 616 tests passed (2 advertencias JSON preexistentes)
corepack yarn test src/modules/ads --runInBand --silent                     → 5 suites, 115 tests passed
corepack yarn test src/modules/pharma_lab --runInBand --silent              → 10 suites, 120 tests passed
corepack yarn test src/modules/procedures_perioperative --runInBand --silent → 6 suites, 149 tests passed (2 advertencias JSON preexistentes)
corepack yarn test src/modules/audit --runInBand --silent                    → 8 suites, 38 tests passed
corepack yarn test src/modules/automation --runInBand --silent               → 6 suites, 133 tests passed
corepack yarn test src/modules/chart --runInBand --silent                    → 18 suites, 139 tests passed (2 advertencias JSON preexistentes)
corepack yarn test src/modules/crm --runInBand --silent                      → 3 suites, 46 tests passed
corepack yarn test src/modules/directory --runInBand --silent                → 14 suites, 192 tests passed
corepack yarn test src/modules/data_catalog --runInBand --silent             → 4 suites, 48 tests passed
corepack yarn test src/modules/forms --runInBand --silent                    → 9 suites, 129 tests passed
corepack yarn test src/modules/iam --runInBand --silent                      → 22 suites, 359 tests passed (3 advertencias JSON preexistentes)
corepack yarn test --testPathPatterns=erp --runInBand --silent               → 3 suites, 50 tests passed
corepack yarn test src/modules/messaging --runInBand --silent                → 9 suites, 123 tests passed
corepack yarn test src/modules/practice --runInBand --silent                 → 11 suites, 106 tests passed
corepack yarn test src/modules/diagnostic_units --runInBand --silent        → 11 suites, 94 tests passed
corepack yarn test src/modules/system_ops --runInBand --silent               → 10 suites, 86 tests passed
corepack yarn test src/modules/graph_intelligence --runInBand --silent       → 4 suites, 87 tests passed
corepack yarn test src/modules/telemetry --runInBand --silent                → 14 suites, 121 tests passed
corepack yarn test src/modules/vector_rag --runInBand --silent                → 5 suites, 97 tests passed
corepack yarn test src/modules/marketing --runInBand --silent                 → 3 suites, 80 tests passed
corepack yarn test src/modules/read_models --runInBand --silent               → 6 suites, 40 tests passed
corepack yarn test src/modules/integration_contracts --runInBand --silent     → 6 suites, 48 tests passed
corepack yarn test src/modules/education --runInBand --silent                 → 3 suites, 84 tests passed
corepack yarn test src/modules/reporting --runInBand --silent                 → 3 suites, 68 tests passed
corepack yarn test src/modules/time_series --runInBand --silent               → 6 suites, 89 tests passed
corepack yarn test src/modules/lakehouse --runInBand --silent                 → 4 suites, 73 tests passed
corepack yarn test src/common --runInBand --silent                            → 72 suites, 712 tests passed (advertencias de import JSON)
corepack yarn test src/modules/workflow --runInBand --silent                  → 5 suites, 87 tests passed
corepack yarn test src/modules/surveys --runInBand --silent                   → 3 suites, 65 tests passed
corepack yarn test src/modules/platform_ops --runInBand --silent              → 5 suites, 146 tests passed
corepack yarn test src/modules/qa_lab --runInBand --silent                    → 5 suites, 99 tests passed
corepack yarn test src/modules/promotions --runInBand --silent                → 4 suites, 118 tests passed
corepack yarn test src/modules/integrations --runInBand --silent              → 7 suites, 53 tests passed
corepack yarn test src/modules/authz --runInBand --silent                     → 17 suites, 108 tests passed
corepack yarn test src/modules/health_context --runInBand --silent            → 3 suites, 81 tests passed
corepack yarn test src/modules/system_context --runInBand --silent            → 3 suites, 99 tests passed
corepack yarn test --runInBand --silent src/worker/jobs                        → 15 suites, 53 tests passed
docker compose config --quiet (local, Coolify y monitoring)           → exit 0
bash -n docker/db-init/init-postgres.sh infra/monitoring/scripts/configure-secrets.sh → exit 0
```

No se ejecutaron el smoke, la integración completa, migraciones, Compose en vivo ni pruebas contra datos reales. El smoke se dejó sin ejecutar porque su implementación actual puede truncar datos de negocio de la base configurada; ese es el hallazgo SP-01, no un bloqueo sin documentar.

El job de documentación del PR ejecutó la suite completa y conserva dos bloqueos heredados que esta rama no corrige: `modules/insurance/controllers/insurance-controllers.spec.ts` espera una matriz de roles anterior (20 pruebas pasan y una falla) y la cobertura global de ramas queda en 68,73 % frente al umbral de 69 %. La rama sólo modifica documentación y su tooling de sincronización; la corrección debe ir en un cambio de código y pruebas separado, sin relajar aserciones ni umbrales.
