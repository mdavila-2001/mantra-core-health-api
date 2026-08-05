import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_web_configs`.
 */
@Entity({ schema: 'directory', tableName: 'tenant_web_configs' })
export class TenantWebConfigs {
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
   * Valor de domain mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  domain!: string;

  /**
   * Valor de subdomain mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  subdomain?: string;

  /**
   * Identificador asociado a primary language concept.
   */
  @Property({
    fieldName: 'primary_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  primaryLanguageConceptId?: string;

  /**
   * Valor de supported languages json mantenido por la instancia.
   */
  @Property({
    fieldName: 'supported_languages_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  supportedLanguagesJson?: unknown;

  /**
   * Valor de locale mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  locale?: string;

  /**
   * Valor de build language mantenido por la instancia.
   */
  @Property({
    fieldName: 'build_language',
    columnType: 'varchar',
    nullable: true,
  })
  buildLanguage?: string;

  /**
   * Valor de framework mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  framework?: string;

  /**
   * Valor de theme json mantenido por la instancia.
   */
  @Property({
    fieldName: 'theme_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  themeJson?: unknown;

  /**
   * Valor de ssl enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'ssl_enabled', type: 'boolean', nullable: true })
  sslEnabled?: boolean;

  /**
   * Valor de is published mantenido por la instancia.
   */
  @Property({ fieldName: 'is_published', type: 'boolean', nullable: true })
  isPublished?: boolean;

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
