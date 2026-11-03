import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { ResourceNotFoundException } from '../../../common/errors/domain.exception';
import {
  IMPACT_DEFAULT_DEPTH,
  IMPACT_MAX_NODES,
  IMPACT_SCOPE,
  SOURCE_CODE,
} from '../domain/catalog/catalog.constants';
import {
  coverageOfObject,
  summarizeCoverage,
  type CoverageAnnotation,
} from '../domain/catalog/coverage';
import { iso, isoOrNull } from '../domain/catalog/timestamps';
import { DEFAULT_PAGE_SIZE } from '../data_catalog.constants';
import type {
  CatalogObjectsQueryDto,
  CoverageQueryDto,
  CursorQueryDto,
  ImpactQueryDto,
} from '../presentation/dto/catalog-request.dto';
import {
  CatalogRepository,
  type AnnotationRow,
  type ColumnRow,
  type ObjectRow,
  type ScanRow,
} from '../infrastructure/repositories/catalog.repository';

/** La ficha tal como la usa la cobertura. */
export function paraCobertura(a: AnnotationRow): CoverageAnnotation {
  return {
    purpose: a.content.purpose,
    existenceRationale: a.content.existenceRationale,
    rowGrain: a.content.rowGrain,
    businessOwner: a.content.businessOwner,
    dataSteward: a.content.dataSteward,
    sensitivity: a.content.sensitivity,
    openQuestions: a.content.openQuestions,
    reviewStatus: a.review_status,
    currentRevisionNo: a.current_revision_no,
    approvedRevisionNo: a.approved_revision_no,
  };
}

const lleno = (v: string | null | undefined): boolean =>
  typeof v === 'string' && v.trim().length > 0;

export function presentarFicha(a: AnnotationRow | null | undefined) {
  if (!a) return null;
  return {
    id: a.id,
    targetKind: a.target_kind,
    version: a.row_version,
    reviewStatus: a.review_status,
    origin: a.origin,
    currentRevisionNo: a.current_revision_no,
    approvedRevisionNo: a.approved_revision_no,
    approvedAt: isoOrNull(a.approved_at),
    approvalIsCurrent:
      a.review_status === 'APPROVED' &&
      a.approved_revision_no === a.current_revision_no,
    content: a.content,
    updatedAt: iso(a.updated_at),
  };
}

function presentarEstadisticas(o: ObjectRow) {
  return {
    estimatedRows: o.estimated_rows,
    totalBytes: o.total_bytes,
    isEstimate: true,
    observedAt: isoOrNull(o.stats_observed_at),
  };
}

/** Lecturas del catálogo vivo (`data_catalog.*`). Ninguna escribe. */
@Injectable()
export class CatalogReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
  ) {}

  private db(): EntityManager {
    return this.em.fork();
  }

  async schemas() {
    const filas = await this.repo.schemas(this.db());
    return filas.map((f) => ({
      schemaName: f.schema_name,
      objects: f.objects,
      notObserved: f.not_observed,
      annotated: f.annotated,
      approved: f.approved,
    }));
  }

  async objects(q: CatalogObjectsQueryDto) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const cursor = q.cursor ? decodeKeysetCursor(q.cursor) : null;
    if (
      cursor &&
      (typeof cursor.s !== 'string' || typeof cursor.o !== 'string')
    )
      throw new BadRequestException('El cursor de paginación no es válido');
    const em = this.db();
    const filas = await this.repo.objects(em, {
      schema: q.schema,
      kind: q.kind,
      observationStatus: q.observationStatus,
      reviewStatus: q.reviewStatus,
      q: q.q,
      missing: q.missing,
      cursor: cursor
        ? { s: cursor.s as string, o: cursor.o as string }
        : undefined,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const fichas = await this.repo.annotationsOf(
      em,
      pagina.map((o) => o.id),
    );
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((o) => {
        const a = fichas.get(o.id);
        return {
          id: o.id,
          schemaName: o.schema_name,
          objectName: o.object_name,
          objectKind: o.object_kind,
          observationStatus: o.observation_status,
          columnCount: o.column_count,
          statistics: presentarEstadisticas(o),
          lastSeenAt: iso(o.last_seen_at),
          annotation: a
            ? {
                id: a.id,
                businessName: a.content.businessName,
                reviewStatus: a.review_status,
                hasPurpose: lleno(a.content.purpose),
                hasExistenceRationale: lleno(a.content.existenceRationale),
                hasRowGrain: lleno(a.content.rowGrain),
                owner: a.content.businessOwner ?? a.content.dataSteward,
                sensitivity: a.content.sensitivity,
              }
            : null,
        };
      }),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({ s: ultimo.schema_name, o: ultimo.object_name })
          : null,
      limit,
    };
  }

  /** El objeto o 404. */
  private async objeto(em: EntityManager, id: string): Promise<ObjectRow> {
    const o = await this.repo.objectById(em, id);
    if (!o)
      throw new ResourceNotFoundException('Objeto del catálogo no encontrado');
    return o;
  }

  async objectDetail(id: string) {
    const em = this.db();
    const o = await this.objeto(em, id);
    const [ficha, gobierno, evidencias] = await Promise.all([
      this.repo.annotationOfObject(em, id),
      this.repo.governance(em, o.schema_name, o.object_name),
      this.repo.evidenceCount(em, id),
    ]);
    return {
      id: o.id,
      technical: {
        sourceCode: SOURCE_CODE,
        schemaName: o.schema_name,
        objectName: o.object_name,
        objectKind: o.object_kind,
        comment: o.table_comment,
        columnCount: o.column_count,
        primaryKey: o.primary_key_columns ?? [],
        statistics: {
          ...presentarEstadisticas(o),
          method: 'pg_class.reltuples + pg_total_relation_size',
        },
      },
      observation: {
        status: o.observation_status,
        lastSeenAt: iso(o.last_seen_at),
        notObservedSince: isoOrNull(o.not_observed_since),
        lastScanEngineVersion: o.engine_version,
      },
      annotation: presentarFicha(ficha),
      coverage: coverageOfObject(
        o.column_count,
        ficha ? paraCobertura(ficha) : null,
      ),
      governance: gobierno
        ? {
            entityRegistryId: gobierno.id,
            ownerTeam: gobierno.owner_team,
            containsPii: gobierno.contains_pii,
            containsPhi: gobierno.contains_phi,
            isAppendOnly: gobierno.is_append_only,
            isSoftDelete: gobierno.is_soft_delete,
            hasHistory: gobierno.has_history,
          }
        : null,
      evidenceCount: evidencias,
    };
  }

  async columns(objectId: string) {
    const em = this.db();
    await this.objeto(em, objectId);
    const [columnas, fichas] = await Promise.all([
      this.repo.columns(em, objectId),
      this.repo.columnAnnotations(em, objectId),
    ]);
    return {
      objectId,
      items: columnas.map((c: ColumnRow) => ({
        id: c.id,
        columnName: c.column_name,
        ordinal: c.ordinal,
        nativeType: c.native_type,
        isNullable: c.is_nullable,
        defaultExpression: c.default_expression,
        isIdentity: c.is_identity,
        isGenerated: c.is_generated,
        isPrimaryKey: c.is_primary_key,
        isUnique: c.is_unique,
        foreignKey: c.foreign_key,
        comment: c.column_comment,
        observationStatus: c.observation_status,
        lastSeenAt: iso(c.last_seen_at),
        annotation: presentarFicha(fichas.get(c.id)),
      })),
    };
  }

  async evidence(objectId: string) {
    const em = this.db();
    await this.objeto(em, objectId);
    return (await this.repo.evidence(em, objectId)).map(presentarEvidencia);
  }

  /** Evidencia enlazada a una columna (la nota de una FK, por ejemplo). */
  async columnEvidence(columnId: string) {
    const em = this.db();
    if (!(await this.repo.columnById(em, columnId)))
      throw new ResourceNotFoundException('Columna del catálogo no encontrada');
    return (await this.repo.columnEvidence(em, columnId)).map(
      presentarEvidencia,
    );
  }

  async history(objectId: string) {
    const em = this.db();
    await this.objeto(em, objectId);
    const ficha = await this.repo.annotationOfObject(em, objectId);
    if (!ficha) return { annotation: null, revisions: [], decisions: [] };
    const [revisiones, decisiones] = await Promise.all([
      this.repo.revisions(em, ficha.id),
      this.repo.decisions(em, ficha.id),
    ]);
    return {
      annotation: presentarFicha(ficha),
      revisions: revisiones.map((r) => ({
        revisionNo: r.revision_no,
        origin: r.origin,
        classification: r.classification,
        submittedStatus: r.submitted_status,
        changeReason: r.change_reason,
        authorUserId: r.author_user_id,
        createdAt: iso(r.created_at),
      })),
      decisions: decisiones.map((d) => ({
        revisionNo: d.revision_no,
        decision: d.decision,
        comment: d.comment,
        reviewerUserId: d.reviewer_user_id,
        decidedAt: iso(d.decided_at),
      })),
    };
  }

  async changes(objectId: string, q: CursorQueryDto) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const cursor = cursorFecha(q.cursor);
    const em = this.db();
    await this.objeto(em, objectId);
    const filas = await this.repo.changes(em, objectId, cursor, limit);
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((c) => ({
        id: c.id,
        scanRunId: c.scan_run_id,
        objectId: c.object_id,
        object: c.object,
        column: c.column,
        changeKind: c.change_kind,
        before: c.before_json,
        after: c.after_json,
        detectedAt: iso(c.created_at),
      })),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({
              t: ultimo.created_at,
              i: ultimo.id,
            })
          : null,
      limit,
    };
  }

  /**
   * Quién referencia a un objeto (`downstream`) y a quién referencia (`upstream`), por claves
   * foráneas observadas, en anchura y con tope de profundidad y de nodos.
   */
  async impact(objectId: string, q: ImpactQueryDto) {
    const direction = q.direction ?? 'both';
    const maxDepth = q.depth ?? IMPACT_DEFAULT_DEPTH;
    const em = this.db();
    await this.objeto(em, objectId);
    const grafo = await this.repo.foreignKeyGraph(em);
    // arista `desde -> hacia` = `desde` referencia a `hacia`
    const salen = new Map<string, typeof grafo>();
    const entran = new Map<string, typeof grafo>();
    for (const e of grafo) {
      salen.set(e.from_object_id, [...(salen.get(e.from_object_id) ?? []), e]);
      entran.set(e.to_object_id, [...(entran.get(e.to_object_id) ?? []), e]);
    }
    const profundidad = new Map<string, number>([[objectId, 0]]);
    const aristas = new Map<string, (typeof grafo)[number]>();
    let cola = [objectId];
    let truncatedReason: 'MAX_DEPTH' | 'MAX_NODES' | null = null;
    for (let nivel = 1; nivel <= maxDepth && cola.length; nivel++) {
      const siguiente: string[] = [];
      for (const actual of cola) {
        const vecinos: { arista: (typeof grafo)[number]; otro: string }[] = [];
        if (direction !== 'upstream')
          for (const e of entran.get(actual) ?? [])
            vecinos.push({ arista: e, otro: e.from_object_id });
        if (direction !== 'downstream')
          for (const e of salen.get(actual) ?? [])
            vecinos.push({ arista: e, otro: e.to_object_id });
        for (const { arista, otro } of vecinos) {
          if (!profundidad.has(otro)) {
            if (profundidad.size >= IMPACT_MAX_NODES) {
              truncatedReason = 'MAX_NODES';
              continue;
            }
            profundidad.set(otro, nivel);
            siguiente.push(otro);
          }
          aristas.set(
            `${arista.from_object_id}|${arista.to_object_id}|${arista.constraint_name}`,
            arista,
          );
        }
      }
      cola = siguiente;
    }
    // quedaron nodos por visitar más allá del tope de profundidad
    if (!truncatedReason && cola.length) {
      const hayMas = cola.some(
        (id) =>
          (direction !== 'upstream' &&
            (entran.get(id) ?? []).some(
              (e) => !profundidad.has(e.from_object_id),
            )) ||
          (direction !== 'downstream' &&
            (salen.get(id) ?? []).some(
              (e) => !profundidad.has(e.to_object_id),
            )),
      );
      if (hayMas) truncatedReason = 'MAX_DEPTH';
    }
    const ids = [...profundidad.keys()];
    const [objetos, fichas] = await Promise.all([
      this.repo.objectsByIds(em, ids),
      this.repo.annotationsOf(em, ids),
    ]);
    const porId = new Map(objetos.map((o) => [o.id, o]));
    return {
      root: objectId,
      direction,
      maxDepth,
      nodes: ids
        .map((id) => {
          const o = porId.get(id);
          const a = fichas.get(id);
          return {
            objectId: id,
            depth: profundidad.get(id) as number,
            schemaName: o?.schema_name ?? null,
            objectName: o?.object_name ?? null,
            objectKind: o?.object_kind ?? null,
            reviewStatus: a?.review_status ?? null,
            owner: a?.content.businessOwner ?? a?.content.dataSteward ?? null,
          };
        })
        .sort(
          (x, y) =>
            x.depth - y.depth ||
            `${x.schemaName}.${x.objectName}`.localeCompare(
              `${y.schemaName}.${y.objectName}`,
            ),
        ),
      edges: [...aristas.values()]
        .map((e) => ({
          fromObjectId: e.from_object_id,
          toObjectId: e.to_object_id,
          constraintName: e.constraint_name,
          fromColumns: e.from_columns,
          toColumns: e.to_columns,
          kind: 'REFERENCES',
          provenance: 'STRUCTURAL_FK_OBSERVED',
        }))
        .sort((x, y) => x.constraintName.localeCompare(y.constraintName)),
      truncated: truncatedReason !== null,
      truncatedReason,
      scope: IMPACT_SCOPE,
    };
  }

  async coverage(q: CoverageQueryDto) {
    const em = this.db();
    const filas = await this.repo.coverageRows(em, q.schema ?? null);
    const resumen = summarizeCoverage(
      filas.map((f) =>
        coverageOfObject(
          f.column_count,
          f.annotation ? paraCobertura(f.annotation) : null,
        ),
      ),
    );
    const ultimoOk = (await this.repo.scans(em, null, 20)).find(
      (s) => s.status === 'SUCCEEDED',
    );
    return {
      ...resumen,
      scope: { sourceCode: SOURCE_CODE, schema: q.schema ?? null },
      lastScan: ultimoOk
        ? { scanId: ultimoOk.id, finishedAt: isoOrNull(ultimoOk.finished_at) }
        : null,
    };
  }

  async scans(q: CursorQueryDto) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const cursor = cursorFecha(q.cursor);
    const filas = await this.repo.scans(this.db(), cursor, limit);
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map(presentarEscaneo),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({
              t: ultimo.requested_at,
              i: ultimo.id,
            })
          : null,
      limit,
    };
  }

  async scan(id: string) {
    const s = await this.repo.scanById(this.db(), id);
    if (!s) throw new ResourceNotFoundException('Escaneo no encontrado');
    return presentarEscaneo(s);
  }
}

export function presentarEvidencia(e: {
  id: string;
  kind: string;
  reference: string;
  excerpt: string | null;
  source_revision: string | null;
  added_by_user_id: string | null;
  created_at: string;
}) {
  return {
    id: e.id,
    kind: e.kind,
    reference: e.reference,
    excerpt: e.excerpt,
    sourceRevision: e.source_revision,
    addedByUserId: e.added_by_user_id,
    createdAt: iso(e.created_at),
  };
}

export function presentarEscaneo(s: ScanRow) {
  const contadores =
    s.objects_observed === null
      ? null
      : {
          objectsObserved: s.objects_observed,
          columnsObserved: s.columns_observed ?? 0,
          objectsAdded: s.objects_added ?? 0,
          objectsChanged: s.objects_changed ?? 0,
          objectsNotObserved: s.objects_not_observed ?? 0,
          objectsReappeared: s.objects_reappeared ?? 0,
          columnsAdded: s.columns_added ?? 0,
          columnsChanged: s.columns_changed ?? 0,
          columnsNotObserved: s.columns_not_observed ?? 0,
        };
  return {
    id: s.id,
    sourceCode: s.source_code,
    mode: s.mode,
    status: s.status,
    requestedAt: iso(s.requested_at),
    startedAt: isoOrNull(s.started_at),
    finishedAt: isoOrNull(s.finished_at),
    attempt: s.attempt,
    connectorVersion: s.connector_version,
    engineVersion: s.engine_version,
    snapshotHash: s.snapshot_hash,
    counters: contadores,
    excludedSchemas: s.excluded_schemas ?? [],
    limitations: s.limitations ?? [],
    error: s.error_code
      ? { code: s.error_code, message: s.error_message ?? '' }
      : null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cursorFecha(
  cursor: string | undefined,
): { t: string; i: string } | null {
  if (!cursor) return null;
  const c = decodeKeysetCursor(cursor);
  if (
    typeof c.t !== 'string' ||
    typeof c.i !== 'string' ||
    Number.isNaN(Date.parse(c.t)) ||
    !UUID.test(c.i)
  )
    throw new BadRequestException('El cursor de paginación no es válido');
  return { t: c.t, i: c.i };
}
