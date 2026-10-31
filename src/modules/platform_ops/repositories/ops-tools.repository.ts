import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import {
  ComponentTools,
  HealthCheckRuns,
  HealthChecks,
  ServiceComponents,
  ToolRegistry,
} from '../entities';
import type { RunOutcome } from '../tools/tool-health';

/** Cuántas corridas recientes devuelve el detalle de una herramienta. */
export const TOOL_HISTORY_LIMIT = 20;

const RUN_OUTCOME_BY_CONCEPT: Readonly<Record<string, RunOutcome>> = {
  [CONCEPTS.HC_RUN_PASS]: 'PASS',
  [CONCEPTS.HC_RUN_WARN]: 'WARN',
  [CONCEPTS.HC_RUN_FAIL]: 'FAIL',
  [CONCEPTS.HC_RUN_TIMEOUT]: 'TIMEOUT',
  [CONCEPTS.HC_RUN_ERROR]: 'ERROR',
};

export interface ToolRunRecord {
  readonly outcome: RunOutcome;
  readonly recordedAt: Date;
  readonly latencyMs: number | null;
  readonly httpStatus: number | null;
}

/** Una herramienta con el componente, el chequeo y la última corrida que la miden. */
export interface ToolRecord {
  readonly code: string;
  readonly name: string;
  readonly toolTypeConceptId: string;
  readonly stateConceptId: string;
  readonly criticalityConceptId: string | null;
  readonly checkId: string | null;
  readonly checkTypeConceptId: string | null;
  readonly checkIntervalSeconds: number | null;
  readonly lastRun: ToolRunRecord | null;
}

/**
 * Lecturas del registro de herramientas. Solo SELECT. El registro de plataforma
 * vive en filas sin `tenant_id` (catálogo global), por eso se filtra por `null`.
 */
@Injectable()
export class OpsToolsRepository {
  constructor(private readonly em: EntityManager) {}

  /** Todas las herramientas del catálogo global, ordenadas por código. */
  async listTools(): Promise<ToolRecord[]> {
    return this.load({ tenantId: null });
  }

  /** Una herramienta por código, o `null` si no existe. */
  async findTool(code: string): Promise<ToolRecord | null> {
    const [record] = await this.load({ tenantId: null, code });
    return record ?? null;
  }

  /** Últimas corridas de un chequeo, de la más nueva a la más vieja. */
  async recentRuns(
    healthCheckId: string,
    limit = TOOL_HISTORY_LIMIT,
  ): Promise<ToolRunRecord[]> {
    const runs = await this.em
      .fork()
      .find(
        HealthCheckRuns,
        { healthCheckId },
        { orderBy: { recordedAt: 'desc' }, limit },
      );
    return runs.flatMap((run) => {
      const outcome = RUN_OUTCOME_BY_CONCEPT[run.statusConceptId];
      // Un estado de corrida desconocido no se interpreta como verde ni rojo.
      if (!outcome) return [];
      return [
        {
          outcome,
          recordedAt: run.recordedAt,
          latencyMs: run.latencyMs ?? null,
          httpStatus: run.httpStatus ?? null,
        },
      ];
    });
  }

  private async load(where: {
    tenantId: null;
    code?: string;
  }): Promise<ToolRecord[]> {
    const em = this.em.fork();
    const tools = await em.find(ToolRegistry, where, {
      orderBy: { code: 'asc' },
    });
    if (tools.length === 0) return [];

    const links = await em.find(ComponentTools, {
      toolId: { $in: tools.map((tool) => tool.id) },
    });
    const components = links.length
      ? await em.find(ServiceComponents, {
          id: { $in: links.map((link) => link.serviceComponentId) },
        })
      : [];
    const checks = components.length
      ? await em.find(
          HealthChecks,
          { serviceComponentId: { $in: components.map((c) => c.id) } },
          { orderBy: { code: 'asc' } },
        )
      : [];
    const lastRuns = await this.latestRuns(checks.map((check) => check.id));

    const componentById = new Map(components.map((c) => [c.id, c]));
    const componentIdByTool = new Map<string, string>();
    for (const link of links) {
      // Un componente «primario» gana sobre uno secundario.
      if (link.isPrimary || !componentIdByTool.has(link.toolId)) {
        componentIdByTool.set(link.toolId, link.serviceComponentId);
      }
    }
    const checkByComponent = new Map<string, HealthChecks>();
    for (const check of checks) {
      if (!checkByComponent.has(check.serviceComponentId)) {
        checkByComponent.set(check.serviceComponentId, check);
      }
    }

    return tools.map((tool) => {
      const componentId = componentIdByTool.get(tool.id);
      const component = componentId
        ? componentById.get(componentId)
        : undefined;
      const check = componentId ? checkByComponent.get(componentId) : undefined;
      return {
        code: tool.code,
        name: tool.name,
        toolTypeConceptId: tool.toolTypeConceptId,
        stateConceptId: tool.stateConceptId,
        criticalityConceptId: component?.criticalityConceptId ?? null,
        checkId: check?.id ?? null,
        checkTypeConceptId: check?.checkTypeConceptId ?? null,
        checkIntervalSeconds: check?.intervalSeconds ?? null,
        lastRun: check ? (lastRuns.get(check.id) ?? null) : null,
      };
    });
  }

  /** La corrida más reciente de cada chequeo (una consulta, `DISTINCT ON`). */
  private async latestRuns(
    checkIds: readonly string[],
  ): Promise<Map<string, ToolRunRecord>> {
    const result = new Map<string, ToolRunRecord>();
    if (checkIds.length === 0) return result;
    const rows = await this.em.getConnection().execute<
      {
        health_check_id: string;
        status_concept_id: string;
        recorded_at: Date;
        latency_ms: number | null;
        http_status: number | null;
      }[]
    >(
      `SELECT DISTINCT ON (health_check_id)
              health_check_id, status_concept_id, recorded_at, latency_ms, http_status
         FROM platform_ops.health_check_runs
        WHERE health_check_id IN (${checkIds.map(() => '?').join(', ')})
        ORDER BY health_check_id, recorded_at DESC`,
      [...checkIds],
      'all',
    );
    for (const row of rows) {
      const outcome = RUN_OUTCOME_BY_CONCEPT[row.status_concept_id];
      // Un estado de corrida desconocido no se interpreta como verde ni rojo.
      if (!outcome) continue;
      result.set(row.health_check_id, {
        outcome,
        recordedAt: new Date(row.recorded_at),
        latencyMs: row.latency_ms,
        httpStatus: row.http_status,
      });
    }
    return result;
  }
}
