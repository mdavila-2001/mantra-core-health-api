# Revisión del módulo `system_ops` — ALOVIDA

## Alcance y evidencia

Se revisaron los ocho controladores, los siete servicios, repositorios, DTO, entidades y DDL de gobierno de datos, retención, residencia, legal holds, backup, assurance y drafts. La ejecución dirigida `corepack yarn test src/modules/system_ops --runInBand --silent` aprobó **10 suites y 86 pruebas**.

Todos los endpoints declaran `SECURITY_ADMIN`; la autenticación JWT procede del guard global. No se hallaron rutas públicas ni logs de contenido clínico en el módulo. No se ejercitó una base PostgreSQL real ni los consumidores externos de lifecycle; los hallazgos se basan en el flujo de aplicación y el DDL leído.

## Resumen

| Severidad | Cantidad | Lentes |
| --- | ---: | --- |
| Crítica | 0 | — |
| Alta | 2 | Dominio, contrato, datos, pruebas |
| Media | 1 | Dominio, datos, pruebas |
| Baja | 0 | — |

## Mapa revisado

- **Gobierno:** catálogo, políticas de escritura/retención, anonimización y legal holds bajo `/admin/governance`.
- **Operación interna:** `POST /internal/governance/retention-executions/run` y `POST /internal/ops/restore-test-runs`, también sujetos a `SECURITY_ADMIN`.
- **Entidades sensibles:** `retention_executions`, `record_revisions`, `tenant_residency_bindings`, `workload_assessments`, `assessment_control_results`, `assessment_findings`, `remediation_plans` y `remediation_actions`.
- **Errores:** usa excepciones de dominio genéricas compartidas; no existe un catálogo de `reason` propio del módulo.

## Hallazgos confirmados

### SYSOPS-01 — Alta — El barrido de retención genérico informa éxito sin examinar ni disponer registros

El DTO anuncia un lote (`maxBatchSize`) y la respuesta expone totales de escaneo, borrado, anonimización y archivado ([`retention-execution.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/dto/retention-execution.dto.ts#L19-L80)). Fuera del caso especial de `identity_assurance.identity_evidence_records`, el servicio sólo crea una revisión cuyo `recordId` es el identificador del *registro de catálogo* de la entidad, no de una fila del recurso objetivo ([`retention-execution.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/retention-execution.service.ts#L145-L160)). Después marca la ejecución como `SUCCEEDED` y devuelve todos los contadores en cero ([`retention-execution.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/retention-execution.service.ts#L162-L169)). El repositorio tampoco ofrece consulta paginada de filas candidatas ni una operación de disposición; sólo crea la ejecución, la revisión y cuenta holds ([`retention-execution.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/repositories/retention-execution.repository.ts#L20-L108)).

Una política `DELETE`, `ANONYMIZE` o `ARCHIVE` para cualquier entidad no especial obtiene un 200 exitoso, pero ningún registro de negocio es seleccionado, comprobado contra holds o transformado. Esto permite reportar cumplimiento de retención cuando no ocurrió la disposición y puede conservar datos más allá de la política.

**Plan de corrección:**

1. Definir un adaptador de disposición por entidad registrada, capaz de seleccionar filas vencidas de forma paginada y con una transacción por lote.
2. Para cada fila, resolver el legal hold por el objetivo real, aplicar la disposición correspondiente y generar una revisión con el `recordId` afectado.
3. Actualizar contadores y estado sólo al finalizar cada lote; si no hay executor registrado, rechazar la solicitud con un `reason` estable, sin crear una ejecución exitosa.
4. Conservar el camino especializado de identidad como adaptador explícito y alinear el contrato del endpoint con su resultado real.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Política `DELETE` y tres filas vencidas en un executor soportado | tres filas dispuestas, tres revisiones y `totalDeleted: 3` |
| Límite | Cinco filas con `maxBatchSize: 2` | procesa sólo dos, deja cursor o estado parcial explícito y conserva las otras tres |
| Error | Una fila vencida protegida por legal hold y otra libre | la protegida permanece, la libre se dispone y los totales separan ambas decisiones |
| Falla catalogada | Entidad sin executor de retención | `409/PRECONDITION_FAILED/SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED`, sin `SUCCEEDED` engañoso |

### SYSOPS-02 — Media — Las asociaciones de assurance aceptan controles y hallazgos de otra evaluación

`putControlResults` comprueba que la evaluación exista, pero nunca carga ni contrasta que `operationalFrameworkControlId` pertenezca al framework de esa evaluación; crea el vínculo con cualquier UUID de control existente ([`assessment.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/assessment.service.ts#L194-L234)). `createFinding` repite el patrón para `assessmentControlResultId`, y `createRemediationPlan` obtiene el finding sólo por ID antes de usarlo en cada acción del plan ([`assessment.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/assessment.service.ts#L238-L330)). El DDL sólo impone FKs independientes para assessment/control y assessment/finding; no expresa que pertenecen a la misma evaluación ([`03_fk_intra.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/11_system_ops/03_fk_intra.sql#L96-L116)).

Un administrador puede asociar el control de un framework o el hallazgo de otro tenant/evaluación. El cierre automático posterior cuenta acciones por `assessmentFindingId`, por lo que una remediación puede alterar el estado de un hallazgo ajeno a la evaluación desde la que se creó el plan. El resultado es evidencia de cumplimiento y remediación inconsistente.

**Plan de corrección:**

1. Agregar consultas de repositorio que busquen control-result, control y finding junto con su `workloadAssessmentId` y framework.
2. Antes de crear o actualizar, exigir que cada control pertenezca al framework de la evaluación y que cada resultado/finding pertenezca al `assessmentId` de la ruta.
3. Rechazar asociaciones cruzadas con reasons específicos; revisar si una FK compuesta o una columna redundante puede reforzar las invariantes en DDL.
4. Cubrir tanto la creación como el UPSERT y el cierre derivado de acciones.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Control del framework de la evaluación y finding de la misma evaluación | crea resultado, finding y plan vinculados al mismo `assessmentId` |
| Límite | Repetir el mismo control en el UPSERT de la misma evaluación | actualiza una sola fila por la clave única existente |
| Error | Control perteneciente a otro framework o finding de otra evaluación | no persiste vínculo ni acción |
| Falla catalogada | ID existente pero fuera de la evaluación | `409/PRECONDITION_FAILED/SYSOPS_ASSESSMENT_RELATION_MISMATCH` |

### SYSOPS-03 — Alta — La política creada por este módulo no puede vincularse por la FK de residencia

`createResidencyPolicy` crea una `data_residency_policies` propia del módulo ([`residency.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/residency.service.ts#L44-L81)), pero el DTO del binding declara que espera una política de `polyglot_storage` ([`residency.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/dto/residency.dto.ts#L105-L123)). El servicio inserta el UUID recibido sin cargar ni comprobar su estado ([`residency.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_ops/services/residency.service.ts#L84-L103)); la FK de la tabla apunta efectivamente a `polyglot_storage.residency_policies`, no a la política que acaba de crear system_ops ([`90_fk_deferred.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/11_system_ops/90_fk_deferred.sql#L338-L350)).

El flujo público de crear política en system_ops y luego vincularla falla por FK: el UUID existe, pero en otra tabla. Un UUID inexistente también llega al driver como error no catalogado. Por tanto la configuración efectiva de residencia del tenant está rota y la API puede responder 500 en una operación administrativa común.

**Plan de corrección:**

1. Decidir una fuente única para la política: corregir la FK/entidad para `system_ops.data_residency_policies` o dejar de crear la política duplicada en este módulo y usar explícitamente la de `polyglot_storage`.
2. Cargar dentro de la misma transacción la política elegida, tenant y conceptos/regiones requeridos.
3. Validar `STATE_ACTIVE`, vigencia y compatibilidad entre política, región primaria y DR antes de insertar.
4. Convertir ausencias y combinaciones inválidas a excepciones de dominio con reasons estables; añadir una prueba de integración que asegure que ningún error de FK cruza el filtro HTTP.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Tenant existente y política recién creada por el endpoint de system_ops | `201` y binding activo persistido contra la misma fuente de política |
| Límite | Binding sin región de DR, si la política lo permite | `201` con región DR nula y vigencia correcta |
| Error | Política revocada, vencida o región fuera de su conjunto permitido | no inserta binding |
| Falla catalogada | UUID válido de política o tenant inexistente | `404/RESOURCE_NOT_FOUND/SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND` |

## Controles verificados

- Todos los controladores revisados declaran `@Roles('SECURITY_ADMIN')`; no hay `@Public` en el módulo.
- Legal hold y publicación de draft comprueban estado y propiedad antes de cambiar sus registros.
- Las entidades con transiciones de edición, incluido `draft_records`, usan `row_version`; el DDL añade índices y FKs para las relaciones directas.
- La suite sí cubre las delegaciones de controlador, rutas de precondición y el caso de hold; no prueba el trabajo real de retención ni relaciones cruzadas de assurance.

## Cobertura pendiente

No se ejecutó PostgreSQL ni smoke HTTP autenticado. Faltan pruebas de concurrencia para `publishDraft`, errores de FK transformados por el filtro global, vigencia de residencia y ejecución real de retención por más de una entidad.
