# Revisión del módulo `delegated_access` — ALOVIDA

## 1. Alcance y evidencia

- Fecha: 2026-10-05. Unidad: `src/modules/delegated_access`; 44 archivos no spec, 10 specs.
- `corepack yarn test src/modules/delegated_access --runInBand --silent` → **10 suites y 47 tests pasan**. Son mocks: no prueban relaciones entre tenants, paciente, asignación y set.

## 2. Hallazgos confirmados

### DLG-01 — Crítica — se pueden componer delegaciones y grants de ámbitos distintos

**Evidencia.** Crear set persiste `dto.tenantId` sin contrastarlo con `requireTenantId()` que sí usa el listado ([permission-sets.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/permission-sets.service.ts#L96-L157), [controller](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts#L45-L72)). Crear delegación busca asignación organizacional y set por sólo ID, pero no comprueba su tenant mutuo ni la pertenencia del actor ([practitioner-delegates.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/practitioner-delegates.service.ts#L68-L158)). Emitir grant busca la delegación por ID y persiste paciente/encuentro del body sin verificar scope o relación ([#L161-L220](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/practitioner-delegates.service.ts#L161-L220)).

**Impacto y plan.** Un administrador T1 que conozca IDs T2 puede crear un set/delegación/grant cruzado y convertirlo en autorización clínica. Derivar tenant del contexto, filtrar cada lookup por tenant y verificar la cadena actor → membership → asignación → set → delegación → paciente/encuentro antes de escribir. Añadir constraints compuestas donde el modelo lo permita.

### DLG-02 — Alta — evaluación efectiva no vincula el actor evaluado con el delegado

**Evidencia.** `evaluate` recibe `actor` pero sólo lo usa en logs/eventos; busca la delegación desde `dto.practitionerDelegateAssignmentId` y devuelve permitido según grant, propósito y recurso ([delegated-access-evaluation.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/delegated-access-evaluation.service.ts#L127-L223)). No compara `actor.id` con el usuario de `delegateUserAssignmentId`, ni valida tenant o paciente. La ruta está limitada a `SECURITY_ADMIN` ([controller](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/controllers/delegated-access-authz.controller.ts#L37-L47)), pero el resultado es una decisión de autorización que otros callers podrían reutilizar erróneamente.

**Plan.** Hacer que la evaluación reciba el sujeto efectivo desde el contexto de confianza, comprobar que coincida con asignación/delegación y que pertenezca al tenant del recurso. Separar herramienta diagnóstica de decisión que habilita acceso.

### DLG-03 — Media — versiones de sets sin tope de ítems

**Evidencia.** Crear y publicar versión recorren todos los ítems, mientras sus DTOs sólo exigen `@ArrayMinSize(1)` ([permission-sets.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/permission-sets.service.ts#L134-L142), [#L185-L194](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/services/permission-sets.service.ts#L185-L194)).

**Plan.** Añadir máximo, deduplicar permisos y rechazar lote excesivo antes de abrir la transacción.

## 3. Pruebas y olas

| ID | Correcto | Límite | Error | Reason propuesto |
|---|---|---|---|---|
| DLG-01 | Cadena íntegra T1 crea grant. | Dos entidades T1 válidas. | Cualquier ID T2 no persiste. | `DELEGATED_ACCESS_SCOPE_DENIED`. |
| DLG-02 | Delegado real recibe decisión para su grant. | grant temporal vigente. | Actor distinto o paciente ajeno devuelve denegado. | `DELEGATED_ACCESS_ACTOR_MISMATCH`. |
| DLG-03 | máximo de permisos se publica. | duplicado se rechaza. | máximo+1 no escribe. | `DELEGATED_ACCESS_BATCH_TOO_LARGE`. |

Ola 0: DLG-01 y DLG-02 con pruebas de dos tenants y paciente. Ola 2: DLG-03. No se editaron fuentes ni datos.
