import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_creatives`.
 */
@Entity({ schema: 'ads', tableName: 'ad_creatives' })
export class AdCreatives {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a format concept.
   */
  @Property({ fieldName: 'format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  formatConceptId!: string;

  /**
   * Valor de body mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  body?: string;

  /**
   * Identificador asociado a call to action concept.
   */
  @Property({
    fieldName: 'call_to_action_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  callToActionConceptId?: string;

  /**
   * Valor de link url mantenido por la instancia.
   */
  @Property({ fieldName: 'link_url', columnType: 'text', nullable: true })
  linkUrl?: string;

  /**
   * Valor de display url mantenido por la instancia.
   */
  @Property({ fieldName: 'display_url', columnType: 'varchar', nullable: true })
  displayUrl?: string;

  /**
   * Valor de object story json mantenido por la instancia.
   */
  @Property({
    fieldName: 'object_story_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  objectStoryJson?: unknown;

  /**
   * Identificador asociado a primary media file.
   */
  @Property({
    fieldName: 'primary_media_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  primaryMediaFileId?: string;

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
