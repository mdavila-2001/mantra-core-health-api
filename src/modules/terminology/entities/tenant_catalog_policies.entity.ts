import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_catalog_policies`.
 */
@Entity({ schema: 'terminology', tableName: 'tenant_catalog_policies' })
export class TenantCatalogPolicies {
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
   * Identificador asociado a value set.
   */
  @Property({ fieldName: 'value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  valueSetId!: string;

  /**
   * Identificador asociado a mode concept.
   */
  @Property({ fieldName: 'mode_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modeConceptId?: string;

  /**
   * Valor de allow subset mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_subset', type: 'boolean', nullable: true })
  allowSubset?: boolean;

  /**
   * Valor de allow alias mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_alias', type: 'boolean', nullable: true })
  allowAlias?: boolean;

  /**
   * Valor de allow local concepts mantenido por la instancia.
   */
  @Property({
    fieldName: 'allow_local_concepts',
    type: 'boolean',
    nullable: true,
  })
  allowLocalConcepts?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
