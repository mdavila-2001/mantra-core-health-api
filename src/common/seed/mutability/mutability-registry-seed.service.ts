import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../constants/concepts';
import { createdBy } from '../../persistence/audit-fields';
import { ensureSeedActor, SEED_ACTOR_ID } from '../seed-actor';
import { CatalogConcepts } from '../../../modules/terminology/entities';
import {
  EntityRegistry,
  GovernanceChangeLog,
  SystemOpsRetentionPolicies,
  WritePolicies,
} from '../../../modules/system_ops/entities';
import { SYSOPS } from '../../../modules/system_ops/system_ops.concepts';
import catalogJson from '../../../modules/system_ops/mutability/data/mutability.catalog.json';
import type { MutabilityCatalog } from '../../../modules/system_ops/mutability/mutability.types';
import { tableKey } from '../../../modules/system_ops/mutability/mutability.types';
import {
  planMutabilitySeed,
  type PolicyModeName,
  type SeedExisting,
  type SeedPlan,
} from './mutability-registry.plan';

/** Resultado de una pasada. En la segunda corrida todo vale cero. */
export interface MutabilitySeedResult {
  writePolicies: number;
  retentionPolicies: number;
  entities: number;
  changeLog: number;
  unchanged: number;
  drift: number;
  /** Conceptos de `system_ops` que el catálogo de terminología todavía no tiene (no se siembra nada). */
  missingConcepts: string[];
}

/** Filas por vaciado: acota la memoria y deja una corrida interrumpida retomable (es idempotente). */
const CHUNK = 250;

const MODE_CONCEPT: Record<PolicyModeName, string> = {
  ALLOWED: SYSOPS.WRITE_MODE_ALLOWED,
  APPEND_ONLY: SYSOPS.WRITE_MODE_APPEND_ONLY,
  SOFT_DELETE: SYSOPS.WRITE_MODE_SOFT_DELETE,
  BLOCKED: SYSOPS.WRITE_MODE_BLOCKED,
};

/**
 * Registra en `system_ops` la mutabilidad de TODAS las tablas del modelo, desde el catálogo derivado
 * por el extractor (`mutability.catalog.json`). Ver `mutability-registry.plan.ts` para qué se
 * siembra y qué no (plazos de retención, bases legales y legal holds NO se inventan).
 *
 * ## Idempotencia
 *
 * Los ids son deterministas (UUIDv5 sobre `schema.tabla` o el código de la política) y la
 * comparación es por clave natural —(schema, tabla) y `code`—, no por id: una tabla registrada por
 * la API de gobierno con otro id se respeta y NO se duplica. Lo que ya existe no se modifica: si
 * difiere de lo derivado hoy, se cuenta como `drift` y se deja a un humano (el registro es del gobierno
 * de datos, no del arranque). No trunca nada.
 *
 * ## Procedencia
 *
 * Cada alta deja una fila en `governance_change_log` con la fuente (el catálogo y su modelo de
 * origen), el nivel de evidencia, las fuentes exactas y la clase de catálogo (`DERIVADO`).
 *
 * Corre **después** del catálogo de terminología (los conceptos `SO_*` deben existir). Si faltan, no
 * siembra nada y lo dice: una FK rota abortaría el arranque entero.
 */
@Injectable()
export class MutabilityRegistrySeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MutabilityRegistrySeedService.name);
  }

  async run(
    catalog: MutabilityCatalog = catalogJson as unknown as MutabilityCatalog,
  ): Promise<MutabilitySeedResult> {
    const em = this.orm.em.fork();
    const result: MutabilitySeedResult = {
      writePolicies: 0,
      retentionPolicies: 0,
      entities: 0,
      changeLog: 0,
      unchanged: 0,
      drift: 0,
      missingConcepts: [],
    };

    const needed = [
      CONCEPTS.STATE_ACTIVE,
      SYSOPS.DRAFT,
      SYSOPS.ACTION_CREATE,
      SYSOPS.DISPOSITION_DELETE,
      ...Object.values(MODE_CONCEPT),
    ];
    const present = new Set(
      (
        await em.find(
          CatalogConcepts,
          { id: { $in: needed } },
          {
            fields: ['id'] as never,
          },
        )
      ).map((c) => c.id),
    );
    result.missingConcepts = needed.filter((id) => !present.has(id));
    if (result.missingConcepts.length > 0) {
      this.logger.warn(
        {
          operation: 'seed.mutability-registry',
          missing: result.missingConcepts,
        },
        'Faltan conceptos de system_ops en el catálogo: no se registra la mutabilidad todavía',
      );
      return result;
    }

    await ensureSeedActor(em);
    const existing = await this.loadExisting(em);
    const plan = planMutabilitySeed(catalog.records, existing);
    result.unchanged = plan.unchanged;
    result.drift = plan.drift.length;
    for (const d of plan.drift)
      this.logger.warn(
        { operation: 'seed.mutability-registry', table: d.key },
        `Registro de mutabilidad distinto de lo derivado (no se modifica): ${d.reason}`,
      );

    await this.insertPolicies(em, plan, catalog, result);
    await this.insertEntities(em, plan, catalog, result);

    if (result.entities + result.writePolicies + result.retentionPolicies > 0)
      this.logger.info(
        { operation: 'seed.mutability-registry', ...result },
        'Mutabilidad de las tablas registrada en system_ops',
      );
    return result;
  }

  private async loadExisting(
    em: ReturnType<MikroORM['em']['fork']>,
  ): Promise<SeedExisting> {
    const entities = new Map<
      string,
      SeedExisting['entities'] extends Map<string, infer V> ? V : never
    >();
    for (const e of await em.find(EntityRegistry, {})) {
      const key = tableKey(e.schemaName, e.tableName);
      const prev = entities.get(key);
      entities.set(key, {
        id: prev?.id ?? e.id,
        count: (prev?.count ?? 0) + 1,
        isAppendOnly: e.isAppendOnly,
        isSoftDelete: e.isSoftDelete,
        hasWritePolicy: Boolean(e.writePolicyId),
        hasRetentionPolicy: Boolean(e.retentionPolicyId),
      });
    }
    const writePolicies = await em.find(WritePolicies, {
      code: { $like: 'MUT\\_%' },
    });
    const retentionPolicies = await em.find(SystemOpsRetentionPolicies, {
      code: { $like: 'MUT\\_RET\\_%' },
    });
    return {
      entities,
      writePolicyCodes: new Set(writePolicies.map((p) => p.code)),
      retentionPolicyCodes: new Set(retentionPolicies.map((p) => p.code)),
    };
  }

  private provenance(catalog: MutabilityCatalog, extra: object): object {
    return {
      catalogClass: 'DERIVADO',
      source: 'src/modules/system_ops/mutability/data/mutability.catalog.json',
      extractor: 'src/modules/system_ops/mutability/extractor',
      model: catalog.generatedFrom.modelRoot,
      modelVersion: catalog.generatedFrom.modelVersion,
      ...extra,
    };
  }

  private log(
    em: ReturnType<MikroORM['em']['fork']>,
    targetType: string,
    targetId: string,
    snapshot: object,
    reason: string,
  ): void {
    em.create(
      GovernanceChangeLog,
      {
        targetType,
        targetId,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: SEED_ACTOR_ID,
        newSnapshotJson: snapshot,
        reason,
        recordedAt: new Date(),
        recordedByUserId: SEED_ACTOR_ID,
      },
      { partial: true },
    );
  }

  private async insertPolicies(
    em: ReturnType<MikroORM['em']['fork']>,
    plan: SeedPlan,
    catalog: MutabilityCatalog,
    result: MutabilitySeedResult,
  ): Promise<void> {
    for (const p of plan.writePolicies) {
      em.create(
        WritePolicies,
        {
          id: p.id,
          code: p.code,
          name: p.name,
          insertModeConceptId: MODE_CONCEPT[p.insert],
          updateModeConceptId: MODE_CONCEPT[p.update],
          deleteModeConceptId: MODE_CONCEPT[p.delete],
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          ...createdBy(SEED_ACTOR_ID),
        },
        { partial: true },
      );
      this.log(
        em,
        'write_policies',
        p.id,
        this.provenance(catalog, { code: p.code, mode: p.mode }),
        'Siembra de mutabilidad derivada del modelo (no oficial, no revisada)',
      );
      result.writePolicies += 1;
      result.changeLog += 1;
    }
    for (const p of plan.retentionPolicies) {
      em.create(
        SystemOpsRetentionPolicies,
        {
          id: p.id,
          code: p.code,
          name: p.name,
          retentionPeriodDays: p.days ?? undefined,
          dispositionConceptId: SYSOPS.DISPOSITION_DELETE,
          // DRAFT a propósito: sin base legal ni confirmación de cumplimiento no puede ejecutarse.
          stateConceptId: SYSOPS.DRAFT,
          ...createdBy(SEED_ACTOR_ID),
        },
        { partial: true },
      );
      this.log(
        em,
        'retention_policies',
        p.id,
        this.provenance(catalog, {
          code: p.code,
          days: p.days,
          declaredBy: p.sources,
          status: 'PENDIENTE_DE_CUMPLIMIENTO',
          legalBasis: null,
          jurisdiction: null,
        }),
        'Plazo declarado por el modelo; base legal y confirmación de cumplimiento pendientes',
      );
      result.retentionPolicies += 1;
      result.changeLog += 1;
    }
    await em.flush();
  }

  private async insertEntities(
    em: ReturnType<MikroORM['em']['fork']>,
    plan: SeedPlan,
    catalog: MutabilityCatalog,
    result: MutabilitySeedResult,
  ): Promise<void> {
    const writeIds = new Map<string, string>();
    for (const p of await em.find(WritePolicies, {
      code: { $like: 'MUT\\_%' },
    }))
      writeIds.set(p.code, p.id);
    const retentionIds = new Map<string, string>();
    for (const p of await em.find(SystemOpsRetentionPolicies, {
      code: { $like: 'MUT\\_RET\\_%' },
    }))
      retentionIds.set(p.code, p.id);

    for (let i = 0; i < plan.entities.length; i += CHUNK) {
      for (const e of plan.entities.slice(i, i + CHUNK)) {
        em.create(
          EntityRegistry,
          {
            id: e.id,
            schemaName: e.schemaName,
            tableName: e.tableName,
            isAppendOnly: e.isAppendOnly,
            isSoftDelete: e.isSoftDelete,
            // Sin fuente que lo afirme: false, sin tabla de historia (no se deduce por nombre).
            hasHistory: false,
            writePolicyId: e.writePolicyCode
              ? writeIds.get(e.writePolicyCode)
              : undefined,
            retentionPolicyId: e.retentionPolicyCode
              ? retentionIds.get(e.retentionPolicyCode)
              : undefined,
            stateConceptId: CONCEPTS.STATE_ACTIVE,
            ...createdBy(SEED_ACTOR_ID),
          },
          { partial: true },
        );
        const r = e.record;
        this.log(
          em,
          'entity_registry',
          e.id,
          this.provenance(catalog, {
            table: `${r.schema}.${r.table}`,
            database: r.database,
            writeMode: r.writeMode,
            writeModeLevel: r.writeModeLevel,
            disposition: r.disposition,
            dispositionLevel: r.dispositionLevel,
            legalHold: r.legalHold,
            findings: r.findings.map((f) => `${f.kind}:${f.code}`),
            evidence: r.evidence
              .filter((x) => x.supports !== 'CONTEXT')
              .slice(0, 8)
              .map((x) => ({ kind: x.kind, level: x.level, source: x.source })),
          }),
          'Siembra de mutabilidad derivada del modelo (no oficial, no revisada)',
        );
        result.entities += 1;
        result.changeLog += 1;
      }
      await em.flush();
    }
  }
}
