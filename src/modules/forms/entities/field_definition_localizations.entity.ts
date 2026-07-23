import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_definition_localizations' })
export class FieldDefinitionLocalizations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK (destino no resuelto)
  fieldId!: string;

  @Property({ fieldName: 'language_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  languageConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  label?: string;

  @Property({ fieldName: 'help_text', columnType: 'text', nullable: true })
  helpText?: string;

  @Property({ columnType: 'varchar', nullable: true })
  placeholder?: string;

  @Property({
    fieldName: 'validation_message',
    columnType: 'varchar',
    nullable: true,
  })
  validationMessage?: string;

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
