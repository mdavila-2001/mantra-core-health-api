import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_providers`.
 */
@Entity({ schema: 'auth_providers', tableName: 'identity_providers' })
export class IdentityProviders {
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
   * Identificador asociado a protocol concept.
   */
  @Property({ fieldName: 'protocol_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  protocolConceptId!: string;

  /**
   * Identificador asociado a provider category concept.
   */
  @Property({ fieldName: 'provider_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerCategoryConceptId!: string;

  /**
   * Valor de issuer mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  issuer?: string;

  /**
   * Identificador asociado a logo file.
   */
  @Property({ fieldName: 'logo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  logoFileId?: string;

  /**
   * Valor de is global mantenido por la instancia.
   */
  @Property({ fieldName: 'is_global', type: 'boolean', nullable: true })
  isGlobal?: boolean;

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
