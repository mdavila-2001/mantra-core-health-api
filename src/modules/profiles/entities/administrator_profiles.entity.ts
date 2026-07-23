import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'administrator_profiles' })
export class AdministratorProfiles {
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  @Property({ fieldName: 'administrator_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  administratorTypeConceptId!: string;

  @Property({ fieldName: 'administrative_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  administrativeLevelConceptId!: string;

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
