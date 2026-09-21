import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import {
  PRIMARY_SOURCE,
  impactOf,
  objectCoverage,
  type Direction,
  summarizeCoverage,
  type ObservationStatus,
  type ReviewStatus,
} from '../domain';
import { ListObjectsQueryDto } from '../dto';
import {
  CatalogAnnotations,
  CatalogChangeEvents,
  CatalogColumns,
  CatalogObjects,
  CatalogScanRuns,
} from '../entities';
import { CatalogQueryRepository } from '../repositories';
import {
  annotationView,
  columnView,
  scanView,
  toContent,
} from './catalog.views';

const DEFAULT_LIMIT = 50;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  limit: number;
}

const iso = (date: Date | null | undefined) =>
  date ? new Date(date).toISOString() : null;

/**
 * Lecturas del portal: inventario, ficha técnica + de negocio, columnas,
 * historial técnico, corridas y cobertura. No escribe nada.
 */
@Injectable()
export class CatalogQueryService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogQueryRepository,
  ) {}

  async listSchemas() {
    const rows = await this.repo.listSchemas(PRIMARY_SOURCE);
    return rows.map((row) => ({
      schemaName: row.schema_name,
      objects: row.objects,
      notObserved: row.not_observed,
      annotated: row.annotated,
      approved: row.approved,
    }));
  }

  async listObjects(
    query: ListObjectsQueryDto,
  ): Promise<Page<ReturnType<typeof summary>>> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    let after:
      { schemaName: string; objectName: string; id: string } | undefined;
    if (query.cursor) {
      const key = decodeKeysetCursor(query.cursor);
      after = {
        schemaName: String(key.s ?? ''),
        objectName: String(key.n ?? ''),
        id: String(key.i ?? ''),
      };
    }
    const rows = await this.repo.listObjects({
      sourceCode: PRIMARY_SOURCE,
      schema: query.schema,
      kind: query.kind,
      observationStatus: query.observationStatus,
      reviewStatus: query.reviewStatus,
      q: query.q?.trim() || undefined,
      missing: query.missing,
      after,
      limit,
    });
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map(summary),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({
              s: last.schema_name,
              n: last.object_name,
              i: last.id,
            })
          : null,
      limit,
    };
  }

  /** Ficha completa de un objeto: hechos técnicos, negocio, revisión, cobertura y gobierno. */
  async getObject(objectId: string) {
    const object = await this.em.findOne(CatalogObjects, { id: objectId });
    if (!object)
      throw new ResourceNotFoundException('Objeto de catálogo no encontrado', {
        objectId,
      });
    const [annotation, governance, evidenceCount, lastScan] = await Promise.all(
      [
        this.em.findOne(CatalogAnnotations, { objectId, targetKind: 'OBJECT' }),
        this.repo.findGovernance(object.schemaName, object.objectName),
        this.repo.evidenceCount(objectId, null),
        this.em.findOne(CatalogScanRuns, { id: object.lastSeenScanId }),
      ],
    );
    const governanceSensitivityKnown =
      governance !== null &&
      (governance.contains_pii !== null || governance.contains_phi !== null);
    const coverage = objectCoverage({
      observationStatus: object.observationStatus as ObservationStatus,
      columnCount: object.columnCount,
      annotation: annotation
        ? {
            content: toContent(annotation),
            reviewStatus: annotation.reviewStatus as ReviewStatus,
            currentRevisionNo: annotation.currentRevisionNo,
            approvedRevisionNo: annotation.approvedRevisionNo ?? null,
          }
        : null,
      registrySensitivityKnown: governanceSensitivityKnown,
    });

    return {
      id: object.id,
      technical: {
        sourceCode: object.sourceCode,
        schemaName: object.schemaName,
        objectName: object.objectName,
        objectKind: object.objectKind,
        comment: object.tableComment ?? null,
        columnCount: object.columnCount,
        primaryKey: (object.primaryKeyColumns as string[] | undefined) ?? [],
        statistics: {
          estimatedRows: object.estimatedRows ?? null,
          totalBytes: object.totalBytes ?? null,
          method: 'pg_class.reltuples / pg_total_relation_size',
          isEstimate: true,
          observedAt: iso(object.statsObservedAt),
        },
      },
      observation: {
        status: object.observationStatus,
        firstSeenScanId: object.firstSeenScanId,
        lastSeenScanId: object.lastSeenScanId,
        lastSeenAt: iso(object.lastSeenAt),
        notObservedSince: iso(object.notObservedSince),
        lastScanEngineVersion: lastScan?.engineVersion ?? null,
      },
      annotation: annotation ? annotationView(annotation) : null,
      coverage: {
        technical: coverage.technical ? 'COMPLETE' : 'INCOMPLETE',
        semantic: coverage.semantic,
        ownership: coverage.ownership ? 'COMPLETE' : 'MISSING',
        sensitivity: coverage.sensitivity ? 'KNOWN' : 'UNKNOWN',
        review: coverage.review ? 'APPROVED_CURRENT' : 'NOT_APPROVED',
        missingFields: coverage.missingFields,
      },
      /** Registro de gobierno (módulo 11), si la tabla está registrada. */
      governance: governance
        ? {
            entityRegistryId: governance.id,
            ownerTeam: governance.owner_team,
            containsPii: governance.contains_pii,
            containsPhi: governance.contains_phi,
            isAppendOnly: governance.is_append_only,
            isSoftDelete: governance.is_soft_delete,
            hasHistory: governance.has_history,
            retentionPolicyId: governance.retention_policy_id,
            writePolicyId: governance.write_policy_id,
          }
        : null,
      evidenceCount,
      provenance: {
        technicalSource: 'SCHEMA_INTROSPECTION',
        semanticSource: annotation?.origin ?? null,
      },
    };
  }

  async listColumns(objectId: string) {
    const object = await this.em.findOne(CatalogObjects, { id: objectId });
    if (!object)
      throw new ResourceNotFoundException('Objeto de catálogo no encontrado', {
        objectId,
      });
    const columns = await this.em.find(
      CatalogColumns,
      { objectId },
      { orderBy: { observationStatus: 'asc', ordinal: 'asc', id: 'asc' } },
    );
    const annotations = await this.em.find(CatalogAnnotations, {
      columnId: { $in: columns.map((column) => column.id) },
    });
    const byColumn = new Map(annotations.map((a) => [a.columnId!, a]));
    return {
      objectId,
      items: columns.map((column) =>
        columnView(column, byColumn.get(column.id)),
      ),
    };
  }

  /**
   * Impacto estructural de una tabla: qué depende de ella y de qué depende,
   * por FK observadas. El resultado declara su alcance y si se truncó.
   */
  async impact(objectId: string, direction: Direction = 'both', depth = 2) {
    const object = await this.em.findOne(CatalogObjects, { id: objectId });
    if (!object)
      throw new ResourceNotFoundException('Objeto de catálogo no encontrado', {
        objectId,
      });
    const edges = await this.repo.fkEdges(PRIMARY_SOURCE);
    const result = impactOf(
      objectId,
      edges.map((edge) => ({
        fromObjectId: edge.from_object_id,
        toObjectId: edge.to_object_id,
        constraintName: edge.constraint_name,
        fromColumns: edge.from_columns ?? [],
        toColumns: edge.to_columns ?? [],
      })),
      direction,
      depth,
    );
    const described = await this.repo.describeObjects(
      result.nodes.map((node) => node.objectId),
    );
    const byId = new Map(described.map((row) => [row.id, row]));
    return {
      ...result,
      nodes: result.nodes.map((node) => {
        const row = byId.get(node.objectId);
        return {
          ...node,
          schemaName: row?.schema_name ?? null,
          objectName: row?.object_name ?? null,
          objectKind: row?.object_kind ?? null,
          reviewStatus: row?.review_status ?? null,
          // Sin responsable declarado es deuda visible, no un hueco a rellenar.
          owner: row?.owner ?? null,
        };
      }),
    };
  }

  /** Historial técnico de un objeto, del cambio más reciente al más antiguo. */
  async listObjectChanges(
    objectId: string,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ) {
    const where: Record<string, unknown> = { objectId };
    if (cursor) {
      const key = decodeKeysetCursor(cursor);
      where.$or = [
        { createdAt: { $lt: new Date(String(key.t)) } },
        { createdAt: new Date(String(key.t)), id: { $lt: String(key.i) } },
      ];
    }
    const rows = await this.em.find(CatalogChangeEvents, where, {
      orderBy: { createdAt: 'desc', id: 'desc' },
      limit: limit + 1,
    });
    return this.changePage(rows, limit, (last) => ({
      t: last.createdAt.toISOString(),
      i: last.id,
    }));
  }

  async listScans(
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<Page<ReturnType<typeof scanView>>> {
    const where: Record<string, unknown> = { sourceCode: PRIMARY_SOURCE };
    if (cursor) {
      const key = decodeKeysetCursor(cursor);
      where.$or = [
        { requestedAt: { $lt: new Date(String(key.t)) } },
        { requestedAt: new Date(String(key.t)), id: { $lt: String(key.i) } },
      ];
    }
    const rows = await this.em.find(CatalogScanRuns, where, {
      orderBy: { requestedAt: 'desc', id: 'desc' },
      limit: limit + 1,
    });
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map(scanView),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({
              t: last.requestedAt.toISOString(),
              i: last.id,
            })
          : null,
      limit,
    };
  }

  async getScan(scanId: string) {
    const scan = await this.em.findOne(CatalogScanRuns, { id: scanId });
    if (!scan)
      throw new ResourceNotFoundException('Escaneo no encontrado', { scanId });
    return scanView(scan);
  }

  /** Diff de una corrida: los cambios que detectó, paginados. */
  async listScanChanges(
    scanId: string,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ) {
    await this.getScan(scanId);
    const where: Record<string, unknown> = { scanRunId: scanId };
    if (cursor) where.id = { $gt: String(decodeKeysetCursor(cursor).i) };
    const rows = await this.em.find(CatalogChangeEvents, where, {
      orderBy: { id: 'asc' },
      limit: limit + 1,
    });
    return this.changePage(rows, limit, (last) => ({ i: last.id }));
  }

  private async changePage(
    rows: CatalogChangeEvents[],
    limit: number,
    cursorOf: (last: CatalogChangeEvents) => Record<string, string>,
  ) {
    const page = rows.slice(0, limit);
    const objects = await this.em.find(CatalogObjects, {
      id: { $in: [...new Set(page.map((row) => row.objectId))] },
    });
    const columnIds = page
      .map((row) => row.columnId)
      .filter(Boolean) as string[];
    const columns = columnIds.length
      ? await this.em.find(CatalogColumns, { id: { $in: columnIds } })
      : [];
    const objectName = new Map(
      objects.map((o) => [o.id, `${o.schemaName}.${o.objectName}`]),
    );
    const columnName = new Map(columns.map((c) => [c.id, c.columnName]));
    const last = page[page.length - 1];
    return {
      items: page.map((row) => ({
        id: row.id,
        scanRunId: row.scanRunId,
        objectId: row.objectId,
        object: objectName.get(row.objectId) ?? null,
        columnId: row.columnId ?? null,
        column: row.columnId ? (columnName.get(row.columnId) ?? null) : null,
        changeKind: row.changeKind,
        before: row.beforeJson ?? null,
        after: row.afterJson ?? null,
        detectedAt: row.createdAt.toISOString(),
      })),
      nextCursor:
        rows.length > limit && last ? encodeKeysetCursor(cursorOf(last)) : null,
      limit,
    };
  }

  /**
   * Cobertura del alcance (todo, o un schema), sobre los objetos observados.
   * Sin un escaneo terminado la respuesta es UNKNOWN: el catálogo vacío no
   * significa que la base esté vacía.
   */
  async coverage(schema?: string) {
    const lastSucceeded = await this.em.findOne(
      CatalogScanRuns,
      { sourceCode: PRIMARY_SOURCE, status: 'SUCCEEDED' },
      { orderBy: { finishedAt: 'desc' } },
    );
    const objects = await this.em.find(CatalogObjects, {
      sourceCode: PRIMARY_SOURCE,
      observationStatus: 'OBSERVED',
      ...(schema ? { schemaName: schema } : {}),
    });
    const annotations = objects.length
      ? await this.em.find(CatalogAnnotations, {
          targetKind: 'OBJECT',
          objectId: { $in: objects.map((object) => object.id) },
        })
      : [];
    const byObject = new Map(annotations.map((a) => [a.objectId, a]));
    const registry = await this.repo.registrySensitivityKnown();

    const coverages = objects.map((object) => {
      const annotation = byObject.get(object.id);
      return objectCoverage({
        observationStatus: object.observationStatus as ObservationStatus,
        columnCount: object.columnCount,
        annotation: annotation
          ? {
              content: toContent(annotation),
              reviewStatus: annotation.reviewStatus as ReviewStatus,
              currentRevisionNo: annotation.currentRevisionNo,
              approvedRevisionNo: annotation.approvedRevisionNo ?? null,
            }
          : null,
        registrySensitivityKnown: registry.has(
          `${object.schemaName}.${object.objectName}`,
        ),
      });
    });
    return {
      scope: { sourceCode: PRIMARY_SOURCE, schema: schema ?? null },
      lastScan: lastSucceeded
        ? {
            scanId: lastSucceeded.id,
            finishedAt: iso(lastSucceeded.finishedAt),
            limitations:
              (lastSucceeded.limitations as unknown[] | undefined) ?? [],
          }
        : null,
      ...summarizeCoverage(coverages, lastSucceeded !== null),
    };
  }
}

function summary(row: import('../repositories').ObjectListRow) {
  return {
    id: row.id,
    schemaName: row.schema_name,
    objectName: row.object_name,
    objectKind: row.object_kind,
    observationStatus: row.observation_status,
    columnCount: Number(row.column_count),
    statistics: {
      estimatedRows: row.estimated_rows,
      totalBytes: row.total_bytes,
      isEstimate: true,
      observedAt: iso(row.stats_observed_at),
    },
    lastSeenAt: iso(row.last_seen_at),
    annotation: row.annotation_id
      ? {
          id: row.annotation_id,
          businessName: row.business_name,
          reviewStatus: row.review_status,
          hasPurpose: row.has_purpose,
          hasExistenceRationale: row.has_rationale,
          hasRowGrain: row.has_row_grain,
          owner: row.business_owner ?? row.data_steward ?? null,
          sensitivity: row.sensitivity,
        }
      : null,
  };
}
