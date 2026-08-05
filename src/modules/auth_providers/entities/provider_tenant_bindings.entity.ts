import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_tenant_bindings`.
 */
@Entity({ schema: 'auth_providers', tableName: 'provider_tenant_bindings' })
export class ProviderTenantBindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean' })
  isEnabled!: boolean;

  /**
   * Valor de auto provision mantenido por la instancia.
   */
  @Property({ fieldName: 'auto_provision', type: 'boolean', nullable: true })
  autoProvision?: boolean;

  /**
   * Identificador asociado a default role concept.
   */
  @Property({
    fieldName: 'default_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultRoleConceptId?: string;

  /**
   * Valor de allowed email domains mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_email_domains',
    columnType: 'varchar',
    nullable: true,
  })
  allowedEmailDomains?: string;

  /**
   * Valor de just in time provisioning mantenido por la instancia.
   */
  @Property({
    fieldName: 'just_in_time_provisioning',
    type: 'boolean',
    nullable: true,
  })
  justInTimeProvisioning?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
