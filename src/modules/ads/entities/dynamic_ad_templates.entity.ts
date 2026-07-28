import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dynamic_ad_templates`.
 */
@Entity({ schema: 'ads', tableName: 'dynamic_ad_templates' })
export class DynamicAdTemplates {
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
   * Identificador asociado a product set.
   */
  @Property({ fieldName: 'product_set_id', type: 'uuid' }) // FK → ads.product_sets
  productSetId!: string;

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
   * Valor de title template mantenido por la instancia.
   */
  @Property({
    fieldName: 'title_template',
    columnType: 'varchar',
    nullable: true,
  })
  titleTemplate?: string;

  /**
   * Valor de description template mantenido por la instancia.
   */
  @Property({
    fieldName: 'description_template',
    columnType: 'text',
    nullable: true,
  })
  descriptionTemplate?: string;

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
   * Identificador asociado a creative.
   */
  @Property({ fieldName: 'creative_id', type: 'uuid', nullable: true }) // FK → ads.ad_creatives
  creativeId?: string;

  /**
   * Valor de template json mantenido por la instancia.
   */
  @Property({
    fieldName: 'template_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  templateJson?: unknown;

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
