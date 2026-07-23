import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'state_machine_definitions' })
export class StateMachineDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'machine_code', columnType: 'varchar' })
  machineCode!: string;

  @Property({ fieldName: 'aggregate_schema_name', columnType: 'varchar' })
  aggregateSchemaName!: string;

  @Property({ fieldName: 'aggregate_entity_name', columnType: 'varchar' })
  aggregateEntityName!: string;

  @Property({ fieldName: 'status_field_name', columnType: 'varchar' })
  statusFieldName!: string;

  @Property({ fieldName: 'state_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  stateValueSetId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
