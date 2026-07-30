import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `creative_assets`.
 */
@Entity({ schema: 'ads', tableName: 'creative_assets' })
export class CreativeAssets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad creative.
   */
  @Property({ fieldName: 'ad_creative_id', type: 'uuid' }) // FK → ads.ad_creatives
  adCreativeId!: string;

  /**
   * Identificador asociado a asset type concept.
   */
  @Property({ fieldName: 'asset_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assetTypeConceptId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de external asset ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_asset_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAssetRef?: string;

  /**
   * Valor de hash mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  hash?: string;

  /**
   * Valor de width mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  width?: number;

  /**
   * Valor de height mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  height?: number;

  /**
   * Valor de duration s mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_s', columnType: 'int', nullable: true })
  durationS?: number;

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
