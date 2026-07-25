import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_web_configs' })
export class TenantWebConfigs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  domain!: string;

  @Property({ columnType: 'varchar', nullable: true })
  subdomain?: string;

  @Property({
    fieldName: 'primary_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  primaryLanguageConceptId?: string;

  @Property({
    fieldName: 'supported_languages_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  supportedLanguagesJson?: unknown;

  @Property({ columnType: 'varchar', nullable: true })
  locale?: string;

  @Property({
    fieldName: 'build_language',
    columnType: 'varchar',
    nullable: true,
  })
  buildLanguage?: string;

  @Property({ columnType: 'varchar', nullable: true })
  framework?: string;

  @Property({
    fieldName: 'theme_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  themeJson?: unknown;

  @Property({ fieldName: 'ssl_enabled', type: 'boolean', nullable: true })
  sslEnabled?: boolean;

  @Property({ fieldName: 'is_published', type: 'boolean', nullable: true })
  isPublished?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
