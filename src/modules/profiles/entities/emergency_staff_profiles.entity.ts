import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'emergency_staff_profiles' })
export class EmergencyStaffProfiles {
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  @Property({ fieldName: 'staff_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  staffTypeConceptId!: string;

  @Property({
    fieldName: 'availability_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  availabilityStatusConceptId?: string;

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
