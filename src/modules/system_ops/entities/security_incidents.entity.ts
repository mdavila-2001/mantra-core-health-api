import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `security_incidents`.
 */
@Entity({ schema: 'system_ops', tableName: 'security_incidents' })
export class SecurityIncidents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a vector concept.
   */
  @Property({ fieldName: 'vector_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  vectorConceptId?: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  /**
   * Valor de contained at mantenido por la instancia.
   */
  @Property({
    fieldName: 'contained_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  containedAt?: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Valor de affected records estimate mantenido por la instancia.
   */
  @Property({
    fieldName: 'affected_records_estimate',
    type: 'bigint',
    nullable: true,
  })
  affectedRecordsEstimate?: string;

  /**
   * Valor de is reportable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_reportable', type: 'boolean', nullable: true })
  isReportable?: boolean;

  /**
   * Identificador asociado a assigned to user.
   */
  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  /**
   * Identificador asociado a data classification.
   */
  @Property({
    fieldName: 'data_classification_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.data_classifications
  dataClassificationId?: string;

  /**
   * Valor de summary mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  summary?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
