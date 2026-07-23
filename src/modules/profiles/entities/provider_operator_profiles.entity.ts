import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'provider_operator_profiles' })
export class ProviderOperatorProfiles {
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  @Property({ fieldName: 'operator_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operatorTypeConceptId!: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  roleConceptId?: string;

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
