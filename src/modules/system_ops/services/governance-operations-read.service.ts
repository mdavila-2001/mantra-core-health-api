import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  readCursorFields,
  type CursorFieldKind,
} from '../../../common/pagination/keyset-fields';
import {
  GOV_DEFAULT_PAGE_SIZE,
  type DomainListQueryDto,
  type GovPageQueryDto,
  type LegalHoldListQueryDto,
  type RetentionExecutionListQueryDto,
} from '../dto/governance-read.dto';
import { GovernanceOperationsReadRepository } from '../repositories/governance-operations-read.repository';

/** Página genérica: corta la fila extra que delata que hay más y arma el cursor. */
function paginar<T>(
  filas: T[],
  limit: number,
  cursorDe: (ultima: T) => Record<string, string>,
): { pagina: T[]; nextCursor: string | null } {
  const hayMas = filas.length > limit;
  const pagina = hayMas ? filas.slice(0, limit) : filas;
  const ultima = pagina[pagina.length - 1];
  return {
    pagina,
    nextCursor: hayMas && ultima ? encodeKeysetCursor(cursorDe(ultima)) : null,
  };
}

/**
 * Lecturas de gobierno de `system_ops`: dominios, retenciones legales y ejecuciones de retención.
 * Ninguna escribe. Las que no tienen fuente lo declaran en `notMeasured` en vez de devolver ceros.
 */
@Injectable()
export class GovernanceOperationsReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceOperationsReadRepository,
  ) {}

  private db(): EntityManager {
    return this.em.fork();
  }

  private limit(q: GovPageQueryDto): number {
    return q.limit ?? GOV_DEFAULT_PAGE_SIZE;
  }

  private cursor<K extends string>(
    raw: string | undefined,
    spec: Readonly<Record<K, CursorFieldKind>>,
  ): Record<K, string> | undefined {
    return raw ? readCursorFields(decodeKeysetCursor(raw), spec) : undefined;
  }

  async domains(q: DomainListQueryDto) {
    const limit = this.limit(q);
    const filas = await this.repo.domains(this.db(), {
      q: q.q,
      cursor: this.cursor(q.cursor, { c: 'text', i: 'uuid' }),
      limit,
    });
    const { pagina, nextCursor } = paginar(filas, limit, (f) => ({
      c: f.code,
      i: f.id,
    }));
    return {
      items: pagina.map((f) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        description: f.description,
        ownerTeam: f.owner_team,
        entityCount: f.entity_count,
        version: f.row_version,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
      nextCursor,
      limit,
      order: 'code, id',
      notMeasured: [
        {
          field: 'stewards',
          reason:
            'system_ops.data_domains sólo guarda un equipo dueño (owner_team): los custodios por dominio no existen todavía',
        },
        ...(!q.q && !q.cursor && pagina.length === 0
          ? [
              {
                field: 'domains',
                reason:
                  'system_ops.data_domains está vacío: ningún dominio de datos se declaró',
              },
            ]
          : []),
      ],
    };
  }

  async legalHolds(q: LegalHoldListQueryDto) {
    const limit = this.limit(q);
    const filas = await this.repo.legalHolds(this.db(), {
      status: q.status,
      targetType: q.targetType,
      tenantId: q.tenantId,
      targetId: q.targetId,
      cursor: this.cursor(q.cursor, { t: 'timestamp', i: 'uuid' }),
      limit,
    });
    const { pagina, nextCursor } = paginar(filas, limit, (f) => ({
      t: f.updated_at,
      i: f.id,
    }));
    return {
      items: pagina.map((f) => ({
        id: f.id,
        tenantId: f.tenant_id,
        targetType: f.target_type,
        targetId: f.target_id,
        reason: f.reason,
        status: f.status,
        startsAt: f.starts_at,
        endsAt: f.ends_at,
        hasAuthorityReference: f.has_authority_reference,
        version: f.row_version,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
      nextCursor,
      limit,
      order: 'updated_at desc, id desc',
      notMeasured: [
        {
          field: 'authorityReference',
          reason:
            'La referencia de la autoridad es texto libre y puede citar un expediente: la lista sólo dice si existe',
        },
      ],
    };
  }

  async retentionExecutions(q: RetentionExecutionListQueryDto) {
    const limit = this.limit(q);
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    if (from && to && to <= from)
      throw new BadRequestException('«to» debe ser posterior a «from»');
    const filas = await this.repo.retentionExecutions(this.db(), {
      policyId: q.policyId,
      entityRegistryId: q.entityRegistryId,
      status: q.status ? `EXEC_${q.status}` : undefined,
      from,
      to,
      cursor: this.cursor(q.cursor, { t: 'timestamp', i: 'uuid' }),
      limit,
    });
    const { pagina, nextCursor } = paginar(filas, limit, (f) => ({
      t: f.recorded_at,
      i: f.id,
    }));
    return {
      items: pagina.map((f) => ({
        id: f.id,
        policy: { id: f.policy_id, code: f.policy_code },
        entity: f.entity_registry_id
          ? {
              id: f.entity_registry_id,
              schemaName: f.schema_name,
              tableName: f.table_name,
            }
          : null,
        status: f.status?.replace(/^EXEC_/, '') ?? null,
        startedAt: f.started_at,
        finishedAt: f.finished_at,
        durationMs:
          f.started_at && f.finished_at
            ? Math.max(
                0,
                new Date(f.finished_at).getTime() -
                  new Date(f.started_at).getTime(),
              )
            : null,
        totals: {
          scanned: f.total_scanned,
          deleted: f.total_deleted,
          anonymized: f.total_anonymized,
          archived: f.total_archived,
        },
        hasError: f.has_error,
        recordedAt: f.recorded_at,
      })),
      nextCursor,
      limit,
      order: 'recorded_at desc, id desc',
      notMeasured: [
        {
          field: 'errorText',
          reason:
            'El texto del error de una ejecución puede citar valores de datos: la lista sólo dice si hubo error',
        },
        {
          field: 'requestId',
          reason:
            'retention_executions no guarda el identificador de la petición',
        },
      ],
    };
  }
}
