import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `laboratory_work_orders`.
 */
@Entity({ schema: 'diagnostics', tableName: 'laboratory_work_orders' })
export class LaboratoryWorkOrders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a laboratory accession.
   */
  @Property({ fieldName: 'laboratory_accession_id', type: 'uuid' }) // FK → diagnostics.laboratory_accessions
  laboratoryAccessionId!: string;

  /**
   * Valor de work order number mantenido por la instancia.
   */
  @Property({ fieldName: 'work_order_number', columnType: 'varchar' })
  workOrderNumber!: string;

  /**
   * Identificador asociado a assigned laboratory unit.
   */
  @Property({
    fieldName: 'assigned_laboratory_unit_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_units
  assignedLaboratoryUnitId?: string;

  /**
   * Identificador asociado a assigned profile.
   */
  @Property({ fieldName: 'assigned_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  assignedProfileId?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  priorityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

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
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

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
