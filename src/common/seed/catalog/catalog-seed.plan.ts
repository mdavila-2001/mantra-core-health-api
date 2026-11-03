import { createHash } from 'node:crypto';
import { SEED_ACTOR_ID } from '../seed-actor';
import { deterministicId } from '../../constants/concepts';
import type {
  CatalogacionInventory,
  InvTable,
} from '../../../modules/data_catalog/application/catalogacion/catalogacion-inventory';
import {
  assessTable,
  buildQualityContext,
  type ColumnAssessment,
  type QualityContext,
  type TableAssessment,
  type VaultDataset,
} from '../../../modules/data_catalog/application/catalogacion/quality-context';
import type { QualifiedText } from '../../../modules/data_catalog/application/catalogacion/explanation-quality';
import { tableSystemReference } from '../../../modules/data_catalog/application/catalogacion/system-explanation';
import {
  contentHash,
  EMPTY_CONTENT,
  type AnnotationContent,
  type OpenQuestion,
} from '../../../modules/data_catalog/domain/catalog/annotation.rules';
import {
  SENSITIVITY_RANK,
  type Sensitivity,
} from '../../../modules/data_catalog/domain/catalog/catalog.constants';
import { CLASSIFIED_BY } from '../../../modules/data_catalog/domain/classification/classification.rules';
import type { ObjectIndex, SeedRow } from './catalog-seed.types';

/** Versión de la siembra: viaja en la procedencia de cada ficha y evidencia. */
export const CATALOG_SEED_VERSION = 'catalogacion-seed/v1';

const id = (kind: string, key: string): string =>
  deterministicId(`catalogacion:${kind}:${key}`);

const sha = (texto: string): string =>
  createHash('sha256').update(texto).digest('hex');

const iso = (d: Date): string => d.toISOString();

// ---- dominios --------------------------------------------------------------------------------

const slug = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

/** `code` estable del dominio de negocio (`Identidad y Seguridad` → `IDENTIDAD_Y_SEGURIDAD`). */
export const domainCode = (name: string): string => slug(name);

export function planDomains(tables: readonly InvTable[], now: Date): SeedRow[] {
  const porDominio = new Map<
    string,
    { modules: Set<number>; tables: number; reference: string }
  >();
  for (const t of tables) {
    if (!t.domain) continue;
    const d = porDominio.get(t.domain.name) ?? {
      modules: new Set<number>(),
      tables: 0,
      reference: t.domain.reference,
    };
    d.modules.add(t.domain.number);
    d.tables += 1;
    porDominio.set(t.domain.name, d);
  }
  return [...porDominio]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, d]) => ({
      id: id('domain', domainCode(name)),
      code: domainCode(name),
      name,
      description:
        `Dominio de negocio del modelo de datos: ${d.tables} tablas en los módulos ` +
        `${[...d.modules].sort((a, b) => a - b).join(', ')}. Fuente: ${d.reference}.`,
      owner_team: null,
      created_at: iso(now),
      updated_at: iso(now),
      created_by_user_id: SEED_ACTOR_ID,
      updated_by_user_id: SEED_ACTOR_ID,
      row_version: 1,
    }));
}

// ---- clasificaciones -------------------------------------------------------------------------

interface ClassificationSeed {
  code: Exclude<Sensitivity, 'UNKNOWN'>;
  name: string;
  isPii: boolean | null;
  isPhi: boolean | null;
  /** Norma o regla de la que sale; `null` si el clasificador no cita una. */
  basis: string | null;
}

/**
 * Los niveles de sensibilidad del clasificador (`SENSITIVITIES`, sin `UNKNOWN`, que no es un
 * nivel). `isPii`/`isPhi` sólo se declaran donde la norma citada por las reglas del clasificador
 * lo dice; en el resto quedan `null` («no declarado»), no `false`. No hay reglas de manejo: son
 * una decisión de cumplimiento (regla 97.5.4) y se registran como no declaradas.
 */
export const CLASSIFICATION_SEEDS: readonly ClassificationSeed[] = [
  {
    code: 'ANONYMIZED',
    name: 'Anonimizado',
    isPii: false,
    isPhi: false,
    basis: null,
  },
  { code: 'PUBLIC', name: 'Público', isPii: false, isPhi: false, basis: null },
  { code: 'INTERNAL', name: 'Interno', isPii: null, isPhi: null, basis: null },
  {
    code: 'PSEUDONYMIZED',
    name: 'Seudonimizado',
    isPii: null,
    isPhi: null,
    basis: null,
  },
  {
    code: 'PERSONAL',
    name: 'Dato personal',
    isPii: true,
    isPhi: false,
    basis: 'LGPD art. 5, I',
  },
  {
    code: 'PHI_IDENTIFIER',
    name: 'Identificador de salud (PHI)',
    isPii: true,
    isPhi: true,
    basis: 'HIPAA 45 CFR 164.514(b)(2)(i), identificadores A–R (Safe Harbor)',
  },
  {
    code: 'PHI_SENSITIVE',
    name: 'Dato clínico sensible (PHI)',
    isPii: true,
    isPhi: true,
    basis: '45 CFR 160.103 (información de salud protegida)',
  },
  {
    code: 'PHI_SPECIAL',
    name: 'Dato personal sensible especial',
    isPii: true,
    isPhi: true,
    basis: 'LGPD art. 11 (datos personales sensibles)',
  },
  {
    code: 'CREDENTIAL',
    name: 'Credencial o secreto',
    isPii: null,
    isPhi: null,
    basis: 'Contraseñas, tokens y secretos',
  },
];

export function planClassifications(now: Date): SeedRow[] {
  return CLASSIFICATION_SEEDS.map((c) => ({
    id: id('classification', c.code),
    code: c.code,
    name: c.name,
    rank: SENSITIVITY_RANK[c.code],
    is_pii: c.isPii,
    is_phi: c.isPhi,
    handling_rules_json: {
      declared: false,
      rules: [],
      basis: c.basis,
      note: 'Sin reglas de manejo declaradas: son una decisión de cumplimiento, no se infieren.',
      provenance: {
        seed: CATALOG_SEED_VERSION,
        source:
          'src/modules/data_catalog/domain/catalog/catalog.constants.ts (SENSITIVITIES)',
      },
    },
    state_concept_id: null,
    created_at: iso(now),
    updated_at: iso(now),
    created_by_user_id: SEED_ACTOR_ID,
    updated_by_user_id: SEED_ACTOR_ID,
    row_version: 1,
  }));
}

// ---- glosario --------------------------------------------------------------------------------

export interface GlossaryPlan {
  terms: SeedRow[];
  revisions: SeedRow[];
  /** Términos descartados por ser el mismo término con la misma definición. */
  duplicatesDropped: number;
  /** Términos que comparten nombre pero difieren en definición: se conservan con código por fuente. */
  ambiguousKept: number;
}

const repoOf = (source: string): string =>
  slug(source.split(':')[0] ?? 'FUENTE');

export function planGlossary(
  glossary: CatalogacionInventory['glossary'],
  now: Date,
): GlossaryPlan {
  const grupos = new Map<string, typeof glossary>();
  for (const t of glossary) {
    const code = slug(t.term) || 'TERMINO';
    grupos.set(code, [...(grupos.get(code) ?? []), t]);
  }
  const terms: SeedRow[] = [];
  const revisions: SeedRow[] = [];
  let duplicatesDropped = 0;
  let ambiguousKept = 0;
  for (const [base, lista] of [...grupos].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const distintos: typeof glossary = [];
    for (const t of lista) {
      if (distintos.some((d) => d.definition === t.definition))
        duplicatesDropped += 1;
      else distintos.push(t);
    }
    if (distintos.length > 1) ambiguousKept += distintos.length;
    const usados = new Set<string>();
    for (const t of distintos) {
      let code = distintos.length === 1 ? base : `${base}__${repoOf(t.source)}`;
      for (let n = 2; usados.has(code); n += 1)
        code = `${base}__${repoOf(t.source)}_${n}`;
      usados.add(code);
      const termId = id('glossary-term', code);
      const content = {
        name: t.term,
        definition: t.definition,
        source: t.source,
        relatedTables: t.relatedTables,
      };
      terms.push({
        id: termId,
        term_code: code,
        name: t.term,
        definition: t.definition,
        domain_id: null,
        synonyms: null,
        status: 'DRAFT',
        current_revision_no: 1,
        approved_revision_no: null,
        approved_by_user_id: null,
        approved_at: null,
        created_at: iso(now),
        updated_at: iso(now),
        created_by_user_id: SEED_ACTOR_ID,
        updated_by_user_id: SEED_ACTOR_ID,
        row_version: 1,
      });
      revisions.push({
        id: id('glossary-term-revision', `${code}:1`),
        term_id: termId,
        revision_no: 1,
        content_json: content,
        content_hash: sha(JSON.stringify(content)),
        change_reason: `Siembra de catalogación (${CATALOG_SEED_VERSION}): glosario del dominio, fuente ${t.source}. Borrador, sin aprobar.`,
        author_user_id: SEED_ACTOR_ID,
        created_at: iso(now),
      });
    }
  }
  return { terms, revisions, duplicatesDropped, ambiguousKept };
}

// ---- linaje ----------------------------------------------------------------------------------

const CONFIDENCE_RANK: Readonly<Record<string, number>> = {
  DIRECTA: 4,
  POR_SQL: 3,
  POR_TIPO: 2,
  POR_REGISTRO: 1,
};

export interface LineagePlan {
  edges: SeedRow[];
  /** Vínculos operación→tabla cuya tabla no está en el catálogo: no se siembran. */
  skippedUncataloged: number;
}

/**
 * Linaje endpoint → tabla desde el inventario. `is_official` queda en `false`: «oficial» es una
 * aprobación de una persona (`approved_by_user_id`), y el inventario es un análisis estático.
 */
export function planLineage(
  inventory: CatalogacionInventory,
  now: Date,
): LineagePlan {
  const catalogadas = new Set(inventory.tables.map((t) => t.id));
  const mejor = new Map<
    string,
    { op: string; table: string; access: string; confidence: string | null }
  >();
  let skippedUncataloged = 0;
  for (const op of inventory.operations)
    for (const t of op.tables) {
      const tableRef = `${t.schema}.${t.table}`;
      if (!catalogadas.has(tableRef)) {
        skippedUncataloged += 1;
        continue;
      }
      const key = `${op.id}|${tableRef}|${t.access}`;
      const previo = mejor.get(key);
      if (
        !previo ||
        (CONFIDENCE_RANK[t.confidence ?? ''] ?? 0) >
          (CONFIDENCE_RANK[previo.confidence ?? ''] ?? 0)
      )
        mejor.set(key, {
          op: op.id,
          table: tableRef,
          access: t.access,
          confidence: t.confidence,
        });
    }
  const edges = [...mejor.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, e]) => ({
      id: id('lineage-edge', key),
      source_kind: 'OPERATION',
      source_ref: e.op,
      target_kind: 'TABLE',
      target_ref: e.table,
      edge_kind: e.access,
      origin: 'INVENTORY',
      confidence: e.confidence,
      is_official: false,
      approved_by_user_id: null,
      approved_at: null,
      observation_status: 'OBSERVED',
      first_seen_at: iso(now),
      last_seen_at: iso(now),
      created_at: iso(now),
      updated_at: iso(now),
      created_by_user_id: SEED_ACTOR_ID,
      updated_by_user_id: SEED_ACTOR_ID,
      row_version: 1,
    }));
  return { edges, skippedUncataloged };
}

// ---- fichas de tabla y de columna ------------------------------------------------------------

export interface AnnotationPlan {
  annotations: SeedRow[];
  revisions: SeedRow[];
  evidence: SeedRow[];
  domainLinks: { objectKey: string; domainCode: string; objectId: string }[];
  stats: {
    tablesResolved: number;
    tablesUnresolved: number;
    columnsPlanned: number;
    columnsUnresolved: number;
    tableStatus: Record<string, number>;
    columnStatus: Record<string, number>;
  };
}

const text = (v: string | null): string | null => (v && v.trim() ? v : null);

const lista = (valores: Iterable<string>): string[] =>
  [...new Set(valores)].sort();

function provenanceOf(q: QualifiedText): Record<string, unknown> {
  return {
    quality: q.quality,
    source: q.source,
    reference: q.reference,
    reason: q.reason,
  };
}

function tableContent(
  a: TableAssessment,
  moduleByOperation: ReadonlyMap<string, string>,
): {
  content: AnnotationContent;
  provenance: Record<string, unknown>;
  status: 'DRAFT' | 'AUTO_DETECTED';
} {
  const { purpose, vault, table } = a;
  const questions: OpenQuestion[] = [];
  const provenance: Record<string, unknown> = {};
  const usaBoveda = purpose.source === 'NOTA_BOVEDA';
  const purposeText = purpose.quality === 'CURADA' ? purpose.text : null;
  if (purposeText) provenance.purpose = provenanceOf(purpose);
  else {
    questions.push({
      field: 'purpose',
      question:
        purpose.quality === 'PLANTILLA'
          ? 'El comentario del modelo es una plantilla repetida en varias tablas: redactar el propósito real de esta tabla.'
          : 'Sin comentario del modelo ni nota propia en la bóveda: redactar el propósito de esta tabla.',
    });
    provenance.purpose = provenanceOf(purpose);
  }
  const definition = !usaBoveda ? text(vault?.business ?? null) : null;
  if (definition)
    provenance.definition = {
      quality: 'CURADA',
      source: 'NOTA_BOVEDA',
      reference: vault?.reference ?? null,
      reason: 'Nota propia de la bóveda (no es plantilla de la bóveda)',
    };
  const existence = text(vault?.existence ?? null);
  if (existence)
    provenance.existenceRationale = {
      quality: 'CURADA',
      source: 'NOTA_BOVEDA',
      reference: vault?.reference ?? null,
      reason: 'Nota propia de la bóveda (no es plantilla de la bóveda)',
    };
  else
    questions.push({
      field: 'existenceRationale',
      question:
        'Sin fuente: la bóveda sólo trae texto de plantilla. Redactar por qué hace falta esta tabla y qué se pierde sin ella.',
    });
  questions.push({
    field: 'rowGrain',
    question:
      'Sin fuente: ninguna fuente del inventario declara qué representa una fila. Redactarlo.',
  });
  questions.push({
    field: 'businessOwner',
    question:
      'Sin responsable asignado: lo decide el gobierno de datos, no se infiere del módulo.',
  });
  questions.push({
    field: 'sensitivity',
    question:
      'La sensibilidad de la tabla no se clasifica en bloque; las columnas con regla del clasificador llevan su propuesta.',
  });
  const writers = lista(
    table.operations
      .filter((o) => o.access !== 'LEE')
      .map((o) => moduleByOperation.get(o.operationId) ?? ''),
  ).filter(Boolean);
  const readers = lista(
    table.operations
      .filter((o) => o.access === 'LEE')
      .map((o) => moduleByOperation.get(o.operationId) ?? ''),
  ).filter(Boolean);
  provenance.producers = {
    quality: 'AUTO_DETECTADA',
    source: 'ESTRUCTURA_DDL',
    reference: tableSystemReference(table),
    reason:
      'Módulos con una operación HTTP que escribe o borra en la tabla (no incluye workers, seeds ni jobs)',
  };
  const content: AnnotationContent = {
    ...EMPTY_CONTENT,
    definition,
    purpose: purposeText,
    existenceRationale: existence,
    producers: writers,
    consumers: readers,
    openQuestions: questions,
  };
  const humana = Boolean(purposeText || definition || existence);
  return { content, provenance, status: humana ? 'DRAFT' : 'AUTO_DETECTED' };
}

function columnContent(c: ColumnAssessment): {
  content: AnnotationContent;
  provenance: Record<string, unknown>;
  status: 'DRAFT' | 'AUTO_DETECTED' | 'NEEDS_REVIEW';
  origin: 'MANUAL' | 'AUTO_CLASSIFIER';
} | null {
  const negocio =
    c.business.quality === 'CURADA' || c.business.quality === 'AUTO_DETECTADA';
  const propuesta = c.sensitivity;
  if (!negocio && !propuesta) return null;
  const questions: OpenQuestion[] = [];
  if (!negocio)
    questions.push({
      field: 'definition',
      question:
        c.business.quality === 'PLANTILLA'
          ? 'El texto del modelo/JSDoc es una plantilla repetida: redactar qué significa esta columna.'
          : 'Sin comentario del modelo ni JSDoc: redactar qué significa esta columna.',
    });
  if (propuesta?.status === 'NEEDS_REVIEW')
    questions.push({
      field: 'sensitivity',
      question: `Sensibilidad propuesta por la regla ${propuesta.ruleId} con confianza ${propuesta.confidence}: confirmarla.`,
    });
  const content: AnnotationContent = {
    ...EMPTY_CONTENT,
    definition: negocio ? c.business.text : null,
    sensitivity: propuesta?.level ?? 'UNKNOWN',
    openQuestions: questions,
  };
  const curada = c.business.quality === 'CURADA';
  const status = curada
    ? 'DRAFT'
    : propuesta?.status === 'NEEDS_REVIEW'
      ? 'NEEDS_REVIEW'
      : 'AUTO_DETECTED';
  return {
    content,
    provenance: {
      definition: provenanceOf(c.business),
      ...(propuesta
        ? {
            sensitivity: {
              quality: 'AUTO_DETECTADA',
              source: 'REGLA_DETERMINISTA',
              reference: propuesta.ruleId,
              reason: propuesta.basis,
            },
          }
        : {}),
    },
    status,
    origin: curada ? 'MANUAL' : 'AUTO_CLASSIFIER',
  };
}

function annotationRow(args: {
  annotationId: string;
  targetKind: 'OBJECT' | 'COLUMN';
  objectId: string;
  columnId: string | null;
  content: AnnotationContent;
  status: string;
  origin: string;
  now: Date;
}): SeedRow {
  const c = args.content;
  return {
    id: args.annotationId,
    target_kind: args.targetKind,
    object_id: args.objectId,
    column_id: args.columnId,
    business_name: c.businessName,
    definition: c.definition,
    purpose: c.purpose,
    existence_rationale: c.existenceRationale,
    row_grain: c.rowGrain,
    alternatives_rationale: c.alternativesRationale,
    process_supported: c.processSupported,
    source_of_truth: c.sourceOfTruth,
    producers: c.producers,
    consumers: c.consumers,
    deletion_impact: c.deletionImpact,
    business_owner: c.businessOwner,
    data_steward: c.dataSteward,
    technical_owner: c.technicalOwner,
    unit: c.unit,
    value_domain: c.valueDomain,
    null_semantics: c.nullSemantics,
    sensitivity: c.sensitivity,
    open_questions: c.openQuestions,
    review_status: args.status,
    origin: args.origin,
    current_revision_no: 1,
    approved_revision_no: null,
    created_at: iso(args.now),
    updated_at: iso(args.now),
    created_by_user_id: SEED_ACTOR_ID,
    updated_by_user_id: SEED_ACTOR_ID,
    row_version: 1,
  };
}

function revisionRow(args: {
  annotationId: string;
  content: AnnotationContent;
  provenance: Record<string, unknown>;
  status: string;
  origin: string;
  reason: string;
  classification?: Record<string, unknown>;
  now: Date;
}): SeedRow {
  return {
    id: id('annotation-revision', `${args.annotationId}:1`),
    annotation_id: args.annotationId,
    revision_no: 1,
    content_json: {
      ...args.content,
      provenance: { seed: CATALOG_SEED_VERSION, fields: args.provenance },
      ...(args.classification ? { classification: args.classification } : {}),
    },
    content_hash: contentHash(args.content),
    origin: args.origin,
    submitted_status: args.status,
    change_reason: args.reason,
    author_user_id: SEED_ACTOR_ID,
    created_at: iso(args.now),
  };
}

function evidenceRow(args: {
  objectId: string;
  columnId: string | null;
  kind: string;
  reference: string;
  excerpt: string;
  now: Date;
}): SeedRow {
  const revision = `sha256:${sha(args.excerpt).slice(0, 12)}`;
  return {
    id: id(
      'evidence',
      `${args.objectId}:${args.columnId ?? ''}:${args.kind}:${args.reference}:${revision}`,
    ),
    object_id: args.objectId,
    column_id: args.columnId,
    kind: args.kind,
    reference: args.reference,
    excerpt:
      args.excerpt.length > 2000
        ? `${args.excerpt.slice(0, 1999)}…`
        : args.excerpt,
    source_revision: revision,
    added_by_user_id: SEED_ACTOR_ID,
    created_at: iso(args.now),
  };
}

export function planAnnotations(args: {
  inventory: CatalogacionInventory;
  vault: VaultDataset;
  objects: ObjectIndex;
  context: QualityContext;
  now: Date;
}): AnnotationPlan {
  const { inventory, vault, objects, context, now } = args;
  const moduleByOperation = new Map(
    inventory.operations.map((o) => [o.id, o.module]),
  );
  const plan: AnnotationPlan = {
    annotations: [],
    revisions: [],
    evidence: [],
    domainLinks: [],
    stats: {
      tablesResolved: 0,
      tablesUnresolved: 0,
      columnsPlanned: 0,
      columnsUnresolved: 0,
      tableStatus: {},
      columnStatus: {},
    },
  };
  const cuenta = (m: Record<string, number>, k: string): void => {
    m[k] = (m[k] ?? 0) + 1;
  };
  for (const table of inventory.tables) {
    const objeto = objects.get(table.id);
    const a = assessTable(table, context, vault.tables[table.id] ?? null);
    const columnas = a.columns
      .map((c) => ({ c, built: columnContent(c) }))
      .filter((x) => x.built !== null);
    if (!objeto) {
      plan.stats.tablesUnresolved += 1;
      plan.stats.columnsUnresolved += columnas.length;
      continue;
    }
    plan.stats.tablesResolved += 1;
    const t = tableContent(a, moduleByOperation);
    const annotationId = id('annotation', `OBJECT:${table.id}`);
    plan.annotations.push(
      annotationRow({
        annotationId,
        targetKind: 'OBJECT',
        objectId: objeto.id,
        columnId: null,
        content: t.content,
        status: t.status,
        origin: t.status === 'DRAFT' ? 'MANUAL' : 'AUTO_CLASSIFIER',
        now,
      }),
    );
    plan.revisions.push(
      revisionRow({
        annotationId,
        content: t.content,
        provenance: t.provenance,
        status: t.status,
        origin: t.status === 'DRAFT' ? 'MANUAL' : 'AUTO_CLASSIFIER',
        reason: `Siembra de catalogación (${CATALOG_SEED_VERSION}): ficha de ${table.id} desde el inventario y la bóveda. Borrador, sin aprobar.`,
        now,
      }),
    );
    cuenta(plan.stats.tableStatus, t.status);
    plan.evidence.push(
      evidenceRow({
        objectId: objeto.id,
        columnId: null,
        kind: 'CODE_REFERENCE',
        reference: tableSystemReference(table),
        excerpt: a.system,
        now,
      }),
    );
    if (
      a.purpose.quality === 'CURADA' &&
      a.purpose.source === 'COMENTARIO_MODELO' &&
      a.purpose.text
    )
      plan.evidence.push(
        evidenceRow({
          objectId: objeto.id,
          columnId: null,
          kind: 'SCHEMA_COMMENT',
          reference: a.purpose.reference ?? table.id,
          excerpt: a.purpose.text,
          now,
        }),
      );
    if (a.vault)
      plan.evidence.push(
        evidenceRow({
          objectId: objeto.id,
          columnId: null,
          kind: 'VAULT_NOTE',
          reference: a.vault.reference,
          excerpt: [
            a.vault.business && `Negocio: ${a.vault.business}`,
            a.vault.example && `Ejemplo concreto: ${a.vault.example}`,
            a.vault.existence &&
              `Por qué no debe eliminarse: ${a.vault.existence}`,
          ]
            .filter(Boolean)
            .join('\n'),
          now,
        }),
      );
    if (table.domain)
      plan.domainLinks.push({
        objectKey: table.id,
        objectId: objeto.id,
        domainCode: domainCode(table.domain.name),
      });
    for (const { c, built } of columnas) {
      if (!built) continue;
      const columnId = objeto.columns.get(c.column.name);
      if (!columnId) {
        plan.stats.columnsUnresolved += 1;
        continue;
      }
      const colAnnotationId = id(
        'annotation',
        `COLUMN:${table.id}.${c.column.name}`,
      );
      plan.annotations.push(
        annotationRow({
          annotationId: colAnnotationId,
          targetKind: 'COLUMN',
          objectId: objeto.id,
          columnId,
          content: built.content,
          status: built.status,
          origin: built.origin,
          now,
        }),
      );
      plan.revisions.push(
        revisionRow({
          annotationId: colAnnotationId,
          content: built.content,
          provenance: built.provenance,
          status: built.status,
          origin: built.origin,
          reason: `Siembra de catalogación (${CATALOG_SEED_VERSION}): ${table.id}.${c.column.name}. ${built.status === 'DRAFT' ? 'Borrador, sin aprobar.' : 'Detectada por regla determinista, sin curar.'}`,
          classification: c.sensitivity
            ? {
                confidence: c.sensitivity.confidence,
                classifiedBy: CLASSIFIED_BY,
                ruleId: c.sensitivity.ruleId,
                basis: c.sensitivity.basis,
              }
            : undefined,
          now,
        }),
      );
      plan.stats.columnsPlanned += 1;
      cuenta(plan.stats.columnStatus, built.status);
    }
  }
  return plan;
}

// ---- todo junto ------------------------------------------------------------------------------

export interface CatalogSeedPlan {
  domains: SeedRow[];
  classifications: SeedRow[];
  glossary: GlossaryPlan;
  lineage: LineagePlan;
  annotations: AnnotationPlan;
}

export function buildCatalogSeedPlan(args: {
  inventory: CatalogacionInventory;
  vault: VaultDataset;
  objects: ObjectIndex;
  now: Date;
}): CatalogSeedPlan {
  const context = buildQualityContext(args.inventory);
  return {
    domains: planDomains(args.inventory.tables, args.now),
    classifications: planClassifications(args.now),
    glossary: planGlossary(args.inventory.glossary, args.now),
    lineage: planLineage(args.inventory, args.now),
    annotations: planAnnotations({ ...args, context }),
  };
}
