import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { PlatformOpsErrorReason } from '../platform_ops.error-reasons';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import {
  OpsToolsRepository,
  type ToolRecord,
} from '../repositories/ops-tools.repository';
import {
  TOOL_CATALOG_BY_CODE,
  type ToolCheckType,
  type ToolKind,
  type ToolStatus,
} from '../tools/tool-catalog';
import { evaluateToolHealth, liveFreshnessMs } from '../tools/tool-health';
import type {
  ToolDetailResponseDto,
  ToolItemDto,
  ToolListResponseDto,
} from '../dto/ops-tools.dto';

/** Inversa de un mapa `nombre -> UUID` restringida a las claves con un prefijo. */
function invert<T extends string>(
  prefix: string,
  strip: string,
): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const [name, id] of Object.entries(PLATFORM_OPS)) {
    if (name.startsWith(prefix)) map.set(id, name.slice(strip.length) as T);
  }
  return map;
}

const KIND_BY_CONCEPT = invert<ToolKind>('TOOL_KIND_', 'TOOL_KIND_');
const STATUS_BY_CONCEPT = invert<ToolStatus>('TOOL_STATE_', 'TOOL_STATE_');
const CHECK_BY_CONCEPT = invert<ToolCheckType>('CHECK_', 'CHECK_');

/** Dependencias de entorno/reloj inyectables para que la evaluación sea determinista en pruebas. */
export interface ToolClock {
  now(): Date;
  env(): Readonly<Record<string, string | undefined>>;
}

const SYSTEM_CLOCK: ToolClock = {
  now: () => new Date(),
  env: () => process.env,
};

/**
 * Registro de herramientas con su salud (solo lectura).
 *
 * - El catálogo sale de `platform_ops.tool_registry` (+ componente y chequeo).
 * - `requiredEnvVars` sale de `TOOL_CATALOG` porque el DDL no tiene columna.
 * - La salud la decide `evaluateToolHealth`: nunca `OK` por defecto.
 */
@Injectable()
export class OpsToolsService {
  constructor(private readonly repo: OpsToolsRepository) {}

  /** `GET /admin/ops/tools`. */
  async list(clock: ToolClock = SYSTEM_CLOCK): Promise<ToolListResponseDto> {
    const now = clock.now();
    const records = await this.repo.listTools();
    const items: ToolItemDto[] = [];
    const notMeasured: ToolListResponseDto['notMeasured'] = [];
    for (const record of records) {
      const { item, notProbedReason } = this.toItem(record, clock);
      items.push(item);
      if (notProbedReason) {
        notMeasured.push({ code: item.code, reason: notProbedReason });
      }
    }
    return { evaluatedAt: now.toISOString(), items, notMeasured };
  }

  /** `GET /admin/ops/tools/:code`. */
  async get(
    code: string,
    clock: ToolClock = SYSTEM_CLOCK,
  ): Promise<ToolDetailResponseDto> {
    const record = await this.repo.findTool(code);
    if (!record) {
      throw new ResourceNotFoundException(
        'Herramienta no encontrada',
        { code },
        PlatformOpsErrorReason.TOOL_NOT_FOUND,
      );
    }
    const { item } = this.toItem(record, clock);
    const runs = record.checkId
      ? await this.repo.recentRuns(record.checkId)
      : [];
    return {
      ...item,
      evaluatedAt: clock.now().toISOString(),
      history: runs.map((run) => ({
        observedAt: run.recordedAt.toISOString(),
        outcome: run.outcome,
        latencyMs: run.latencyMs,
        httpStatus: run.httpStatus,
      })),
    };
  }

  private toItem(
    record: ToolRecord,
    clock: ToolClock,
  ): { item: ToolItemDto; notProbedReason: string | null } {
    const catalog = TOOL_CATALOG_BY_CODE.get(record.code);
    const status = STATUS_BY_CONCEPT.get(record.stateConceptId) ?? 'DISABLED';
    const requiredEnvVars = [...(catalog?.requiredEnvVars ?? [])];
    const checkType = record.checkTypeConceptId
      ? (CHECK_BY_CONCEPT.get(record.checkTypeConceptId) ?? null)
      : null;
    const { health, notProbedReason } = evaluateToolHealth({
      status,
      checkType,
      requiredEnvVars,
      lastRun: record.lastRun
        ? {
            outcome: record.lastRun.outcome,
            recordedAt: record.lastRun.recordedAt,
          }
        : null,
      freshnessMs: liveFreshnessMs(record.checkIntervalSeconds),
      env: clock.env(),
      now: clock.now(),
    });
    return {
      item: {
        code: record.code,
        name: record.name,
        kind: KIND_BY_CONCEPT.get(record.toolTypeConceptId) ?? 'OTHER',
        isCritical:
          record.criticalityConceptId === PLATFORM_OPS.CRITICALITY_CRITICAL,
        status,
        requiredEnvVars,
        health,
      },
      notProbedReason,
    };
  }
}
