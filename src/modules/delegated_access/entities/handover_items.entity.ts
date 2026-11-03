import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `handover_items`.
 */
@Entity({ schema: 'delegated_access', tableName: 'handover_items' })
export class HandoverItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a lifecycle case.
   */
  @Property({ fieldName: 'lifecycle_case_id', type: 'uuid' }) // FK → delegated_access.lifecycle_cases (inferida)
  lifecycleCaseId!: string;

  /**
   * Identificador asociado a item kind concept.
   */
  @Property({ fieldName: 'item_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  itemKindConceptId!: string;

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' })
  sourceId!: string;

  /**
   * Identificador asociado a from user.
   */
  @Property({ fieldName: 'from_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  fromUserId!: string;

  /**
   * Identificador asociado a to user.
   */
  @Property({ fieldName: 'to_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  toUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de summary text mantenido por la instancia.
   */
  @Property({
    fieldName: 'summary_text',
    columnType: 'varchar',
    nullable: true,
  })
  summaryText?: string;

  /**
   * Valor de reassigned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reassigned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reassignedAt?: Date;

  /**
   * Identificador asociado a reassigned by user.
   */
  @Property({
    fieldName: 'reassigned_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users (inferida)
  reassignedByUserId?: string;

  /**
   * Valor de note text mantenido por la instancia.
   */
  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
