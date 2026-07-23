import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'consent', tableName: 'consent_provisions' })
export class ConsentProvisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'consent_id', type: 'uuid' }) // FK → consent.consents
  consentId!: string;

  @Property({ fieldName: 'provision_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  provisionTypeConceptId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'data_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataClassConceptId?: string;

  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  actorTenantId?: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  @Property({
    fieldName: 'actor_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  actorRoleConceptId?: string;

  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId?: string;

  @Property({
    fieldName: 'security_label_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  securityLabelConceptId?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
