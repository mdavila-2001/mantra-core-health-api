import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_source_systems`.
 */
@Entity({ schema: 'health_data', tableName: 'health_source_systems' })
export class HealthSourceSystems {
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
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a organization.
   */
  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  /**
   * Valor de vendor name mantenido por la instancia.
   */
  @Property({ fieldName: 'vendor_name', columnType: 'varchar', nullable: true })
  vendorName?: string;

  /**
   * Valor de product name mantenido por la instancia.
   */
  @Property({
    fieldName: 'product_name',
    columnType: 'varchar',
    nullable: true,
  })
  productName?: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  version?: string;

  /**
   * Valor de base url mantenido por la instancia.
   */
  @Property({ fieldName: 'base_url', columnType: 'varchar', nullable: true })
  baseUrl?: string;

  /**
   * Identificador asociado a trust level concept.
   */
  @Property({ fieldName: 'trust_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  trustLevelConceptId!: string;

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
