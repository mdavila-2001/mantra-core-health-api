import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_schema_migrations' })
export class FieldSchemaMigrations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK (destino no resuelto)
  definitionSetId!: string;

  @Property({ fieldName: 'from_version_id', type: 'uuid' }) // FK (destino no resuelto)
  fromVersionId!: string;

  @Property({ fieldName: 'to_version_id', type: 'uuid' }) // FK (destino no resuelto)
  toVersionId!: string;

  @Property({ fieldName: 'migration_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  migrationTypeConceptId!: string;

  @Property({
    fieldName: 'transformation_expression',
    columnType: 'text',
    nullable: true,
  })
  transformationExpression?: string;

  @Property({
    fieldName: 'validation_expression',
    columnType: 'text',
    nullable: true,
  })
  validationExpression?: string;

  @Property({
    fieldName: 'rollback_expression',
    columnType: 'text',
    nullable: true,
  })
  rollbackExpression?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
