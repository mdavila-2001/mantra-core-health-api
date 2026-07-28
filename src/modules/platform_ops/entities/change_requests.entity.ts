import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `change_requests`.
 */
@Entity({ schema: 'platform_ops', tableName: 'change_requests' })
export class ChangeRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Identificador asociado a deployment.
   */
  @Property({ fieldName: 'deployment_id', type: 'uuid', nullable: true }) // FK → platform_ops.deployments
  deploymentId?: string;

  /**
   * Valor de change number mantenido por la instancia.
   */
  @Property({ fieldName: 'change_number', columnType: 'varchar' })
  changeNumber!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a change type concept.
   */
  @Property({ fieldName: 'change_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  changeTypeConceptId!: string;

  /**
   * Identificador asociado a risk level concept.
   */
  @Property({ fieldName: 'risk_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskLevelConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  /**
   * Valor de planned start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedStartAt?: Date;

  /**
   * Valor de planned end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedEndAt?: Date;

  /**
   * Valor de rollback plan text mantenido por la instancia.
   */
  @Property({
    fieldName: 'rollback_plan_text',
    columnType: 'text',
    nullable: true,
  })
  rollbackPlanText?: string;

  /**
   * Valor de validation plan text mantenido por la instancia.
   */
  @Property({
    fieldName: 'validation_plan_text',
    columnType: 'text',
    nullable: true,
  })
  validationPlanText?: string;

  /**
   * Identificador asociado a maintenance window.
   */
  @Property({
    fieldName: 'maintenance_window_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.maintenance_windows
  maintenanceWindowId?: string;

  /**
   * Valor de implemented at mantenido por la instancia.
   */
  @Property({
    fieldName: 'implemented_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  implementedAt?: Date;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
