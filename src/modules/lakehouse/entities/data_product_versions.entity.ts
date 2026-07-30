import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_product_versions`.
 */
@Entity({ schema: 'lakehouse', tableName: 'data_product_versions' })
export class DataProductVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a data product.
   */
  @Property({ fieldName: 'data_product_id', type: 'uuid' })
  dataProductId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Valor de contract schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'contract_schema_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contractSchemaJson!: unknown;

  /**
   * Valor de quality slo json mantenido por la instancia.
   */
  @Property({
    fieldName: 'quality_slo_json',
    type: 'json',
    columnType: 'jsonb',
  })
  qualitySloJson!: unknown;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
