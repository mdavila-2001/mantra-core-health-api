import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'instructors' })
export class Instructors {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({
    fieldName: 'practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  practitionerProfileId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  @Property({ columnType: 'text', nullable: true })
  bio?: string;

  @Property({
    fieldName: 'credentials_text',
    columnType: 'varchar',
    nullable: true,
  })
  credentialsText?: string;

  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

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
