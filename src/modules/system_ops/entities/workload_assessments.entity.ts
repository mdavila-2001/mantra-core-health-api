import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `workload_assessments`.
 */
@Entity({ schema: 'system_ops', tableName: 'workload_assessments' })
export class WorkloadAssessments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a operational framework.
   */
  @Property({ fieldName: 'operational_framework_id', type: 'uuid' }) // FK → system_ops.operational_frameworks
  operationalFrameworkId!: string;

  /**
   * Valor de workload code mantenido por la instancia.
   */
  @Property({ fieldName: 'workload_code', columnType: 'varchar' })
  workloadCode!: string;

  /**
   * Valor de workload name mantenido por la instancia.
   */
  @Property({ fieldName: 'workload_name', columnType: 'varchar' })
  workloadName!: string;

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components
  serviceComponentId?: string;

  /**
   * Identificador asociado a assessment type concept.
   */
  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de assessment period start mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessment_period_start',
    columnType: 'date',
    nullable: true,
  })
  assessmentPeriodStart?: Date;

  /**
   * Valor de assessment period end mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessment_period_end',
    columnType: 'date',
    nullable: true,
  })
  assessmentPeriodEnd?: Date;

  /**
   * Identificador asociado a facilitator user.
   */
  @Property({ fieldName: 'facilitator_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  facilitatorUserId?: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Valor de summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

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
