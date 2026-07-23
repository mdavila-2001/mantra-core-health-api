import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_activity_relations' })
export class CrmActivityRelations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({ fieldName: 'relation_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationKindConceptId!: string;

  @Property({ fieldName: 'related_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relatedEntityTypeConceptId!: string;

  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  @Property({ fieldName: 'lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  leadId?: string;

  @Property({ fieldName: 'opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  opportunityId?: string;

  @Property({ fieldName: 'partnership_id', type: 'uuid', nullable: true }) // FK → crm.partnerships
  partnershipId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'case_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  caseId?: string;

  @Property({ fieldName: 'related_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  relatedUserId?: string;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  @Property({ fieldName: 'is_invitee', type: 'boolean', nullable: true })
  isInvitee?: boolean;

  @Property({
    fieldName: 'participant_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  participantRoleConceptId?: string;

  @Property({
    fieldName: 'response_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  responseStatusConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
