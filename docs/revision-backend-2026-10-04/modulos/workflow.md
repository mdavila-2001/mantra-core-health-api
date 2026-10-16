# Revisión del módulo `workflow` — ALOVIDA

## Alcance y evidencia

Se revisaron definiciones de máquina, transiciones, instancias, tareas, compensación, reintentos y barrido de vencimientos. `corepack yarn test src/modules/workflow --runInBand --silent` aprobó **5 suites y 87 pruebas**.

## Hallazgo confirmado

### WF-02 — Alta — La transición registra propósito de uso pero no lo contrasta contra el propósito autorizado del actor

La definición permite persistir `purpose_of_use_concept_id` como requisito de transición, mientras la ejecución evalúa estado, guards declaradas, idempotencia y versionado. No hay una llamada a la política de `authz` que compare el propósito definido con un propósito declarado/autorizado para el actor antes de mover el agregado. El propio módulo documenta esta ausencia como pendiente. Así una transición clínica o sensible puede ejecutarse por un rol habilitado aunque su uso no tenga el propósito de tratamiento, pago, operación o investigación que la definición exige.

**Plan:** incluir propósito de uso en el contrato de comando, resolver la política de `authz` antes de bloquear/mutar y verificar actor, tenant, recurso y propósito; conservar el rechazo sin exponer las guardas. Añadir pruebas con propósito permitido, ausente y diferente.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Actor autorizado ejecuta transición con propósito permitido | transición, evento y outbox consistentes |
| Límite | Transición sin propósito configurado | conserva el flujo actual documentado |
| Error | Rol válido intenta propósito distinto al requerido | no cambia agregado ni crea evento |
| Falla catalogada | Propósito ausente o no autorizado | `403/FORBIDDEN/WORKFLOW_PURPOSE_NOT_ALLOWED` |

## Controles verificados

El módulo protege rutas con roles, usa `FOR UPDATE`/bloqueo optimista, idempotencia de eventos y `SKIP LOCKED` para vencimientos. Las pruebas no cubren la integración de propósito con `authz`.
