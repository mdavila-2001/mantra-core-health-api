import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import type { ResourceScopeFailure } from '../../../common/tenant/resource-scope';
import { AutomationErrorReason } from '../automation.error-reasons';
import type { AgentRuns, Agents } from '../entities';
import type {
  AgentsRepository,
  AutomationRunsRepository,
} from '../repositories';

/**
 * Cómo informa el módulo "no existe" para cada recurso con alcance de tenant.
 *
 * Un recurso de otro tenant responde con **exactamente** esto: el mismo mensaje
 * y el mismo `reason` que uno inexistente, sin `details`. Un mensaje o un
 * `reason` distintos le confirmarían a un tercero que el UUID existe en otra
 * organización.
 */
export const AUTOMATION_SCOPE_FAILURES = {
  workflow: {
    message: 'Workflow no encontrado.',
    reason: AutomationErrorReason.WORKFLOW_NOT_FOUND,
  },
  workflowRun: {
    message: 'Ejecución de workflow no encontrada.',
    reason: AutomationErrorReason.WORKFLOW_RUN_NOT_FOUND,
  },
  trigger: {
    message: 'Disparador no encontrado.',
    reason: AutomationErrorReason.TRIGGER_NOT_FOUND,
  },
  agent: {
    message: 'Agente no encontrado.',
    reason: AutomationErrorReason.AGENT_NOT_FOUND,
  },
  stepAgent: {
    message: 'Agente referenciado por un paso no encontrado.',
    reason: AutomationErrorReason.STEP_AGENT_NOT_FOUND,
  },
  agentRun: {
    message: 'Ejecución de agente no encontrada.',
    reason: AutomationErrorReason.AGENT_RUN_NOT_FOUND,
  },
  approval: {
    message: 'Aprobación no encontrada.',
    reason: AutomationErrorReason.APPROVAL_NOT_FOUND,
  },
  agentVersion: {
    message: 'La versión no existe para ese agente.',
    reason: AutomationErrorReason.AGENT_VERSION_NOT_FOUND_FOR_AGENT,
  },
  guardrailPolicy: {
    message: 'Política de guardrail no encontrada.',
    reason: AutomationErrorReason.GUARDRAIL_POLICY_NOT_FOUND,
  },
  recordAutomation: {
    message: 'Automatización de registro no encontrada.',
    reason: AutomationErrorReason.RECORD_AUTOMATION_NOT_FOUND,
  },
} as const satisfies Record<string, ResourceScopeFailure>;

/** Recurso del módulo que declara su tenant propietario. */
interface TenantOwned {
  readonly tenantId?: string | null;
}

/**
 * Acota un recurso cargado por UUID al tenant activo.
 *
 * Atajo de {@link assertResourceInTenant} para los recursos de `automation`
 * que llevan `tenantId`: el recurso inexistente y el ajeno salen iguales.
 *
 * @param resource - Recurso cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant del contexto de la petición.
 * @param failure - Respuesta de "no existe" del recurso.
 * @returns El mismo recurso, ya acotado al tenant.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function inTenantScope<T extends TenantOwned>(
  resource: T | null | undefined,
  activeTenantId: string,
  failure: ResourceScopeFailure,
): T {
  return assertResourceInTenant(
    resource,
    resource?.tenantId,
    activeTenantId,
    failure,
  );
}

/**
 * Carga un `agent_run` y exige que toda su cadena pertenezca al tenant activo.
 *
 * `agent_runs` no tiene `tenant_id` propio: su tenant es el del agente que
 * ejecuta y, si cuelga de un workflow run, el de ese run. Los dos tienen que
 * coincidir con el activo; si cualquiera es ajeno, el run entero se presenta
 * como inexistente.
 *
 * @param tx - Transacción activa.
 * @param runsRepo - Repositorio de runs.
 * @param agentsRepo - Repositorio de agentes.
 * @param agentRunId - UUID del run de agente recibido del cliente.
 * @param activeTenantId - Tenant del contexto de la petición.
 * @param failure - Respuesta de "no existe" con la que se presenta el run.
 * @returns El run y su agente, ya acotados.
 * @throws ResourceNotFoundException si algún eslabón no existe o es ajeno.
 */
export async function loadAgentRunInScope(
  tx: EntityManager,
  runsRepo: AutomationRunsRepository,
  agentsRepo: AgentsRepository,
  agentRunId: string,
  activeTenantId: string,
  failure: ResourceScopeFailure = AUTOMATION_SCOPE_FAILURES.agentRun,
): Promise<{
  /** Run de agente, ya bloqueado para escritura. */
  agentRun: AgentRuns;
  /** Agente que lo ejecuta, del tenant activo. */
  agent: Agents;
}> {
  const agentRun = await runsRepo.findAgentRunForUpdate(tx, agentRunId);
  if (!agentRun) {
    throw new ResourceNotFoundException(
      failure.message,
      undefined,
      failure.reason,
    );
  }
  const agent = inTenantScope(
    await agentsRepo.findAgentById(tx, agentRun.agentId),
    activeTenantId,
    failure,
  );
  if (agentRun.workflowRunId) {
    const workflowRun = await runsRepo.findWorkflowRunById(
      tx,
      agentRun.workflowRunId,
    );
    inTenantScope(workflowRun, activeTenantId, failure);
  }
  return { agentRun, agent };
}
