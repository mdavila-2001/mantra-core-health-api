import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  assertOneOf,
  readCursorFields,
} from '../../../common/pagination/keyset-fields';
import { DEFAULT_PAGE_SIZE } from '../data_catalog.constants';
import { GovernanceQueueRepository } from '../infrastructure/repositories/governance-queue.repository';
import { JOB_TYPES } from '../presentation/dto/governance-queue.dto';
import type {
  JobsQueryDto,
  ReviewQueueQueryDto,
} from '../presentation/dto/governance-queue.dto';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const VENTANA_DIAS = 30;

/**
 * Agregadores de lectura del portal de gobierno: cola de revisión y trabajos. Cada fuente que aún
 * no existe se declara en `notMeasured` (no se inventan corridas ni cifras).
 */
@Injectable()
export class GovernanceQueueService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceQueueRepository,
  ) {}

  async reviewQueue(q: ReviewQueueQueryDto, now: Date = new Date()) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    let cursor: { t: string; i: string } | undefined;
    if (q.cursor) {
      cursor = readCursorFields(decodeKeysetCursor(q.cursor), {
        t: 'timestamp',
        i: 'uuid',
      });
    }
    const em = this.em.fork();
    const [filas, conteos] = await Promise.all([
      this.repo.reviewQueue(em, {
        kind: q.kind,
        schema: q.schema,
        cursor,
        limit,
      }),
      this.repo.reviewQueueCounts(em, { schema: q.schema }),
    ]);
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    const porClase: Record<string, number> = { OBJECT: 0, COLUMN: 0 };
    for (const c of conteos) porClase[c.kind] = c.total;
    return {
      summary: {
        total: porClase.OBJECT + porClase.COLUMN,
        bySource: {
          CATALOG_OBJECT: porClase.OBJECT,
          CATALOG_COLUMN: porClase.COLUMN,
        },
      },
      items: pagina.map((f) => ({
        source: f.kind === 'COLUMN' ? 'CATALOG_COLUMN' : 'CATALOG_OBJECT',
        annotationId: f.annotation_id,
        objectId: f.object_id,
        columnId: f.column_id,
        schemaName: f.schema_name,
        objectName: f.object_name,
        columnName: f.column_name,
        sensitivity: f.sensitivity,
        origin: f.origin,
        revisionNo: f.revision_no,
        submittedByUserId: f.submitted_by_user_id,
        waitingSince: f.updated_at,
        ageDays: Math.max(
          0,
          Math.floor(
            (now.getTime() - new Date(f.updated_at).getTime()) / MS_POR_DIA,
          ),
        ),
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({
              t: ultima.updated_at,
              i: ultima.annotation_id,
            })
          : null,
      limit,
      order: 'updated_at asc, id asc',
      notMeasured: [
        {
          field: 'glossaryTerms',
          reason:
            'No existe el glosario vivo con revisión (tablas de glosario aún no creadas por el modelo)',
        },
        {
          field: 'policyRevisions',
          reason:
            'No existen revisiones de política con aprobación (governance_policy_revisions aún no existe)',
        },
        {
          field: 'certifications',
          reason:
            'No existen certificaciones de datasets (catalog_certifications aún no existe)',
        },
      ],
    };
  }

  async jobs(q: JobsQueryDto, now: Date = new Date()) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const to = q.to ? new Date(q.to) : undefined;
    const from = q.from
      ? new Date(q.from)
      : new Date((to ?? now).getTime() - VENTANA_DIAS * MS_POR_DIA);
    if (to && to <= from)
      throw new BadRequestException('«to» debe ser posterior a «from»');
    let cursor: { t: string; ty: string; i: string } | undefined;
    if (q.cursor) {
      cursor = readCursorFields(decodeKeysetCursor(q.cursor), {
        t: 'timestamp',
        ty: 'text',
        i: 'uuid',
      });
      assertOneOf(cursor.ty, JOB_TYPES);
    }
    const filas = await this.repo.jobs(this.em.fork(), {
      type: q.type,
      status: q.status,
      from,
      to,
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        type: f.type,
        id: f.id,
        status: f.status,
        requestedByUserId: f.requested_by_user_id,
        requestedAt: f.requested_at,
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
        lease:
          f.lease_owner || f.lease_expires_at
            ? {
                owner: f.lease_owner,
                expiresAt: f.lease_expires_at,
                expired:
                  f.lease_expires_at !== null &&
                  f.status === 'RUNNING' &&
                  new Date(f.lease_expires_at) < now,
              }
            : null,
        counters: f.type === 'CLASSIFICATION' ? null : f.counters,
        errorCode: f.error_code,
        hasError: f.has_error,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({
              t: ultima.sort_at,
              ty: ultima.type,
              i: ultima.id,
            })
          : null,
      limit,
      window: { from: from.toISOString(), to: to ? to.toISOString() : null },
      order: 'requested_at desc, type desc, id desc',
      notMeasured: [
        {
          field: 'classificationRuns.detail',
          reason:
            'POST /admin/catalog/classification/run no persiste la corrida: sólo queda el sello de auditoría (quién, cuándo, éxito o fallo), sin contadores ni duración',
        },
        {
          field: 'qualityRuleRuns',
          reason:
            'No existe el motor de calidad de datos (quality_rule_runs aún no existe)',
        },
        {
          field: 'readModelRefreshRuns',
          reason:
            'Las corridas de refresco de read models no se leen desde este agregador todavía',
        },
        {
          field: 'reconciliationRuns',
          reason:
            'Las corridas de conciliación entre almacenes no se leen desde este agregador todavía',
        },
        {
          field: 'errorMessage',
          reason:
            'El mensaje de error puede citar valores de datos: sólo se expone el código y si hubo error',
        },
        {
          field: 'requestId',
          reason:
            'Ninguna de las fuentes guarda el identificador de la petición',
        },
      ],
    };
  }
}
