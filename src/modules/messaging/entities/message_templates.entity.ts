import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `message_templates`.
 */
@Entity({ schema: 'messaging', tableName: 'message_templates' })
export class MessageTemplates {
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
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a language concept.
   */
  @Property({ fieldName: 'language_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  languageConceptId?: string;

  /**
   * Valor de subject template mantenido por la instancia.
   */
  @Property({ fieldName: 'subject_template', columnType: 'varchar' })
  subjectTemplate!: string;

  /**
   * Valor de body template mantenido por la instancia.
   */
  @Property({ fieldName: 'body_template', columnType: 'text' })
  bodyTemplate!: string;

  /**
   * Valor de variables json mantenido por la instancia.
   */
  @Property({
    fieldName: 'variables_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  variablesJson?: unknown;

  /**
   * Valor de provider template ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_template_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerTemplateRef?: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  version!: number;

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
