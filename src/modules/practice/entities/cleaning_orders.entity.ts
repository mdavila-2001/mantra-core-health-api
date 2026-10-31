import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cleaning_orders`.
 */
@Entity({ schema: 'practice', tableName: 'cleaning_orders' })
export class CleaningOrders {
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
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units (inferida)
  clinicalUnitId?: string;

  /**
   * Identificador asociado a cleaning type concept.
   */
  @Property({ fieldName: 'cleaning_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  cleaningTypeConceptId!: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  triggerConceptId!: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  /**
   * Identificador asociado a previous order.
   */
  @Property({ fieldName: 'previous_order_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  previousOrderId?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  priorityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Identificador asociado a assigned user.
   */
  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  assignedUserId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Identificador asociado a started by user.
   */
  @Property({ fieldName: 'started_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  startedByUserId?: string;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Identificador asociado a finished by user.
   */
  @Property({ fieldName: 'finished_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  finishedByUserId?: string;

  /**
   * Valor de inspected at mantenido por la instancia.
   */
  @Property({
    fieldName: 'inspected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  inspectedAt?: Date;

  /**
   * Identificador asociado a inspected by user.
   */
  @Property({ fieldName: 'inspected_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  inspectedByUserId?: string;

  /**
   * Identificador asociado a inspection result concept.
   */
  @Property({
    fieldName: 'inspection_result_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  inspectionResultConceptId?: string;

  /**
   * Valor de rejection reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'rejection_reason',
    columnType: 'varchar',
    nullable: true,
  })
  rejectionReason?: string;

  /**
   * Valor de cancel reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancel_reason',
    columnType: 'varchar',
    nullable: true,
  })
  cancelReason?: string;

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
