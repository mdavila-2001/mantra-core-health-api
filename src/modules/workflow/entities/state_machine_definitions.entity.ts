import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `state_machine_definitions`.
 */
@Entity({ schema: 'workflow', tableName: 'state_machine_definitions' })
export class StateMachineDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de machine code mantenido por la instancia.
   */
  @Property({ fieldName: 'machine_code', columnType: 'varchar' })
  machineCode!: string;

  /**
   * Valor de aggregate schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'aggregate_schema_name', columnType: 'varchar' })
  aggregateSchemaName!: string;

  /**
   * Valor de aggregate entity name mantenido por la instancia.
   */
  @Property({ fieldName: 'aggregate_entity_name', columnType: 'varchar' })
  aggregateEntityName!: string;

  /**
   * Valor de status field name mantenido por la instancia.
   */
  @Property({ fieldName: 'status_field_name', columnType: 'varchar' })
  statusFieldName!: string;

  /**
   * Identificador asociado a state value set.
   */
  @Property({ fieldName: 'state_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  stateValueSetId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

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
