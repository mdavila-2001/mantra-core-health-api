import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  GOV_CHANGE_LOG_WINDOW_DAYS,
  GOV_DEFAULT_PAGE_SIZE,
  type ChangeLogQueryDto,
  type EntityRegistryQueryDto,
  type GovPageQueryDto,
  type PolicyListQueryDto,
  type PolicyType,
} from '../dto/governance-read.dto';
import {
  APPLIED_TO_LIMIT,
  GovernanceReadRepository,
} from '../repositories/governance-read.repository';

const CURSOR_INVALIDO = 'El cursor de paginación no es válido';
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const esTexto = (v: unknown): v is string => typeof v === 'string';

/**
 * Lecturas de gobierno de datos de `system_ops`: políticas, bitácora de cambios y registro de
 * entidades/campos. **Ninguna escribe**; los endpoints de escritura de gobierno siguen en
 * {@link GovernanceCatalogService} y compañía, cada uno con su `@Audited`.
 */
@Injectable()
export class GovernanceReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceReadRepository,
  ) {}

  private db(): EntityManager {
    return this.em.fork();
  }

  private limit(q: GovPageQueryDto): number {
    return q.limit ?? GOV_DEFAULT_PAGE_SIZE;
  }

  // ---- políticas -------------------------------------------------------------------------

  async policies(q: PolicyListQueryDto) {
    const limit = this.limit(q);
    const sort = q.sort ?? 'code';
    const order = q.order ?? 'asc';
    let cursor: { k: string; t: string; i: string } | undefined;
    if (q.cursor) {
      const k = decodeKeysetCursor(q.cursor);
      // El cursor lleva el orden con que se emitió: uno de otro orden saltaría filas en silencio.
      if (
        k.m !== `${sort}:${order}` ||
        !esTexto(k.k) ||
        !esTexto(k.t) ||
        !esTexto(k.i)
      )
        throw new BadRequestException(CURSOR_INVALIDO);
      cursor = { k: k.k, t: k.t, i: k.i };
    }
    const filas = await this.repo.policies(this.db(), {
      type: q.type,
      state: q.state,
      q: q.q,
      sort,
      order,
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        policyType: f.policy_type,
        id: f.id,
        code: f.code,
        name: f.name,
        state: f.state,
        version: f.row_version,
        updatedAt: f.updated_at,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({
              m: `${sort}:${order}`,
              k: sort === 'code' ? ultima.code : ultima.updated_at,
              t: ultima.policy_type,
              i: ultima.id,
            })
          : null,
      limit,
      sort,
      order,
    };
  }

  async policy(type: PolicyType, id: string) {
    const em = this.db();
    const fila = await this.repo.policyDetail(em, type, id);
    if (!fila) throw new ResourceNotFoundException('Política no encontrada');
    const aplicada = await this.repo.appliedTo(em, type, id);
    const total = aplicada[0]?.total ?? 0;
    return {
      policyType: fila.policy_type,
      id: fila.id,
      code: fila.code,
      name: fila.name,
      state: fila.state,
      version: fila.row_version,
      createdAt: fila.created_at,
      updatedAt: fila.updated_at,
      createdByUserId: fila.created_by_user_id,
      updatedByUserId: fila.updated_by_user_id,
      settings: fila.settings,
      appliedTo: {
        total,
        items: aplicada.map((a) => ({
          schemaName: a.schema_name,
          tableName: a.table_name,
          columnName: a.column_name,
        })),
        truncated: total > APPLIED_TO_LIMIT,
      },
    };
  }

  // ---- bitácora de cambios ----------------------------------------------------------------

  async changeLog(q: ChangeLogQueryDto, now: Date = new Date()) {
    const limit = this.limit(q);
    const from = q.from
      ? new Date(q.from)
      : new Date(now.getTime() - GOV_CHANGE_LOG_WINDOW_DAYS * MS_POR_DIA);
    const to = q.to ? new Date(q.to) : undefined;
    if (to && to <= from)
      throw new BadRequestException('«to» debe ser posterior a «from»');
    let cursor: { t: string; i: string } | undefined;
    if (q.cursor) {
      const k = decodeKeysetCursor(q.cursor);
      if (!esTexto(k.t) || !esTexto(k.i))
        throw new BadRequestException(CURSOR_INVALIDO);
      cursor = { t: k.t, i: k.i };
    }
    const filas = await this.repo.changeLog(this.db(), {
      from,
      to,
      targetType: q.targetType,
      targetId: q.targetId,
      changedBy: q.changedBy,
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        id: f.id,
        targetType: f.target_type,
        targetId: f.target_id,
        action: f.action ?? 'UNKNOWN',
        changedByUserId: f.changed_by_user_id,
        reason: f.reason,
        recordedAt: f.recorded_at,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({ t: ultima.recorded_at, i: ultima.id })
          : null,
      limit,
      order: 'recorded_at desc, id desc',
    };
  }

  // ---- registro de entidades y campos ------------------------------------------------------

  async entityRegistry(q: EntityRegistryQueryDto) {
    const limit = this.limit(q);
    let cursor: { s: string; t: string; i: string } | undefined;
    if (q.cursor) {
      const k = decodeKeysetCursor(q.cursor);
      if (!esTexto(k.s) || !esTexto(k.t) || !esTexto(k.i))
        throw new BadRequestException(CURSOR_INVALIDO);
      cursor = { s: k.s, t: k.t, i: k.i };
    }
    const filas = await this.repo.entityRegistry(this.db(), {
      schema: q.schema,
      q: q.q,
      domain: q.domain,
      classification: q.classification,
      containsPii: q.containsPii,
      containsPhi: q.containsPhi,
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    const sinFiltros =
      !q.schema &&
      !q.q &&
      !q.domain &&
      !q.classification &&
      q.containsPii === undefined &&
      q.containsPhi === undefined &&
      !q.cursor;
    return {
      items: pagina.map((f) => ({
        id: f.id,
        schemaName: f.schema_name,
        tableName: f.table_name,
        domain: f.domain_code
          ? { code: f.domain_code, name: f.domain_name }
          : null,
        classification: f.classification_code
          ? { code: f.classification_code, name: f.classification_name }
          : null,
        ownerTeam: f.owner_team,
        containsPii: f.contains_pii,
        containsPhi: f.contains_phi,
        isAppendOnly: f.is_append_only,
        isSoftDelete: f.is_soft_delete,
        hasHistory: f.has_history,
        retentionPolicyCode: f.retention_policy_code,
        writePolicyCode: f.write_policy_code,
        fieldCount: f.field_count,
        personalFieldCount: f.personal_field_count,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({
              s: ultima.schema_name,
              t: ultima.table_name,
              i: ultima.id,
            })
          : null,
      limit,
      order: 'schema_name, table_name, id',
      // Un registro vacío es un hecho, no un error: nadie ha declarado entidades todavía.
      notMeasured:
        sinFiltros && pagina.length === 0
          ? [
              {
                field: 'entityRegistry',
                reason:
                  'system_ops.entity_registry está vacío: ninguna entidad se declaró con POST /admin/governance/entity-registry',
              },
            ]
          : [],
    };
  }

  async fieldRegistry(entityId: string, q: GovPageQueryDto) {
    const limit = this.limit(q);
    let cursor: { c: string; i: string } | undefined;
    if (q.cursor) {
      const k = decodeKeysetCursor(q.cursor);
      if (!esTexto(k.c) || !esTexto(k.i))
        throw new BadRequestException(CURSOR_INVALIDO);
      cursor = { c: k.c, i: k.i };
    }
    const em = this.db();
    if (!(await this.repo.entityExists(em, entityId)))
      throw new ResourceNotFoundException('Entidad del registro no encontrada');
    const filas = await this.repo.fieldRegistry(em, entityId, {
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        id: f.id,
        columnName: f.column_name,
        classification: f.classification,
        isPii: f.is_pii,
        isPhi: f.is_phi,
        maskingStrategy: f.masking_strategy,
        anonymizationRuleCode: f.anonymization_rule_code,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({ c: ultima.column_name, i: ultima.id })
          : null,
      limit,
      order: 'column_name, id',
    };
  }
}
