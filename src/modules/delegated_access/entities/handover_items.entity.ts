import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Registro del traspaso de trabajo de quien se va: conversaciones, tareas, cuentas supervisadas y citas pendientes (sin datos del paciente).
 */
@Entity({ schema: 'delegated_access', tableName: 'handover_items' })
export class HandoverItems {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `lifecycle_case_id`. */
  @Property({ fieldName: 'lifecycle_case_id', type: 'uuid' }) // FK → delegated_access.lifecycle_cases
  lifecycleCaseId!: string;

  /** Columna `item_kind_concept_id`. */
  @Property({ fieldName: 'item_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  itemKindConceptId!: string;

  /** Columna `source_id`. */
  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK → varios (según el tipo de ítem)
  sourceId!: string;

  /** Columna `from_user_id`. */
  @Property({ fieldName: 'from_user_id', type: 'uuid' }) // FK → iam.users
  fromUserId!: string;

  /** Columna `to_user_id`. */
  @Property({ fieldName: 'to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  toUserId?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `summary_text`. */
  @Property({
    fieldName: 'summary_text',
    columnType: 'varchar',
    nullable: true,
  })
  summaryText?: string;

  /** Columna `reassigned_at`. */
  @Property({
    fieldName: 'reassigned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reassignedAt?: Date;

  /** Columna `reassigned_by_user_id`. */
  @Property({
    fieldName: 'reassigned_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  reassignedByUserId?: string;

  /** Columna `note_text`. */
  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
