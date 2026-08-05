import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `extension_target_policies`.
 */
@Entity({ schema: 'forms', tableName: 'extension_target_policies' })
export class ExtensionTargetPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a target resource concept.
   */
  @Property({ fieldName: 'target_resource_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetResourceConceptId!: string;

  /**
   * Identificador asociado a definition set.
   */
  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK → forms.field_definition_sets
  definitionSetId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

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
   * Valor de allow tenant fields mantenido por la instancia.
   */
  @Property({
    fieldName: 'allow_tenant_fields',
    type: 'boolean',
    nullable: true,
  })
  allowTenantFields?: boolean;

  /**
   * Valor de allow vendor fields mantenido por la instancia.
   */
  @Property({
    fieldName: 'allow_vendor_fields',
    type: 'boolean',
    nullable: true,
  })
  allowVendorFields?: boolean;

  /**
   * Valor de maximum fields mantenido por la instancia.
   */
  @Property({ fieldName: 'maximum_fields', columnType: 'int', nullable: true })
  maximumFields?: number;

  /**
   * Valor de maximum payload bytes mantenido por la instancia.
   */
  @Property({
    fieldName: 'maximum_payload_bytes',
    columnType: 'int',
    nullable: true,
  })
  maximumPayloadBytes?: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
