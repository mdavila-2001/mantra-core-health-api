import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `asset_valuations`.
 */
@Entity({ schema: 'accounting', tableName: 'asset_valuations' })
export class AssetValuations {
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
   * Identificador asociado a asset component.
   */
  @Property({ fieldName: 'asset_component_id', type: 'uuid', nullable: true }) // FK → accounting.asset_components
  assetComponentId?: string;

  /**
   * Identificador asociado a depreciation area.
   */
  @Property({ fieldName: 'depreciation_area_id', type: 'uuid' }) // FK → accounting.depreciation_areas
  depreciationAreaId!: string;

  /**
   * Identificador asociado a depreciation method concept.
   */
  @Property({
    fieldName: 'depreciation_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  depreciationMethodConceptId?: string;

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
   * Valor de acquisition value mantenido por la instancia.
   */
  @Property({
    fieldName: 'acquisition_value',
    columnType: 'numeric',
    nullable: true,
  })
  acquisitionValue?: string;

  /**
   * Valor de accumulated depreciation mantenido por la instancia.
   */
  @Property({
    fieldName: 'accumulated_depreciation',
    columnType: 'numeric',
    nullable: true,
  })
  accumulatedDepreciation?: string;

  /**
   * Valor de book value mantenido por la instancia.
   */
  @Property({ fieldName: 'book_value', columnType: 'numeric', nullable: true })
  bookValue?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
