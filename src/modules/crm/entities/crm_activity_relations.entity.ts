import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_activity_relations`.
 */
@Entity({ schema: 'crm', tableName: 'crm_activity_relations' })
export class CrmActivityRelations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Identificador asociado a relation kind concept.
   */
  @Property({ fieldName: 'relation_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationKindConceptId!: string;

  /**
   * Identificador asociado a related entity type concept.
   */
  @Property({ fieldName: 'related_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relatedEntityTypeConceptId!: string;

  /**
   * Identificador asociado a crm account.
   */
  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  /**
   * Identificador asociado a contact.
   */
  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  /**
   * Identificador asociado a lead.
   */
  @Property({ fieldName: 'lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  leadId?: string;

  /**
   * Identificador asociado a opportunity.
   */
  @Property({ fieldName: 'opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  opportunityId?: string;

  /**
   * Identificador asociado a partnership.
   */
  @Property({ fieldName: 'partnership_id', type: 'uuid', nullable: true }) // FK → crm.partnerships
  partnershipId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a case.
   */
  @Property({ fieldName: 'case_id', type: 'uuid', nullable: true }) // FK → crm.crm_cases
  caseId?: string;

  /**
   * Identificador asociado a related user.
   */
  @Property({ fieldName: 'related_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  relatedUserId?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  /**
   * Valor de is invitee mantenido por la instancia.
   */
  @Property({ fieldName: 'is_invitee', type: 'boolean', nullable: true })
  isInvitee?: boolean;

  /**
   * Identificador asociado a participant role concept.
   */
  @Property({
    fieldName: 'participant_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  participantRoleConceptId?: string;

  /**
   * Identificador asociado a response status concept.
   */
  @Property({
    fieldName: 'response_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  responseStatusConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
