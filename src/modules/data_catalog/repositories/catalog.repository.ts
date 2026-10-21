import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AnnotationContent } from '../catalog/annotation.rules';
import {
  CONNECTOR_VERSION,
  SOURCE_CODE,
  type ReviewStatus,
} from '../catalog/catalog.constants';
import type {
  ForeignKeyInfo,
  KnownObject,
  ScanCounters,
  ScanPlan,
} from '../catalog/scan-diff';

/** La ficha completa tal como está en `catalog_annotations`, con el contenido agrupado. */
export interface AnnotationRow {
  id: string;
  target_kind: string;
  object_id: string;
  column_id: string | null;
  review_status: ReviewStatus;
  origin: string;
  current_revision_no: number;
  approved_revision_no: number | null;
  approved_by_user_id: string | null;
  approved_at: Date | null;
  updated_at: Date;
  row_version: number;
  content: AnnotationContent;
}

/** Fila de un objeto del catálogo; la ficha va aparte para no mezclar nombres de columna. */
export interface ObjectRow {
  id: string;
  schema_name: string;
  object_name: string;
  object_kind: string;
  observation_status: string;
  table_comment: string | null;
  estimated_rows: string | null;
  total_bytes: string | null;
  stats_observed_at: Date | null;
  column_count: number;
  primary_key_columns: string[] | null;
  last_seen_at: Date;
  not_observed_since: Date | null;
  engine_version: string | null;
}

export interface ColumnRow {
  id: string;
  object_id: string;
  column_name: string;
  ordinal: number;
  native_type: string;
  is_nullable: boolean;
  default_expression: string | null;
  is_identity: boolean;
  is_generated: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  foreign_key: ForeignKeyInfo | null;
  column_comment: string | null;
  observation_status: string;
  last_seen_at: Date;
}

export interface EvidenceRow {
  id: string;
  object_id: string;
  column_id: string | null;
  kind: string;
  reference: string;
  excerpt: string | null;
  source_revision: string | null;
  added_by_user_id: string | null;
  created_at: Date;
}

export interface RevisionRow {
  revision_no: number;
  origin: string;
  submitted_status: string;
  change_reason: string | null;
  author_user_id: string | null;
  created_at: Date;
}

export interface DecisionRow {
  revision_no: number;
  decision: string;
  comment: string | null;
  reviewer_user_id: string;
  decided_at: Date;
}

export interface ChangeRow {
  id: string;
  scan_run_id: string;
  object_id: string;
  object: string;
  column_id: string | null;
  column: string | null;
  change_kind: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: Date;
}

export interface ScanRow {
  id: string;
  source_code: string;
  mode: string;
  status: string;
  idempotency_key: string | null;
  requested_by_user_id: string | null;
  requested_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
  lease_owner: string | null;
  lease_expires_at: Date | null;
  attempt: number;
  engine_version: string | null;
  connector_version: string;
  excluded_schemas: string[] | null;
  limitations: { code: string; detail: string; count?: number }[] | null;
  objects_observed: number | null;
  columns_observed: number | null;
  objects_added: number | null;
  objects_changed: number | null;
  objects_not_observed: number | null;
  objects_reappeared: number | null;
  columns_added: number | null;
  columns_changed: number | null;
  columns_not_observed: number | null;
  snapshot_hash: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface ObjectFilters {
  schema?: string;
  kind?: string;
  observationStatus?: string;
  reviewStatus?: string;
  q?: string;
  missing?: string;
  cursor?: { s: string; o: string };
  limit: number;
}

/** Columnas de la ficha agrupadas en un `content` jsonb: los arreglos nulos salen como `[]`. */
const contenido = (a: string): string => `jsonb_build_object(
  'businessName', ${a}.business_name, 'definition', ${a}.definition, 'purpose', ${a}.purpose,
  'existenceRationale', ${a}.existence_rationale, 'rowGrain', ${a}.row_grain,
  'alternativesRationale', ${a}.alternatives_rationale, 'processSupported', ${a}.process_supported,
  'sourceOfTruth', ${a}.source_of_truth, 'producers', coalesce(${a}.producers, '[]'::jsonb),
  'consumers', coalesce(${a}.consumers, '[]'::jsonb), 'deletionImpact', ${a}.deletion_impact,
  'businessOwner', ${a}.business_owner, 'dataSteward', ${a}.data_steward,
  'technicalOwner', ${a}.technical_owner, 'unit', ${a}.unit, 'valueDomain', ${a}.value_domain,
  'nullSemantics', ${a}.null_semantics, 'sensitivity', ${a}.sensitivity,
  'openQuestions', coalesce(${a}.open_questions, '[]'::jsonb))`;

const ANOTACION = `a.id, a.target_kind, a.object_id, a.column_id, a.review_status, a.origin, a.current_revision_no,
  a.approved_revision_no, a.approved_by_user_id, a.approved_at, a.updated_at, a.row_version, ${contenido('a')} as content`;

/** Lista de columnas de un objeto del catálogo, con el motor con que se observó por última vez. */
const OBJETO = `select o.id, o.schema_name, o.object_name, o.object_kind, o.observation_status, o.table_comment,
  o.estimated_rows::text as estimated_rows, o.total_bytes::text as total_bytes, o.stats_observed_at, o.column_count,
  o.primary_key_columns, o.last_seen_at, o.not_observed_since, s.engine_version`;

/** `%`, `_` y `\` de una búsqueda no son comodines: se escapan. */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const ahora = (): Date => new Date();

/**
 * Acceso a `data_catalog.*` con SQL parametrizado. Los métodos reciben el `em` del llamador para
 * correr dentro de su transacción; ninguno abre una por su cuenta.
 *
 * Las listas de ids viajan como un único parámetro JSON (`jsonb_array_elements_text`) y no como
 * arreglo: el motor de consultas expande los arreglos en una lista de parámetros.
 */
@Injectable()
export class CatalogRepository {
  /** Ejecuta SQL dentro de la transacción del `em` si la hay: sin el contexto, correría fuera de ella. */
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  // ---- objetos ---------------------------------------------------------------------------

  schemas(em: EntityManager): Promise<
    {
      schema_name: string;
      objects: number;
      not_observed: number;
      annotated: number;
      approved: number;
    }[]
  > {
    return this.q(
      em,
      `select o.schema_name,
              (count(*) filter (where o.observation_status = 'OBSERVED'))::int as objects,
              (count(*) filter (where o.observation_status = 'NOT_OBSERVED'))::int as not_observed,
              count(a.id)::int as annotated,
              (count(*) filter (where a.review_status = 'APPROVED' and a.approved_revision_no = a.current_revision_no))::int as approved
         from data_catalog.catalog_objects o
         left join data_catalog.catalog_annotations a on a.object_id = o.id and a.target_kind = 'OBJECT'
        where o.source_code = ?
        group by o.schema_name order by o.schema_name`,
      [SOURCE_CODE],
    );
  }

  /** Objetos en orden `(schema, objeto)`, con un elemento de más para saber si hay otra página. */
  async objects(em: EntityManager, f: ObjectFilters): Promise<ObjectRow[]> {
    const where: string[] = ['o.source_code = ?'];
    const params: unknown[] = [SOURCE_CODE];
    const agregar = (sql: string, ...valores: unknown[]): void => {
      where.push(sql);
      params.push(...valores);
    };
    if (f.schema) agregar('o.schema_name = ?', f.schema);
    if (f.kind) agregar('o.object_kind = ?', f.kind);
    if (f.observationStatus)
      agregar('o.observation_status = ?', f.observationStatus);
    if (f.reviewStatus === 'NONE') where.push('a.id is null');
    else if (f.reviewStatus) agregar('a.review_status = ?', f.reviewStatus);
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      agregar(
        `(lower(o.schema_name || '.' || o.object_name) like ? escape '\\' or lower(coalesce(a.business_name, '')) like ? escape '\\')`,
        patron,
        patron,
      );
    }
    if (f.missing === 'businessOwner')
      where.push(
        `coalesce(nullif(trim(a.business_owner), ''), nullif(trim(a.data_steward), '')) is null`,
      );
    else if (f.missing) {
      const columna = (
        {
          purpose: 'purpose',
          existenceRationale: 'existence_rationale',
          rowGrain: 'row_grain',
        } as Record<string, string>
      )[f.missing];
      if (columna) where.push(`nullif(trim(a.${columna}), '') is null`);
    }
    if (f.cursor)
      agregar(
        '(o.schema_name, o.object_name) > (?, ?)',
        f.cursor.s,
        f.cursor.o,
      );
    params.push(f.limit + 1);
    return this.q<ObjectRow[]>(
      em,
      `${OBJETO}
         from data_catalog.catalog_objects o
         left join data_catalog.catalog_scan_runs s on s.id = o.last_seen_scan_id
         left join data_catalog.catalog_annotations a on a.object_id = o.id and a.target_kind = 'OBJECT'
        where ${where.join(' and ')}
        order by o.schema_name, o.object_name
        limit ?`,
      params,
    );
  }

  /** Objetos por id, sin la ficha. */
  objectsByIds(em: EntityManager, ids: string[]): Promise<ObjectRow[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.q<ObjectRow[]>(
      em,
      `${OBJETO}
         from data_catalog.catalog_objects o
         left join data_catalog.catalog_scan_runs s on s.id = o.last_seen_scan_id
        where o.id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
      [JSON.stringify(ids)],
    );
  }

  async objectById(em: EntityManager, id: string): Promise<ObjectRow | null> {
    const filas = await this.q<ObjectRow[]>(
      em,
      `${OBJETO}
         from data_catalog.catalog_objects o
         left join data_catalog.catalog_scan_runs s on s.id = o.last_seen_scan_id
        where o.id = ? and o.source_code = ?`,
      [id, SOURCE_CODE],
    );
    return filas[0] ?? null;
  }

  /** Fichas de objeto de un conjunto de objetos, por id de objeto. */
  async annotationsOf(
    em: EntityManager,
    objectIds: string[],
  ): Promise<Map<string, AnnotationRow>> {
    if (!objectIds.length) return new Map();
    const filas = await this.q<AnnotationRow[]>(
      em,
      `select ${ANOTACION} from data_catalog.catalog_annotations a
        where a.target_kind = 'OBJECT' and a.object_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
      [JSON.stringify(objectIds)],
    );
    return new Map(filas.map((f) => [f.object_id, f]));
  }

  async annotationOfObject(
    em: EntityManager,
    objectId: string,
  ): Promise<AnnotationRow | null> {
    return (await this.annotationsOf(em, [objectId])).get(objectId) ?? null;
  }

  async annotationById(
    em: EntityManager,
    id: string,
  ): Promise<AnnotationRow | null> {
    const filas = await this.q<AnnotationRow[]>(
      em,
      `select ${ANOTACION} from data_catalog.catalog_annotations a where a.id = ?`,
      [id],
    );
    return filas[0] ?? null;
  }

  // ---- columnas, evidencia, historial y cambios ------------------------------------------

  columns(em: EntityManager, objectId: string): Promise<ColumnRow[]> {
    return this.q(
      em,
      `select id, object_id, column_name, ordinal, native_type, is_nullable, default_expression, is_identity, is_generated, is_primary_key,
              is_unique, foreign_key, column_comment, observation_status, last_seen_at
         from data_catalog.catalog_columns where object_id = ? order by ordinal`,
      [objectId],
    );
  }

  async columnAnnotations(
    em: EntityManager,
    objectId: string,
  ): Promise<Map<string, AnnotationRow>> {
    const filas = await this.q<AnnotationRow[]>(
      em,
      `select ${ANOTACION} from data_catalog.catalog_annotations a where a.object_id = ? and a.target_kind = 'COLUMN'`,
      [objectId],
    );
    return new Map(
      filas.filter((f) => f.column_id).map((f) => [f.column_id as string, f]),
    );
  }

  evidence(em: EntityManager, objectId: string): Promise<EvidenceRow[]> {
    return this.q(
      em,
      `select id, object_id, column_id, kind, reference, excerpt, source_revision, added_by_user_id, created_at
         from data_catalog.catalog_evidence_items where object_id = ? order by created_at desc, id`,
      [objectId],
    );
  }

  async evidenceCount(em: EntityManager, objectId: string): Promise<number> {
    const [fila] = await this.q<{ n: number }[]>(
      em,
      'select count(*)::int as n from data_catalog.catalog_evidence_items where object_id = ?',
      [objectId],
    );
    return fila?.n ?? 0;
  }

  async addEvidence(
    em: EntityManager,
    e: {
      objectId: string;
      kind: string;
      reference: string;
      excerpt: string | null;
      sourceRevision: string | null;
      userId: string;
    },
  ): Promise<EvidenceRow> {
    const id = randomUUID();
    const [fila] = await this.q<EvidenceRow[]>(
      em,
      `insert into data_catalog.catalog_evidence_items (id, object_id, kind, reference, excerpt, source_revision, added_by_user_id, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)
       returning id, object_id, column_id, kind, reference, excerpt, source_revision, added_by_user_id, created_at`,
      [
        id,
        e.objectId,
        e.kind,
        e.reference,
        e.excerpt,
        e.sourceRevision,
        e.userId,
        ahora(),
      ],
    );
    return fila;
  }

  revisions(em: EntityManager, annotationId: string): Promise<RevisionRow[]> {
    return this.q(
      em,
      `select revision_no, origin, submitted_status, change_reason, author_user_id, created_at
         from data_catalog.catalog_annotation_revisions where annotation_id = ? order by revision_no desc`,
      [annotationId],
    );
  }

  decisions(em: EntityManager, annotationId: string): Promise<DecisionRow[]> {
    return this.q(
      em,
      `select revision_no, decision, comment, reviewer_user_id, decided_at
         from data_catalog.catalog_review_decisions where annotation_id = ? order by decided_at desc, revision_no desc`,
      [annotationId],
    );
  }

  /** Autor de una revisión concreta: quien no puede decidir sobre ella. */
  async revisionAuthor(
    em: EntityManager,
    annotationId: string,
    revisionNo: number,
  ): Promise<string | null> {
    const [fila] = await this.q<{ author_user_id: string | null }[]>(
      em,
      'select author_user_id from data_catalog.catalog_annotation_revisions where annotation_id = ? and revision_no = ?',
      [annotationId, revisionNo],
    );
    return fila?.author_user_id ?? null;
  }

  /** Cambios de un objeto, del más reciente al más antiguo; un elemento de más para saber si hay otra página. */
  changes(
    em: EntityManager,
    objectId: string,
    cursor: { t: string; i: string } | null,
    limit: number,
  ): Promise<ChangeRow[]> {
    const params: unknown[] = [objectId];
    let filtro = '';
    if (cursor) {
      filtro = 'and (ce.created_at, ce.id) < (?::timestamptz, ?::uuid)';
      params.push(cursor.t, cursor.i);
    }
    params.push(limit + 1);
    return this.q(
      em,
      `select ce.id, ce.scan_run_id, ce.object_id, o.schema_name || '.' || o.object_name as object,
              ce.column_id, c.column_name as "column", ce.change_kind, ce.before_json, ce.after_json, ce.created_at
         from data_catalog.catalog_change_events ce
         join data_catalog.catalog_objects o on o.id = ce.object_id
         left join data_catalog.catalog_columns c on c.id = ce.column_id
        where ce.object_id = ? ${filtro}
        order by ce.created_at desc, ce.id desc
        limit ?`,
      params,
    );
  }

  /** Claves foráneas observadas entre objetos observados: el grafo del análisis de impacto. */
  foreignKeyGraph(em: EntityManager): Promise<
    {
      from_object_id: string;
      to_object_id: string;
      constraint_name: string;
      from_columns: string[];
      to_columns: string[];
    }[]
  > {
    return this.q(
      em,
      `select c.object_id as from_object_id, t.id as to_object_id,
              c.foreign_key->>'constraintName' as constraint_name,
              array(select jsonb_array_elements_text(c.foreign_key->'sourceColumns')) as from_columns,
              array(select jsonb_array_elements_text(c.foreign_key->'targetColumns')) as to_columns
         from data_catalog.catalog_columns c
         join data_catalog.catalog_objects t
           on t.source_code = ? and t.schema_name = c.foreign_key->>'targetSchema' and t.object_name = c.foreign_key->>'targetTable'
        where c.foreign_key is not null and c.observation_status = 'OBSERVED' and t.observation_status = 'OBSERVED'
          and c.foreign_key->'sourceColumns'->>0 = c.column_name`,
      [SOURCE_CODE],
    );
  }

  /** Filas mínimas para calcular la cobertura de los objetos observados. */
  async coverageRows(
    em: EntityManager,
    schema: string | null,
  ): Promise<{ column_count: number; annotation: AnnotationRow | null }[]> {
    const params: unknown[] = [SOURCE_CODE];
    let filtro = '';
    if (schema) {
      filtro = 'and o.schema_name = ?';
      params.push(schema);
    }
    const objetos = await this.q<{ id: string; column_count: number }[]>(
      em,
      `select o.id, o.column_count from data_catalog.catalog_objects o
        where o.source_code = ? and o.observation_status = 'OBSERVED' ${filtro}`,
      params,
    );
    const fichas = await this.annotationsOf(
      em,
      objetos.map((o) => o.id),
    );
    return objetos.map((o) => ({
      column_count: o.column_count,
      annotation: fichas.get(o.id) ?? null,
    }));
  }

  /** Datos de gobierno de `system_ops.entity_registry` para un objeto, si el registro lo tiene. */
  async governance(
    em: EntityManager,
    schema: string,
    table: string,
  ): Promise<{
    id: string;
    owner_team: string | null;
    contains_pii: boolean | null;
    contains_phi: boolean | null;
    is_append_only: boolean;
    is_soft_delete: boolean;
    has_history: boolean;
  } | null> {
    const [fila] = await this.q<
      {
        id: string;
        owner_team: string | null;
        contains_pii: boolean | null;
        contains_phi: boolean | null;
        is_append_only: boolean;
        is_soft_delete: boolean;
        has_history: boolean;
      }[]
    >(
      em,
      `select id, owner_team, contains_pii, contains_phi, is_append_only, is_soft_delete, has_history
         from system_ops.entity_registry where schema_name = ? and table_name = ? limit 1`,
      [schema, table],
    );
    return fila ?? null;
  }

  // ---- ficha: escritura ------------------------------------------------------------------

  /** Crea la ficha de un objeto. Falla con violación de unicidad si otra petición la creó antes. */
  async insertAnnotation(
    em: EntityManager,
    a: {
      objectId: string;
      content: AnnotationContent;
      reviewStatus: string;
      userId: string;
    },
  ): Promise<AnnotationRow> {
    const id = randomUUID();
    const c = a.content;
    const t = ahora();
    await this.q(
      em,
      `insert into data_catalog.catalog_annotations (id, target_kind, object_id, business_name, definition, purpose,
         existence_rationale, row_grain, alternatives_rationale, process_supported, source_of_truth, producers, consumers,
         deletion_impact, business_owner, data_steward, technical_owner, unit, value_domain, null_semantics, sensitivity,
         open_questions, review_status, origin, current_revision_no, approved_revision_no, created_at, updated_at,
         created_by_user_id, updated_by_user_id, row_version)
       values (?, 'OBJECT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, 'MANUAL', 1, null, ?, ?, ?, ?, 1)`,
      [
        id,
        a.objectId,
        c.businessName,
        c.definition,
        c.purpose,
        c.existenceRationale,
        c.rowGrain,
        c.alternativesRationale,
        c.processSupported,
        c.sourceOfTruth,
        JSON.stringify(c.producers),
        JSON.stringify(c.consumers),
        c.deletionImpact,
        c.businessOwner,
        c.dataSteward,
        c.technicalOwner,
        c.unit,
        c.valueDomain,
        c.nullSemantics,
        c.sensitivity,
        JSON.stringify(c.openQuestions),
        a.reviewStatus,
        t,
        t,
        a.userId,
        a.userId,
      ],
    );
    return (await this.annotationById(em, id)) as AnnotationRow;
  }

  /**
   * Actualiza la ficha **sólo si sigue en la versión leída**. Devuelve `false` si otra petición
   * la cambió antes: la precondición va en la escritura, no en un `if` previo.
   */
  async updateAnnotation(
    em: EntityManager,
    id: string,
    expectedVersion: number,
    a: {
      content: AnnotationContent;
      reviewStatus: string;
      revisionNo: number;
      userId: string;
    },
  ): Promise<boolean> {
    const c = a.content;
    const filas = await this.q<{ id: string }[]>(
      em,
      `update data_catalog.catalog_annotations set business_name = ?, definition = ?, purpose = ?, existence_rationale = ?,
         row_grain = ?, alternatives_rationale = ?, process_supported = ?, source_of_truth = ?, producers = ?::jsonb,
         consumers = ?::jsonb, deletion_impact = ?, business_owner = ?, data_steward = ?, technical_owner = ?, unit = ?,
         value_domain = ?, null_semantics = ?, sensitivity = ?, open_questions = ?::jsonb, review_status = ?,
         current_revision_no = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
       where id = ? and row_version = ? returning id`,
      [
        c.businessName,
        c.definition,
        c.purpose,
        c.existenceRationale,
        c.rowGrain,
        c.alternativesRationale,
        c.processSupported,
        c.sourceOfTruth,
        JSON.stringify(c.producers),
        JSON.stringify(c.consumers),
        c.deletionImpact,
        c.businessOwner,
        c.dataSteward,
        c.technicalOwner,
        c.unit,
        c.valueDomain,
        c.nullSemantics,
        c.sensitivity,
        JSON.stringify(c.openQuestions),
        a.reviewStatus,
        a.revisionNo,
        ahora(),
        a.userId,
        id,
        expectedVersion,
      ],
    );
    return filas.length === 1;
  }

  insertRevision(
    em: EntityManager,
    r: {
      annotationId: string;
      revisionNo: number;
      content: AnnotationContent;
      contentHash: string;
      submittedStatus: string;
      changeReason: string | null;
      authorId: string;
    },
  ): Promise<unknown> {
    return this.q(
      em,
      `insert into data_catalog.catalog_annotation_revisions (id, annotation_id, revision_no, content_json, content_hash, origin,
         submitted_status, change_reason, author_user_id, created_at)
       values (?, ?, ?, ?::jsonb, ?, 'MANUAL', ?, ?, ?, ?)`,
      [
        randomUUID(),
        r.annotationId,
        r.revisionNo,
        JSON.stringify(r.content),
        r.contentHash,
        r.submittedStatus,
        r.changeReason,
        r.authorId,
        ahora(),
      ],
    );
  }

  /**
   * Registra la decisión y mueve la ficha **sólo si sigue en la revisión revisada y en revisión**.
   * Devuelve `false` si otra petición se adelantó.
   */
  async decide(
    em: EntityManager,
    d: {
      annotationId: string;
      revisionNo: number;
      decision: 'APPROVED' | 'REJECTED';
      comment: string | null;
      reviewerId: string;
    },
  ): Promise<boolean> {
    const t = ahora();
    const aprobada = d.decision === 'APPROVED';
    const filas = await this.q<{ id: string }[]>(
      em,
      `update data_catalog.catalog_annotations set review_status = ?, approved_revision_no = case when ? then current_revision_no else approved_revision_no end,
         approved_by_user_id = case when ? then ?::uuid else approved_by_user_id end,
         approved_at = case when ? then ?::timestamptz else approved_at end,
         updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
       where id = ? and current_revision_no = ? and review_status = 'NEEDS_REVIEW' returning id`,
      [
        d.decision,
        aprobada,
        aprobada,
        d.reviewerId,
        aprobada,
        t,
        t,
        d.reviewerId,
        d.annotationId,
        d.revisionNo,
      ],
    );
    if (filas.length !== 1) return false;
    await this.q(
      em,
      `insert into data_catalog.catalog_review_decisions (id, annotation_id, revision_no, decision, comment, reviewer_user_id, decided_at)
       values (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        d.annotationId,
        d.revisionNo,
        d.decision,
        d.comment,
        d.reviewerId,
        t,
      ],
    );
    return true;
  }

  // ---- escaneos --------------------------------------------------------------------------

  scans(
    em: EntityManager,
    cursor: { t: string; i: string } | null,
    limit: number,
  ): Promise<ScanRow[]> {
    const params: unknown[] = [SOURCE_CODE];
    let filtro = '';
    if (cursor) {
      filtro = 'and (requested_at, id) < (?::timestamptz, ?::uuid)';
      params.push(cursor.t, cursor.i);
    }
    params.push(limit + 1);
    return this.q(
      em,
      `select * from data_catalog.catalog_scan_runs where source_code = ? ${filtro} order by requested_at desc, id desc limit ?`,
      params,
    );
  }

  async scanById(em: EntityManager, id: string): Promise<ScanRow | null> {
    const [fila] = await this.q<ScanRow[]>(
      em,
      'select * from data_catalog.catalog_scan_runs where id = ?',
      [id],
    );
    return fila ?? null;
  }

  async scanByIdempotency(
    em: EntityManager,
    userId: string,
    key: string,
  ): Promise<ScanRow | null> {
    const [fila] = await this.q<ScanRow[]>(
      em,
      'select * from data_catalog.catalog_scan_runs where requested_by_user_id = ? and idempotency_key = ?',
      [userId, key],
    );
    return fila ?? null;
  }

  async activeScan(em: EntityManager): Promise<ScanRow | null> {
    const [fila] = await this.q<ScanRow[]>(
      em,
      `select * from data_catalog.catalog_scan_runs where source_code = ? and status in ('QUEUED', 'RUNNING') limit 1`,
      [SOURCE_CODE],
    );
    return fila ?? null;
  }

  /** Cierra como FALLIDOS los escaneos que quedaron sin terminar y cuyo lease venció (el proceso murió). */
  async failAbandoned(
    em: EntityManager,
    now: Date,
    queuedOlderThanSeconds: number,
  ): Promise<number> {
    const filas = await this.q<{ id: string }[]>(
      em,
      `update data_catalog.catalog_scan_runs set status = 'FAILED', finished_at = ?, updated_at = ?,
              error_code = case when status = 'RUNNING' then 'LEASE_EXPIRED' else 'NEVER_STARTED' end,
              error_message = case when status = 'RUNNING' then 'El proceso que ejecutaba el escaneo dejó de renovar su lease' else 'El escaneo se aceptó y nunca llegó a iniciarse' end,
              row_version = row_version + 1
        where source_code = ? and (
              (status = 'RUNNING' and lease_expires_at < ?)
           or (status = 'QUEUED' and requested_at < ?::timestamptz - make_interval(secs => ?)))
        returning id`,
      [now, now, SOURCE_CODE, now, now, queuedOlderThanSeconds],
    );
    return filas.length;
  }

  async insertScan(
    em: EntityManager,
    s: {
      userId: string;
      idempotencyKey: string | null;
      excludedSchemas: string[];
    },
  ): Promise<ScanRow> {
    const id = randomUUID();
    const t = ahora();
    await this.q(
      em,
      `insert into data_catalog.catalog_scan_runs (id, source_code, mode, status, idempotency_key, requested_by_user_id, requested_at,
         attempt, connector_version, excluded_schemas, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       values (?, ?, 'FULL', 'QUEUED', ?, ?, ?, 0, ?, ?::jsonb, ?, ?, ?, ?, 1)`,
      [
        id,
        SOURCE_CODE,
        s.idempotencyKey,
        s.userId,
        t,
        CONNECTOR_VERSION,
        JSON.stringify(s.excludedSchemas),
        t,
        t,
        s.userId,
        s.userId,
      ],
    );
    return (await this.scanById(em, id)) as ScanRow;
  }

  /** Toma el escaneo: sólo uno en cola puede pasar a RUNNING, y queda con un lease. */
  async claimScan(
    em: EntityManager,
    id: string,
    owner: string,
    leaseSeconds: number,
  ): Promise<ScanRow | null> {
    const t = ahora();
    const [fila] = await this.q<ScanRow[]>(
      em,
      `update data_catalog.catalog_scan_runs set status = 'RUNNING', started_at = ?, attempt = attempt + 1, lease_owner = ?,
              lease_expires_at = ?::timestamptz + make_interval(secs => ?), updated_at = ?, row_version = row_version + 1
        where id = ? and status = 'QUEUED' returning *`,
      [t, owner, t, leaseSeconds, t, id],
    );
    return fila ?? null;
  }

  async finishScan(
    em: EntityManager,
    id: string,
    r: {
      counters: ScanCounters;
      snapshotHash: string;
      engineVersion: string;
      limitations: { code: string; detail: string }[];
    },
  ): Promise<void> {
    const t = ahora();
    const c = r.counters;
    await this.q(
      em,
      `update data_catalog.catalog_scan_runs set status = 'SUCCEEDED', finished_at = ?, lease_owner = null, lease_expires_at = null,
              engine_version = ?, limitations = ?::jsonb, objects_observed = ?, columns_observed = ?, objects_added = ?, objects_changed = ?,
              objects_not_observed = ?, objects_reappeared = ?, columns_added = ?, columns_changed = ?, columns_not_observed = ?,
              snapshot_hash = ?, updated_at = ?, row_version = row_version + 1
        where id = ?`,
      [
        t,
        r.engineVersion,
        JSON.stringify(r.limitations),
        c.objectsObserved,
        c.columnsObserved,
        c.objectsAdded,
        c.objectsChanged,
        c.objectsNotObserved,
        c.objectsReappeared,
        c.columnsAdded,
        c.columnsChanged,
        c.columnsNotObserved,
        r.snapshotHash,
        t,
        id,
      ],
    );
  }

  async failScan(
    em: EntityManager,
    id: string,
    code: string,
    message: string,
  ): Promise<void> {
    const t = ahora();
    await this.q(
      em,
      `update data_catalog.catalog_scan_runs set status = 'FAILED', finished_at = ?, lease_owner = null, lease_expires_at = null,
              error_code = ?, error_message = ?, updated_at = ?, row_version = row_version + 1 where id = ?`,
      [t, code, message.slice(0, 1000), t, id],
    );
  }

  /** Objetos y columnas que el catálogo ya conoce, para compararlos con lo observado. */
  async knownObjects(em: EntityManager): Promise<KnownObject[]> {
    const objetos = await this.q<
      {
        id: string;
        schema_name: string;
        object_name: string;
        observation_status: string;
        technical_hash: string;
      }[]
    >(
      em,
      'select id, schema_name, object_name, observation_status, technical_hash from data_catalog.catalog_objects where source_code = ?',
      [SOURCE_CODE],
    );
    const columnas = await this.q<
      {
        id: string;
        object_id: string;
        column_name: string;
        observation_status: string;
        technical_hash: string;
      }[]
    >(
      em,
      `select c.id, c.object_id, c.column_name, c.observation_status, c.technical_hash
         from data_catalog.catalog_columns c join data_catalog.catalog_objects o on o.id = c.object_id where o.source_code = ?`,
      [SOURCE_CODE],
    );
    const mapa = new Map<string, KnownObject>(
      objetos.map((o) => [
        o.id,
        {
          id: o.id,
          schemaName: o.schema_name,
          objectName: o.object_name,
          observationStatus: o.observation_status,
          technicalHash: o.technical_hash,
          columns: new Map(),
        },
      ]),
    );
    for (const c of columnas)
      mapa.get(c.object_id)?.columns.set(c.column_name, {
        id: c.id,
        observationStatus: c.observation_status,
        technicalHash: c.technical_hash,
      });
    return [...mapa.values()];
  }

  /**
   * Escribe el resultado de un escaneo: altas, cambios, desapariciones y eventos. Va en la
   * transacción del llamador: o queda todo o no queda nada.
   */
  async applyScan(
    em: EntityManager,
    scanId: string,
    userId: string | null,
    plan: ScanPlan,
  ): Promise<void> {
    const t = ahora();
    const idDeObjeto = new Map<string, string>();
    const objetosNuevos: Record<string, unknown>[] = [];
    const objetosExistentes: Record<string, unknown>[] = [];
    const columnasNuevas: Record<string, unknown>[] = [];
    const columnasExistentes: Record<string, unknown>[] = [];
    const idDeColumna = new Map<string, string>();

    for (const p of plan.objects) {
      const o = p.observed;
      const clave = `${o.schemaName}.${o.objectName}`;
      const id = p.known?.id ?? randomUUID();
      idDeObjeto.set(clave, id);
      const fila = {
        id,
        kind: o.kind,
        comment: o.comment,
        rows: o.estimatedRows,
        bytes: o.totalBytes,
        count: o.columns.length,
        pk: o.primaryKey,
        hash: p.hash,
        bump: p.change !== 'UNCHANGED' || p.reappeared,
      };
      if (p.known) objetosExistentes.push(fila);
      else
        objetosNuevos.push({
          ...fila,
          schema: o.schemaName,
          name: o.objectName,
        });
      for (const c of p.columns) {
        const cid = c.known?.id ?? randomUUID();
        idDeColumna.set(`${clave}#${c.observed.name}`, cid);
        const cf = {
          id: cid,
          object_id: id,
          name: c.observed.name,
          ordinal: c.observed.ordinal,
          type: c.observed.nativeType,
          nullable: c.observed.isNullable,
          def: c.observed.defaultExpression,
          identity: c.observed.isIdentity,
          generated: c.observed.isGenerated,
          pk: c.observed.isPrimaryKey,
          uq: c.observed.isUnique,
          fk: c.observed.foreignKey,
          comment: c.observed.comment,
          hash: c.hash,
          bump: c.change !== 'UNCHANGED' || c.reappeared,
        };
        if (c.known) columnasExistentes.push(cf);
        else columnasNuevas.push(cf);
      }
    }
    for (const v of plan.vanished)
      idDeObjeto.set(`${v.schemaName}.${v.objectName}`, v.id);
    for (const p of plan.objects)
      for (const m of p.columnsMissing)
        idDeColumna.set(
          `${p.observed.schemaName}.${p.observed.objectName}#${m.name}`,
          m.id,
        );

    if (objetosNuevos.length)
      await this.q(
        em,
        `insert into data_catalog.catalog_objects (id, source_code, schema_name, object_name, object_kind, observation_status, table_comment,
           estimated_rows, total_bytes, stats_observed_at, column_count, primary_key_columns, technical_hash, first_seen_scan_id,
           last_seen_scan_id, last_seen_at, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         select r.id, ?, r.schema, r.name, r.kind, 'OBSERVED', r.comment, r.rows::bigint, r.bytes::bigint, ?, r.count, r.pk, r.hash, ?, ?, ?, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, schema text, name text, kind text, comment text, rows text, bytes text, count int, pk jsonb, hash text)`,
        [
          SOURCE_CODE,
          t,
          scanId,
          scanId,
          t,
          t,
          t,
          userId,
          userId,
          JSON.stringify(objetosNuevos),
        ],
      );
    if (objetosExistentes.length)
      await this.q(
        em,
        `update data_catalog.catalog_objects o set object_kind = r.kind, table_comment = r.comment, estimated_rows = r.rows::bigint,
                total_bytes = r.bytes::bigint, stats_observed_at = ?, column_count = r.count, primary_key_columns = r.pk,
                technical_hash = r.hash, observation_status = 'OBSERVED', not_observed_since = null, last_seen_scan_id = ?,
                last_seen_at = ?, updated_at = ?, updated_by_user_id = ?,
                row_version = o.row_version + case when r.bump then 1 else 0 end
           from jsonb_to_recordset(?::jsonb) as r(id uuid, kind text, comment text, rows text, bytes text, count int, pk jsonb, hash text, bump boolean)
          where o.id = r.id`,
        [t, scanId, t, t, userId, JSON.stringify(objetosExistentes)],
      );
    if (columnasNuevas.length)
      await this.q(
        em,
        `insert into data_catalog.catalog_columns (id, object_id, column_name, ordinal, native_type, is_nullable, default_expression, is_identity,
           is_generated, is_primary_key, is_unique, foreign_key, column_comment, observation_status, technical_hash, first_seen_scan_id,
           last_seen_scan_id, last_seen_at, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         select r.id, r.object_id, r.name, r.ordinal, r.type, r.nullable, r.def, r.identity, r.generated, r.pk, r.uq, r.fk, r.comment,
                'OBSERVED', r.hash, ?, ?, ?, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, object_id uuid, name text, ordinal int, type text, nullable boolean, def text,
                identity boolean, generated boolean, pk boolean, uq boolean, fk jsonb, comment text, hash text)`,
        [
          scanId,
          scanId,
          t,
          t,
          t,
          userId,
          userId,
          JSON.stringify(columnasNuevas),
        ],
      );
    if (columnasExistentes.length)
      await this.q(
        em,
        `update data_catalog.catalog_columns c set ordinal = r.ordinal, native_type = r.type, is_nullable = r.nullable, default_expression = r.def,
                is_identity = r.identity, is_generated = r.generated, is_primary_key = r.pk, is_unique = r.uq, foreign_key = r.fk,
                column_comment = r.comment, technical_hash = r.hash, observation_status = 'OBSERVED', not_observed_since = null,
                last_seen_scan_id = ?, last_seen_at = ?, updated_at = ?, updated_by_user_id = ?,
                row_version = c.row_version + case when r.bump then 1 else 0 end
           from jsonb_to_recordset(?::jsonb) as r(id uuid, name text, ordinal int, type text, nullable boolean, def text, identity boolean,
                generated boolean, pk boolean, uq boolean, fk jsonb, comment text, hash text, bump boolean)
          where c.id = r.id`,
        [scanId, t, t, userId, JSON.stringify(columnasExistentes)],
      );

    // lo que dejó de aparecer
    const columnasFaltantes = plan.objects.flatMap((p) =>
      p.columnsMissing.map((m) => m.id),
    );
    if (columnasFaltantes.length)
      await this.q(
        em,
        `update data_catalog.catalog_columns set observation_status = 'NOT_OBSERVED', not_observed_since = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
          where id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
        [t, t, userId, JSON.stringify(columnasFaltantes)],
      );
    if (plan.vanished.length) {
      const ids = JSON.stringify(plan.vanished.map((v) => v.id));
      await this.q(
        em,
        `update data_catalog.catalog_objects set observation_status = 'NOT_OBSERVED', not_observed_since = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
          where id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
        [t, t, userId, ids],
      );
      await this.q(
        em,
        `update data_catalog.catalog_columns set observation_status = 'NOT_OBSERVED', not_observed_since = coalesce(not_observed_since, ?), updated_at = ?
          where observation_status = 'OBSERVED' and object_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
        [t, t, ids],
      );
    }

    // eventos
    const eventos = plan.events.map((e) => ({
      id: randomUUID(),
      object_id: idDeObjeto.get(e.objectKey),
      column_id: e.columnName
        ? (idDeColumna.get(`${e.objectKey}#${e.columnName}`) ?? null)
        : null,
      kind: e.kind,
      before: e.before,
      after: e.after,
    }));
    if (eventos.length)
      await this.q(
        em,
        `insert into data_catalog.catalog_change_events (id, scan_run_id, object_id, column_id, change_kind, before_json, after_json, created_at)
         select r.id, ?, r.object_id, r.column_id, r.kind, r.before, r.after, ?
           from jsonb_to_recordset(?::jsonb) as r(id uuid, object_id uuid, column_id uuid, kind text, before jsonb, after jsonb)`,
        [scanId, t, JSON.stringify(eventos)],
      );
  }
}
