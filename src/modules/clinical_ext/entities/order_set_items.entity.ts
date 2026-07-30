import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `order_set_items`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'order_set_items' })
export class OrderSetItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a order set.
   */
  @Property({ fieldName: 'order_set_id', type: 'uuid' }) // FK → clinical_ext.order_sets
  orderSetId!: string;

  /**
   * Identificador asociado a item type concept.
   */
  @Property({ fieldName: 'item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  itemTypeConceptId!: string;

  /**
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Valor de default dose text mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_dose_text',
    columnType: 'varchar',
    nullable: true,
  })
  defaultDoseText?: string;

  /**
   * Identificador asociado a default route concept.
   */
  @Property({
    fieldName: 'default_route_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultRouteConceptId?: string;

  /**
   * Valor de default frequency text mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  defaultFrequencyText?: string;

  /**
   * Valor de is selected default mantenido por la instancia.
   */
  @Property({
    fieldName: 'is_selected_default',
    type: 'boolean',
    nullable: true,
  })
  isSelectedDefault?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
