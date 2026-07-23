import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_identity_asset_assignments' })
export class AdIdentityAssetAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_identity_asset_id', type: 'uuid' }) // FK → ads.ad_identity_assets
  adIdentityAssetId!: string;

  @Property({ fieldName: 'assignable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assignableTypeConceptId!: string;

  @Property({ fieldName: 'assignable_id', type: 'uuid' })
  assignableId!: string;

  @Property({ fieldName: 'assignment_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

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
