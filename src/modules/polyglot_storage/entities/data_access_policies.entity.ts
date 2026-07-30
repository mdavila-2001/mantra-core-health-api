import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_access_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'data_access_policies' })
export class DataAccessPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  /**
   * Valor de principal type mantenido por la instancia.
   */
  @Property({ fieldName: 'principal_type', columnType: 'varchar' })
  principalType!: string;

  /**
   * Valor de field policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'field_policy_json',
    type: 'json',
    columnType: 'jsonb',
  })
  fieldPolicyJson!: unknown;

  /**
   * Valor de row filter expression mantenido por la instancia.
   */
  @Property({ fieldName: 'row_filter_expression', columnType: 'text' })
  rowFilterExpression!: string;

  /**
   * Valor de masking profile code mantenido por la instancia.
   */
  @Property({ fieldName: 'masking_profile_code', columnType: 'varchar' })
  maskingProfileCode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
