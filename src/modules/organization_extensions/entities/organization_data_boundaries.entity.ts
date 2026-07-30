import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `organization_data_boundaries`.
 */
@Entity({
  schema: 'organization_extensions',
  tableName: 'organization_data_boundaries',
})
export class OrganizationDataBoundaries {
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
   * Identificador asociado a boundary type concept.
   */
  @Property({ fieldName: 'boundary_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  boundaryTypeConceptId!: string;

  /**
   * Identificador asociado a data controller tenant.
   */
  @Property({ fieldName: 'data_controller_tenant_id', type: 'uuid' }) // FK → directory.tenants
  dataControllerTenantId!: string;

  /**
   * Identificador asociado a data processor tenant.
   */
  @Property({
    fieldName: 'data_processor_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  dataProcessorTenantId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a residency region concept.
   */
  @Property({
    fieldName: 'residency_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  residencyRegionConceptId?: string;

  /**
   * Identificador asociado a allowed purpose value set.
   */
  @Property({
    fieldName: 'allowed_purpose_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedPurposeValueSetId?: string;

  /**
   * Valor de isolation schema name mantenido por la instancia.
   */
  @Property({
    fieldName: 'isolation_schema_name',
    columnType: 'varchar',
    nullable: true,
  })
  isolationSchemaName?: string;

  /**
   * Valor de isolation policy version mantenido por la instancia.
   */
  @Property({
    fieldName: 'isolation_policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  isolationPolicyVersion?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
