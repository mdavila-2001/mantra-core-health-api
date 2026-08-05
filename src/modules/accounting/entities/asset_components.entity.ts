import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `asset_components`.
 */
@Entity({ schema: 'accounting', tableName: 'asset_components' })
export class AssetComponents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a asset.
   */
  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → accounting.assets
  assetId!: string;

  /**
   * Valor de component number mantenido por la instancia.
   */
  @Property({ fieldName: 'component_number', columnType: 'varchar' })
  componentNumber!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a asset class.
   */
  @Property({ fieldName: 'asset_class_id', type: 'uuid', nullable: true }) // FK → accounting.asset_classes
  assetClassId?: string;

  /**
   * Valor de acquisition date mantenido por la instancia.
   */
  @Property({
    fieldName: 'acquisition_date',
    columnType: 'date',
    nullable: true,
  })
  acquisitionDate?: Date;

  /**
   * Valor de acquisition cost mantenido por la instancia.
   */
  @Property({
    fieldName: 'acquisition_cost',
    columnType: 'numeric',
    nullable: true,
  })
  acquisitionCost?: string;

  /**
   * Valor de useful life months mantenido por la instancia.
   */
  @Property({
    fieldName: 'useful_life_months',
    columnType: 'int',
    nullable: true,
  })
  usefulLifeMonths?: number;

  /**
   * Valor de salvage value mantenido por la instancia.
   */
  @Property({
    fieldName: 'salvage_value',
    columnType: 'numeric',
    nullable: true,
  })
  salvageValue?: string;

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
