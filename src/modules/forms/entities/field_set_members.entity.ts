import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_set_members' })
export class FieldSetMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'definition_set_version_id', type: 'uuid' }) // FK (destino no resuelto)
  definitionSetVersionId!: string;

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK (destino no resuelto)
  fieldId!: string;

  @Property({ fieldName: 'section_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  sectionId?: string;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
