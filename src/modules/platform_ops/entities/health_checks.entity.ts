import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_checks`.
 */
@Entity({ schema: 'platform_ops', tableName: 'health_checks' })
export class HealthChecks {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a check type concept.
   */
  @Property({ fieldName: 'check_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checkTypeConceptId!: string;

  /**
   * Identificador asociado a target kind concept.
   */
  @Property({ fieldName: 'target_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetKindConceptId!: string;

  /**
   * Valor de target ref mantenido por la instancia.
   */
  @Property({ fieldName: 'target_ref', columnType: 'text', nullable: true })
  targetRef?: string;

  /**
   * Valor de expected result mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_result',
    columnType: 'text',
    nullable: true,
  })
  expectedResult?: string;

  /**
   * Valor de interval seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  intervalSeconds?: number;

  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  /**
   * Valor de healthy threshold mantenido por la instancia.
   */
  @Property({
    fieldName: 'healthy_threshold',
    columnType: 'int',
    nullable: true,
  })
  healthyThreshold?: number;

  /**
   * Valor de unhealthy threshold mantenido por la instancia.
   */
  @Property({
    fieldName: 'unhealthy_threshold',
    columnType: 'int',
    nullable: true,
  })
  unhealthyThreshold?: number;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
