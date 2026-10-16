# Revisión del módulo `insurance` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/insurance` y `database/SQL/26_insurance`.
- Lectura: 118 archivos TypeScript no spec (24.406 líneas), 38 specs, controladores, DTO, servicios, repositorios y DDL de reclamos, coberturas, adjudicación, conciliación, autorizaciones previas, campañas y portabilidad.
- Evidencia dinámica: `corepack yarn test src/modules/insurance --runInBand --silent` dejó **37 suites y 626 tests pasando; 1 suite y 1 test fallando**. El fallo compara una lista de roles obsoleta: espera dos y el controlador declara seis. No se debilitó ni omitió.
- No cubierto: llamadas de aseguradora, entidades reales, PostgreSQL con RLS, objetos de almacenamiento, migraciones y todos los flujos de portabilidad/campañas. Los hallazgos conservados se refutaron contra los guards y la relación de tenant disponible.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | INS-01: la presentación legacy de reclamos no ata cobertura ni práctica al tenant/actor. |
| Alta | 2 | INS-02: conciliación acepta lote, reclamo, versión y aseguradora cruzados; INS-03: la lectura de reclamos amplió roles sin que el contrato ni la prueba lo reflejen. |
| Media | 2 | INS-04: conciliación calcula dinero con `Number`; INS-05: arrays de reclamos, adjudicaciones y autorización previa no tienen máximo. |

Las rutas vinculadas a una orden sí ejecutan `assertAdministrator`, verifican el tenant del prestador y relacionan cobertura/paciente/aseguradora ([linked-claim-access.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/linked-claim-access.service.ts#L46-L120)). Los hallazgos se limitan a caminos que omiten esas defensas.

## 3. Mapa de la unidad

| Superficie | Operaciones | Controles observados |
|---|---|---|
| Reclamos | enviar, adjudicar, EOB, reversa y disputa | camino de pedido vinculado con alcance; camino legacy con roles globales. |
| Conciliación | abrir lote y agregar ítem | `SECURITY_ADMIN`, sin chequeo de carrier/tenant en el servicio. |
| Coberturas y catálogos | carrier, plan, beneficios, preautorización | cadena tenant → carrier → producto → plan para varias rutas. |
| Portabilidad/campañas/liquidación | exportación, campañas y lotes de prestador | políticas específicas de perfil, carrier y membresía. |

`insurance_claims` no tiene `tenant_id`: enlaza carrier, cobertura y `billing_provider_entity_id` ([DDL](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/26_insurance/02_tables.sql#L354-L375)). Por ello la pertenencia debe comprobarse desde el servicio antes de usar identificadores como autorización.

## 4. Hallazgos confirmados

### INS-01 — Crítica — alta legacy de reclamos sin alcance de cobertura ni práctica

**Evidencia.** `submitClaim` toma el camino legacy si no llegan `inventoryReservationId` ni `serviceRequestId`; allí sólo aplica `assertLegacyClaimRoles` ([claims.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/claims.service.ts#L72-L82)), que acepta `BILLING`, `FINANCE` o `SUPERADMIN` sin tenant ([linked-claim-access.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/linked-claim-access.service.ts#L13-L20)). Después busca cobertura sólo por ID, contrasta plan contra carrier solicitado y persiste `dto.billingProviderEntityId` tal cual ([claims.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/claims.service.ts#L139-L180)). El DTO acepta esos tres UUID independientes ([claims.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/dto/claims.dto.ts#L97-L118)).

**Refutación intentada.** El camino de orden vinculada sí resuelve y autoriza al prestador, paciente y cobertura. La cobertura y el plan además deben existir en legacy. Ninguna de esas comprobaciones establece que cobertura, práctica facturadora y actor pertenezcan al mismo ámbito en el camino legacy; tampoco hay `tenant_id` que RLS pueda usar directamente en el reclamo. **Sostenido.**

**Impacto y plan.** Un actor de facturación puede registrar una solicitud con cobertura de otro paciente/tenant o atribuirla a una práctica ajena, contaminando conciliación y datos financieros/clinicos. Unificar ambos caminos tras una política `assertProviderClaimScope`: resolver tenant activo, práctica autorizada, paciente de cobertura, carrier y autorización previa; devolver una respuesta indistinguible para recurso ajeno y probar dos tenants con DB temporal.

### INS-02 — Alta — conciliación no relaciona lote, claim, versión y aseguradora

**Evidencia.** `createBatch` verifica sólo que exista el carrier y persiste `providerEntityId` entregado ([reconciliation.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/reconciliation.service.ts#L47-L81)). `addItem` obtiene batch, claim y versión sólo por ID y sólo contrasta que la versión sea del claim ([#L84-L135](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/reconciliation.service.ts#L84-L135)); los repositorios usan `findOne({ id })` ([settlement.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/repositories/settlement.repository.ts#L25-L30), [claim.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/repositories/claim.repository.ts#L29-L31)). No se compara carrier o prestador del lote con los del claim, ni actor con el carrier.

**Impacto y plan.** Un administrador puede crear un lote de carrier/proveedor A y añadir una versión de reclamo B. Validar antes de crear: carrier y prestador del batch deben coincidir con claim; versión actual y claim deben pertenecer al carrier del tenant autorizado. Añadir constraint o consulta compuesta donde sea posible, y ocultar recursos fuera de alcance.

### INS-03 — Alta — ampliación de roles contradice contrato y dejó una prueba roja

**Evidencia.** El comentario del controlador dice que `BILLING_OPERATOR` fue el rol elegido y que `SECURITY_ADMIN` conserva acceso ([claims-read.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/controllers/claims-read.controller.ts#L25-L38)); el decorador permite además `BILLING`, `FINANCE`, `INSURANCE_OPERATOR` y `USER` ([#L45-L54](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/controllers/claims-read.controller.ts#L45-L54)). `RolesGuard` autoriza cualquier rol listado ([roles.guard.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/auth/roles.guard.ts#L61-L86)). La prueba sigue esperando sólo los dos roles documentados y falla de forma reproducible ([insurance-controllers.spec.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/controllers/insurance-controllers.spec.ts#L256-L263)).

**Refutación intentada.** Las lecturas filtran las prácticas activas del tenant, lo que reduce acceso entre organizaciones. La ampliación sigue permitiendo a actores sin el rol de facturación elegido leer reclamos de su organización, potencialmente con identificadores clínicos y financieros. No existe una decisión documentada que justifique el cambio ni prueba de sus permisos. **Sostenido.**

**Plan.** Elegir explícitamente la matriz: restringir al par acordado o actualizar contrato, seed, UI y pruebas para cada rol adicional. Mantener prueba exacta de metadatos y pruebas HTTP por rol/tenant antes de cerrar el rojo.

### INS-04 — Media — conciliación monetaria por coma flotante

**Evidencia.** `addItem` convierte `expectedAmount` y `acceptedAmount` con `Number` y calcula `toFixed(2)` ([reconciliation.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/reconciliation.service.ts#L115-L129)). En la misma unidad existe un conversor exacto `toCents` con `bigint` para liquidación de reclamos ([received-claim-settlement.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/services/received-claim-settlement.ts#L11-L46)).

**Plan.** Reusar un helper decimal único, validar escala/rango y calcular varianza en centavos; rechazar formatos inválidos en vez de normalizarlos. Cubrir valores grandes, `0.10/0.20`, tercera decimal y negativos según contrato.

### INS-05 — Media — lotes de entrada sin máximo explícito

**Evidencia.** `CreateClaimDto.lines`, adjudicaciones y los arrays de autorización previa aplican `@ArrayMinSize(1)` sin `@ArrayMaxSize` ([claims.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/dto/claims.dto.ts#L167-L175), [#L350-L361](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/dto/claims.dto.ts#L350-L361), [prior-auth.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/dto/prior-auth.dto.ts#L105-L116)). Campañas sí fija 20, por lo que el patrón está disponible ([insurance-campaigns.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/insurance/dto/insurance-campaigns.dto.ts#L171-L173)).

**Plan.** Definir máximo por operación, rechazar antes de abrir transacción, deduplicar referencias y mover cargas masivas a proceso paginado.

## 5. Pruebas de cuatro puntos

| ID | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| INS-01 | Operador T1 presenta cobertura/práctica T1. | Dos prácticas T1 autorizadas. | UUID de cobertura o práctica T2; cero writes. | `403/FORBIDDEN/INSURANCE_CLAIM_SCOPE_DENIED`. |
| INS-02 | Carrier/lote/reclamo/versión del mismo par persisten. | reintento de ítem permitido según clave. | mezclar carrier o proveedor. | `404/RESOURCE_NOT_FOUND/INSURANCE_RECONCILIATION_RESOURCE_NOT_AVAILABLE`. |
| INS-03 | `BILLING_OPERATOR` autorizado en su tenant. | `SECURITY_ADMIN` autorizado. | Cada rol adicional se deniega o se documenta con justificación. | `403/FORBIDDEN/INSURANCE_CLAIMS_READ_FORBIDDEN`. |
| INS-04 | varianza exacta en centavos. | máximo permitido y escala de dos decimales. | decimal inválido/exceso de escala. | `400/VALIDATION_FAILED/INSURANCE_AMOUNT_INVALID`. |
| INS-05 | lote al máximo se procesa atómicamente. | duplicados se rechazan. | máximo+1 no inicia write. | `400/VALIDATION_FAILED/INSURANCE_BATCH_TOO_LARGE`. |

Las razones son propuestas; el catálogo actual no las ofrece de modo uniforme. Los escenarios de alcance requieren DB temporal con al menos dos tenants.

## 6. Matriz de superficie revisada

| Grupo | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Reclamo vinculado | orden, cobertura y prestador relacionados | replay con misma clave | origen/coverage ajena | política existente de denegación. |
| Reclamo legacy | práctica/cobertura del actor | misma cobertura con retry | recurso T2 o relación incongruente | `INSURANCE_CLAIM_SCOPE_DENIED`. |
| Conciliación | mismo carrier/prestador/claim | decimal máximo exacto | UUID mezclado o monto inválido | `INSURANCE_RECONCILIATION_RESOURCE_NOT_AVAILABLE`. |
| Lectura de reclamos | rol aprobado y tenant propio | administrador | rol no autorizado/tenant ajeno | `INSURANCE_CLAIMS_READ_FORBIDDEN`. |

## 7. Catálogo propuesto

| Reason | Estado/código | Uso |
|---|---|---|
| `INSURANCE_CLAIM_SCOPE_DENIED` | `403 / FORBIDDEN` | Actor, práctica, cobertura o carrier no forman un alcance válido. |
| `INSURANCE_RECONCILIATION_RESOURCE_NOT_AVAILABLE` | `404 / RESOURCE_NOT_FOUND` | Lote, claim o versión fuera del carrier/proveedor del actor. |
| `INSURANCE_CLAIMS_READ_FORBIDDEN` | `403 / FORBIDDEN` | Rol sin capacidad aprobada de ver reclamos del prestador. |
| `INSURANCE_AMOUNT_INVALID` | `400 / VALIDATION_FAILED` | Formato, escala o rango monetario inválido. |
| `INSURANCE_BATCH_TOO_LARGE` | `400 / VALIDATION_FAILED` | Array sobre el máximo de negocio. |

## 8. Olas de corrección

| Ola | Hallazgos | Esfuerzo | Dependencia/riesgo |
|---|---|---|---|
| 0 | INS-01, INS-02 | L | Política compartida de tenant/recurso, relaciones históricas y prueba en PostgreSQL. |
| 1 | INS-03, INS-04 | M | Decisión de matriz de roles; helper decimal y contrato de errores. |
| 2 | INS-05 | M | Límites funcionales y mecanismo de carga masiva. |

## 9. Trabajo pendiente de integrar y cierre

El único rojo dirigido se conserva como evidencia: no hay `skip`, cambio de expectativa ni afirmación de suite verde. No se editaron fuentes, SQL ni datos. Los 626 tests que pasan no prueban aislamiento cross-tenant ni constraints de conciliación.
