import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `system_contexts`.
 */
@Entity({ schema: 'system_context', tableName: 'system_contexts' })
export class SystemContexts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

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
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a context type concept.
   */
  @Property({ fieldName: 'context_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contextTypeConceptId!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @Property({ fieldName: 'scope_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeTypeConceptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  /**
   * Identificador asociado a locale concept.
   */
  @Property({ fieldName: 'locale_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  localeConceptId?: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → system_context.system_context_versions
  currentVersionId?: string;

  /**
   * Identificador asociado a refresh policy concept.
   */
  @Property({
    fieldName: 'refresh_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  refreshPolicyConceptId?: string;

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
