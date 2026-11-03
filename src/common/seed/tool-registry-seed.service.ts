import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, deterministicId } from '../constants/concepts';
import {
  ComponentTools,
  HealthChecks,
  ServiceComponents,
  ToolRegistry,
} from '../../modules/platform_ops/entities';
import { PLATFORM_OPS } from '../../modules/platform_ops/platform_ops.concepts';
import {
  TOOL_CATALOG,
  provenanceText,
  type ToolCatalogEntry,
} from '../../modules/platform_ops/tools/tool-catalog';

/** Ventana de la sonda LIVE declarada: cadencia y tope de cada comprobación. */
const LIVE_INTERVAL_SECONDS = 60;
/** Mismo tope que `READINESS_TIMEOUT_MS` de `app-readiness.service.ts`. */
const LIVE_TIMEOUT_MS = 3000;

/** Sondas de `GET /readiness` que ya existen: el único `target_ref` LIVE verificado. */
const READINESS_PROBE_BY_CODE: Readonly<Record<string, string>> = {
  postgresql: 'readiness:postgresql',
  mongodb: 'readiness:mongodb',
  redis: 'readiness:redis',
  opensearch: 'readiness:opensearch',
};

const KIND_CONCEPT: Readonly<Record<ToolCatalogEntry['kind'], string>> = {
  DATABASE: PLATFORM_OPS.TOOL_KIND_DATABASE,
  CACHE: PLATFORM_OPS.TOOL_KIND_CACHE,
  SEARCH: PLATFORM_OPS.TOOL_KIND_SEARCH,
  STORAGE: PLATFORM_OPS.TOOL_KIND_STORAGE,
  MESSAGING: PLATFORM_OPS.TOOL_KIND_MESSAGING,
  PAYMENTS: PLATFORM_OPS.TOOL_KIND_PAYMENTS,
  AI: PLATFORM_OPS.TOOL_KIND_AI,
  MAPS: PLATFORM_OPS.TOOL_KIND_MAPS,
  ANALYTICS: PLATFORM_OPS.TOOL_KIND_ANALYTICS,
  SECURITY: PLATFORM_OPS.TOOL_KIND_SECURITY,
  OBSERVABILITY: PLATFORM_OPS.TOOL_KIND_OBSERVABILITY,
  OTHER: PLATFORM_OPS.TOOL_KIND_OTHER,
};

const STATE_CONCEPT: Readonly<Record<ToolCatalogEntry['status'], string>> = {
  ACTIVE: PLATFORM_OPS.TOOL_STATE_ACTIVE,
  PLANNED: PLATFORM_OPS.TOOL_STATE_PLANNED,
  DEPRECATED: PLATFORM_OPS.TOOL_STATE_DEPRECATED,
  DISABLED: PLATFORM_OPS.TOOL_STATE_DISABLED,
};

const CHECK_CONCEPT: Readonly<Record<ToolCatalogEntry['check'], string>> = {
  LIVE: PLATFORM_OPS.CHECK_LIVE,
  CONFIGURATION: PLATFORM_OPS.CHECK_CONFIGURATION,
  NOT_APPLICABLE: PLATFORM_OPS.CHECK_NOT_APPLICABLE,
};

const TARGET_CONCEPT: Readonly<Record<ToolCatalogEntry['check'], string>> = {
  LIVE: PLATFORM_OPS.TARGET_READINESS_PROBE,
  CONFIGURATION: PLATFORM_OPS.TARGET_ENV_VARS,
  NOT_APPLICABLE: PLATFORM_OPS.TARGET_NONE,
};

type SeedEm = ReturnType<MikroORM['em']['fork']>;

/** Ids estables de las cuatro filas que produce cada herramienta. */
export const toolSeedIds = (code: string) => ({
  tool: deterministicId(`seed:ops-tool:${code}:tool`),
  component: deterministicId(`seed:ops-tool:${code}:component`),
  link: deterministicId(`seed:ops-tool:${code}:link`),
  check: deterministicId(`seed:ops-tool:${code}:check`),
});

/**
 * Siembra el catálogo INTERNO de herramientas (`TOOL_CATALOG`) en
 * `platform_ops.tool_registry`, con su componente de servicio (criticidad y
 * procedencia), el vínculo `component_tools` y su `health_check`.
 *
 * - Idempotente: ids deterministas y búsqueda previa por `code`; la segunda
 *   corrida no inserta nada. Nunca trunca ni actualiza lo existente.
 * - No escribe corridas (`health_check_runs`): un estado medido lo escribe
 *   quien mide. Hasta entonces las herramientas LIVE quedan `NOT_PROBED`.
 * - Solo guarda NOMBRES de variables de entorno (en `target_ref`).
 * - Procedencia en `service_components.description` (el DDL no tiene columna
 *   específica en `tool_registry`).
 */
@Injectable()
export class ToolRegistrySeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ToolRegistrySeedService.name);
  }

  async run(): Promise<{
    tools: number;
    components: number;
    links: number;
    checks: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    const codes = TOOL_CATALOG.map((entry) => entry.code);

    const tools = new Map(
      (await em.find(ToolRegistry, { code: { $in: codes } })).map((t) => [
        t.code,
        t,
      ]),
    );
    const components = new Map(
      (await em.find(ServiceComponents, { code: { $in: codes } })).map((c) => [
        c.code,
        c,
      ]),
    );
    const checks = new Map(
      (await em.find(HealthChecks, { code: { $in: codes } })).map((c) => [
        c.code,
        c,
      ]),
    );

    let toolCount = 0;
    let componentCount = 0;
    for (const entry of TOOL_CATALOG) {
      const ids = toolSeedIds(entry.code);
      if (!tools.has(entry.code)) {
        this.createTool(em, ids.tool, entry, now);
        toolCount += 1;
      }
      if (!components.has(entry.code)) {
        this.createComponent(em, ids.component, entry, now);
        componentCount += 1;
      }
    }
    // Primero padres, después hijos: no hay relaciones declaradas en las
    // entidades, así que el orden de INSERT lo fija este flush por etapas.
    await em.flush();

    let linkCount = 0;
    for (const entry of TOOL_CATALOG) {
      const ids = toolSeedIds(entry.code);
      const toolId = tools.get(entry.code)?.id ?? ids.tool;
      const componentId = components.get(entry.code)?.id ?? ids.component;
      const existingLink = await em.findOne(ComponentTools, {
        serviceComponentId: componentId,
        toolId,
      });
      if (!existingLink) {
        this.createLink(em, ids.link, componentId, toolId, now);
        linkCount += 1;
      }
    }
    let checkCount = 0;
    for (const entry of TOOL_CATALOG) {
      if (checks.has(entry.code)) continue;
      const ids = toolSeedIds(entry.code);
      const componentId = components.get(entry.code)?.id ?? ids.component;
      this.createCheck(em, ids.check, componentId, entry, now);
      checkCount += 1;
    }
    await em.flush();

    const result = {
      tools: toolCount,
      components: componentCount,
      links: linkCount,
      checks: checkCount,
    };
    if (toolCount + componentCount + linkCount + checkCount > 0) {
      this.logger.info(result, 'Tool registry boot seed materialized');
    }
    return result;
  }

  private createTool(
    em: SeedEm,
    id: string,
    entry: ToolCatalogEntry,
    now: Date,
  ): void {
    em.create(
      ToolRegistry,
      {
        id,
        code: entry.code,
        name: entry.name,
        toolTypeConceptId: KIND_CONCEPT[entry.kind],
        vendor: entry.vendor,
        purpose: entry.purpose,
        stateConceptId: STATE_CONCEPT[entry.status],
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  private createComponent(
    em: SeedEm,
    id: string,
    entry: ToolCatalogEntry,
    now: Date,
  ): void {
    em.create(
      ServiceComponents,
      {
        id,
        code: entry.code,
        name: entry.name,
        componentTypeConceptId: PLATFORM_OPS.COMPONENT_EXTERNAL_DEPENDENCY,
        criticalityConceptId: entry.isCritical
          ? PLATFORM_OPS.CRITICALITY_CRITICAL
          : PLATFORM_OPS.CRITICALITY_NON_CRITICAL,
        description: provenanceText(entry),
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  private createLink(
    em: SeedEm,
    id: string,
    serviceComponentId: string,
    toolId: string,
    now: Date,
  ): void {
    em.create(
      ComponentTools,
      {
        id,
        serviceComponentId,
        toolId,
        usageConceptId: PLATFORM_OPS.USAGE_RUNTIME_DEPENDENCY,
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  private createCheck(
    em: SeedEm,
    id: string,
    serviceComponentId: string,
    entry: ToolCatalogEntry,
    now: Date,
  ): void {
    const live = entry.check === 'LIVE';
    em.create(
      HealthChecks,
      {
        id,
        serviceComponentId,
        code: entry.code,
        name: `Comprobación de ${entry.name}`,
        checkTypeConceptId: CHECK_CONCEPT[entry.check],
        targetKindConceptId: TARGET_CONCEPT[entry.check],
        // Solo nombres de variables o la clave de la sonda; nunca valores.
        targetRef:
          entry.check === 'CONFIGURATION'
            ? entry.requiredEnvVars.join(',')
            : live
              ? READINESS_PROBE_BY_CODE[entry.code]
              : undefined,
        intervalSeconds: live ? LIVE_INTERVAL_SECONDS : undefined,
        timeoutMs: live ? LIVE_TIMEOUT_MS : undefined,
        // Sin chequeo aplicable no se aceptan corridas (`recordHealthRun` rechaza deshabilitados).
        isEnabled: entry.check !== 'NOT_APPLICABLE',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }
}
