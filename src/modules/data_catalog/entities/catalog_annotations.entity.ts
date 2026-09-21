import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Ficha de negocio vigente de una tabla o columna
 * (`data_catalog.catalog_annotations`): por qué existe, qué significa una
 * fila, quién responde por ella y en qué estado de revisión está.
 *
 * Es la proyección de la última revisión. El historial completo, incluido el
 * contenido aprobado cuando hay una revisión nueva pendiente, vive en
 * `catalog_annotation_revisions`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_annotations' })
export class CatalogAnnotations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** OBJECT | COLUMN. */
  @Property({ fieldName: 'target_kind', columnType: 'varchar' })
  targetKind!: string;

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /** Sólo en fichas de columna. */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  @Property({
    fieldName: 'business_name',
    columnType: 'varchar',
    nullable: true,
  })
  businessName?: string;

  @Property({ columnType: 'text', nullable: true })
  definition?: string;

  @Property({ columnType: 'text', nullable: true })
  purpose?: string;

  /** Por qué hace falta persistencia propia y no una vista o un cálculo. */
  @Property({
    fieldName: 'existence_rationale',
    columnType: 'text',
    nullable: true,
  })
  existenceRationale?: string;

  /** Qué representa exactamente una fila y cuál es su identidad. */
  @Property({ fieldName: 'row_grain', columnType: 'text', nullable: true })
  rowGrain?: string;

  /** Por qué no se resuelve con una vista, un cálculo o una tabla existente. */
  @Property({
    fieldName: 'alternatives_rationale',
    columnType: 'text',
    nullable: true,
  })
  alternativesRationale?: string;

  @Property({
    fieldName: 'process_supported',
    columnType: 'text',
    nullable: true,
  })
  processSupported?: string;

  @Property({
    fieldName: 'source_of_truth',
    columnType: 'text',
    nullable: true,
  })
  sourceOfTruth?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  producers?: unknown;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  consumers?: unknown;

  /** Consecuencia conocida de eliminar, alterar o retrasar estos datos. */
  @Property({
    fieldName: 'deletion_impact',
    columnType: 'text',
    nullable: true,
  })
  deletionImpact?: string;

  @Property({
    fieldName: 'business_owner',
    columnType: 'varchar',
    nullable: true,
  })
  businessOwner?: string;

  @Property({
    fieldName: 'data_steward',
    columnType: 'varchar',
    nullable: true,
  })
  dataSteward?: string;

  @Property({
    fieldName: 'technical_owner',
    columnType: 'varchar',
    nullable: true,
  })
  technicalOwner?: string;

  /** Unidad, moneda o zona horaria (columnas). */
  @Property({ columnType: 'varchar', nullable: true })
  unit?: string;

  @Property({ fieldName: 'value_domain', columnType: 'text', nullable: true })
  valueDomain?: string;

  /** Qué significa null, vacío o cero en esta columna. */
  @Property({ fieldName: 'null_semantics', columnType: 'text', nullable: true })
  nullSemantics?: string;

  /** UNKNOWN | NONE | INTERNAL | PII | PHI | SECRET. UNKNOWN ≠ NONE. */
  @Property({ columnType: 'varchar' })
  sensitivity!: string;

  /** Deuda declarada: preguntas sin responder, con campo, responsable y plazo. */
  @Property({
    fieldName: 'open_questions',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  openQuestions?: unknown;

  /** DRAFT | NEEDS_REVIEW | APPROVED | REJECTED, de la revisión vigente. */
  @Property({ fieldName: 'review_status', columnType: 'varchar' })
  reviewStatus!: string;

  /** MANUAL | IMPORTED_VAULT | AI_SUGGESTED, de la revisión vigente. */
  @Property({ columnType: 'varchar' })
  origin!: string;

  @Property({ fieldName: 'current_revision_no', columnType: 'int' })
  currentRevisionNo!: number;

  /** Última revisión aprobada; puede quedar detrás de la vigente. */
  @Property({
    fieldName: 'approved_revision_no',
    columnType: 'int',
    nullable: true,
  })
  approvedRevisionNo?: number;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión que el cliente envía como `expectedVersion`. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
