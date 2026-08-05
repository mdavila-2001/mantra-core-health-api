import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_quality_rules`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_rules' })
export class LakehouseQualityRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a data product version.
   */
  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  /**
   * Valor de rule code mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_code', columnType: 'varchar' })
  ruleCode!: string;

  /**
   * Valor de dimension mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  dimension!: string;

  /**
   * Valor de expression mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  expression!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  severity!: string;

  /**
   * Valor de threshold mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  threshold!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
