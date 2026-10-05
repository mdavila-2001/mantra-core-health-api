# Revisión del módulo `identity_assurance` — ALOVIDA

## 1. Alcance y evidencia

- Fecha: 2026-10-05. Lectura de controladores, casos, evidencia, checks, autoridades, self-service, DTOs y repositorios.
- `corepack yarn test src/modules/identity_assurance --runInBand --silent` → **17 suites y 139 tests pasan**. Son unitarios con doubles; no prueban tenant, sujeto, archivos ni RLS reales.
- No cubierto: proveedores externos, worker de ciclo de vida y reglas de retención en un almacén vivo.

## 2. Hallazgos confirmados

### IDA-01 — Crítica — casos y evidencia de identidad se operan por UUID sin alcance de tenant o sujeto

**Evidencia.** Las rutas administrativas de casos, evidencia, checks, fraude, revisión y aserción sólo requieren `SECURITY_ADMIN` ([identity-cases.controller.ts](../../../src/modules/identity_assurance/controllers/identity-cases.controller.ts#L66-L178)); abrir un caso persiste `subjectTypeConceptId`, `subjectEntityId` y política recibidos sin resolver sujeto, tenant ni política aplicable ([identity-cases.service.ts](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L146-L193)). Todas las mutaciones posteriores llaman `loadCase`, que usa `findById({id})` ([identity-cases.service.ts](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L196-L282), [#L286-L445](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L286-L445), [#L500-L514](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L500-L514)); el repositorio confirma la consulta global ([identity-cases.repository.ts](../../../src/modules/identity_assurance/repositories/identity-cases.repository.ts#L50-L65)). En evidencia, `evidenceFileId`, autoridad y consentimiento se persisten sin comprobar que pertenezcan al caso/sujeto ([identity-cases.service.ts](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L221-L234)).

La cara self-service sí busca el caso y comprueba su sujeto contra la persona autenticada ([identity-self-service.service.ts](../../../src/modules/identity_assurance/services/identity-self-service.service.ts#L246-L274)); no protege las rutas administrativas.

**Impacto.** Un administrador de T1 que conozca UUIDs de T2 puede crear un caso para sujeto ajeno, añadir evidencia o fraude, alterar su estado y emitir/revocar decisiones de identidad. La evidencia enlaza archivos y consentimientos sensibles.

**Plan.** Asociar cada caso a tenant derivado y sujeto resuelto; crear `loadAuthorizedCase` que combine tenant, tipo, sujeto y permiso; usarlo en toda mutación y worker con identidad de sistema explícita. Resolver archivo, autoridad y consentimiento dentro de esa misma cadena. Ocultar ID ajeno como inexistente y migrar/auditar casos sin tenant.

| Caso | Preparación e input | Resultado esperado |
|---|---|---|
| Correcto | Integración, admin T1 y sujeto/caso/archivo T1. | Caso y evidencia válidos. |
| Límite | Self-service del titular T1. | Sólo consulta su propio caso. |
| Error | Admin T1 usa caso, sujeto o archivo T2. | Cero writes y ningún metadato expuesto. |
| Falla catalogada | E2E, UUID ajeno. | `404`, `RESOURCE_NOT_FOUND`, `IDENTITY_CASE_NOT_AVAILABLE`. |

### IDA-02 — Alta — autoridades y endpoints aceptan tenant e integración sin alcance

**Evidencia.** Registrar autoridad persiste `dto.tenantId` sin contexto ([identity-authorities.service.ts](../../../src/modules/identity_assurance/services/identity-authorities.service.ts#L45-L79)); agregar endpoint busca autoridad global y persiste `integrationEndpointId` sin validar pertenencia ([#L81-L118](../../../src/modules/identity_assurance/services/identity-authorities.service.ts#L81-L118)). Ambas rutas sólo requieren `SECURITY_ADMIN` ([identity-authorities.controller.ts](../../../src/modules/identity_assurance/controllers/identity-authorities.controller.ts#L23-L60)).

**Plan y pruebas.** Derivar tenant del contexto, cargar autoridad por tenant y verificar endpoint de integración dentro de la autoridad/tenant. Probar T1 correcto, endpoint válido en el borde, UUID T2 sin writes y `404/RESOURCE_NOT_FOUND/IDENTITY_AUTHORITY_NOT_AVAILABLE`.

### IDA-03 — Media — checks planificados no tienen máximo de lote

**Evidencia.** `PlanChecksDto.checks` exige `@ArrayMinSize(1)` sin máximo ([plan-checks.dto.ts](../../../src/modules/identity_assurance/dto/plan-checks.dto.ts#L45-L55)); el servicio crea todos los checks en memoria/transacción ([identity-cases.service.ts](../../../src/modules/identity_assurance/services/identity-cases.service.ts#L265-L281)).

**Plan y pruebas.** Añadir máximo y deduplicar tipo/autoridad antes de la transacción. Probar máximo válido, máximo+1 sin writes y `400/VALIDATION_FAILED/IDENTITY_CHECK_BATCH_TOO_LARGE`.

## 3. Olas

| Ola | Hallazgos | Esfuerzo |
|---|---|---:|
| 0 | IDA-01, IDA-02 | L |
| 2 | IDA-03 | S |

Ejecutar `corepack yarn test src/modules/identity_assurance --runInBand --silent` más integración con dos tenants, archivos y consentimiento después de cada cambio.
