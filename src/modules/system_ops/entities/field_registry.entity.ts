import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_registry`.
 */
@Entity({ schema: 'system_ops', tableName: 'field_registry' })
export class FieldRegistry {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a entity registry.
   */
  @Property({ fieldName: 'entity_registry_id', type: 'uuid' }) // FK → system_ops.entity_registry
  entityRegistryId!: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  /**
   * Identificador asociado a classification.
   */
  @Property({ fieldName: 'classification_id', type: 'uuid', nullable: true }) // FK → system_ops.data_classifications
  classificationId?: string;

  /**
   * Valor de is pii mantenido por la instancia.
   */
  @Property({ fieldName: 'is_pii', type: 'boolean', nullable: true })
  isPii?: boolean;

  /**
   * Valor de is phi mantenido por la instancia.
   */
  @Property({ fieldName: 'is_phi', type: 'boolean', nullable: true })
  isPhi?: boolean;

  /**
   * Identificador asociado a masking strategy concept.
   */
  @Property({
    fieldName: 'masking_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskingStrategyConceptId?: string;

  /**
   * Identificador asociado a anonymization rule.
   */
  @Property({
    fieldName: 'anonymization_rule_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.anonymization_rules
  anonymizationRuleId?: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

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
