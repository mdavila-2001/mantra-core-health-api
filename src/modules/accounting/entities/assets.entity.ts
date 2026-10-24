import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assets`.
 */
@Entity({ schema: 'accounting', tableName: 'assets' })
export class Assets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a asset type concept.
   */
  @Property({
    fieldName: 'asset_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assetTypeConceptId?: string;

  /**
   * Identificador asociado a account.
   */
  @Property({ fieldName: 'account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  accountId?: string;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Si un worker programado puede depreciarlo solo (FT-26), o si sólo avanza
   * cuando alguien llama al auto-servicio a mano.
   */
  @Property({ fieldName: 'automated', columnType: 'boolean' })
  automated: boolean = true;

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
