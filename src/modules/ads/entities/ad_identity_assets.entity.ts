import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_identity_assets`.
 */
@Entity({ schema: 'ads', tableName: 'ad_identity_assets' })
export class AdIdentityAssets {
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
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Identificador asociado a identity type concept.
   */
  @Property({ fieldName: 'identity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identityTypeConceptId!: string;

  /**
   * Identificador asociado a external identity.
   */
  @Property({ fieldName: 'external_identity_id', columnType: 'varchar' })
  externalIdentityId!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Valor de username mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  username?: string;

  /**
   * Valor de profile url mantenido por la instancia.
   */
  @Property({ fieldName: 'profile_url', columnType: 'varchar', nullable: true })
  profileUrl?: string;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

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
