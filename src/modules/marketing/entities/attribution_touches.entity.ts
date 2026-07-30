import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `attribution_touches`.
 */
@Entity({ schema: 'marketing', tableName: 'attribution_touches' })
export class AttributionTouches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de conversion ref type mantenido por la instancia.
   */
  @Property({ fieldName: 'conversion_ref_type', columnType: 'varchar' })
  conversionRefType!: string;

  /**
   * Identificador asociado a conversion ref.
   */
  @Property({ fieldName: 'conversion_ref_id', type: 'uuid' })
  conversionRefId!: string;

  /**
   * Identificador asociado a marketing touchpoint.
   */
  @Property({ fieldName: 'marketing_touchpoint_id', type: 'uuid' }) // FK → marketing.marketing_touchpoints
  marketingTouchpointId!: string;

  /**
   * Identificador asociado a attribution model concept.
   */
  @Property({ fieldName: 'attribution_model_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  attributionModelConceptId!: string;

  /**
   * Valor de weight mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  weight!: string;

  /**
   * Valor de attributed value mantenido por la instancia.
   */
  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a position concept.
   */
  @Property({ fieldName: 'position_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  positionConceptId?: string;

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
