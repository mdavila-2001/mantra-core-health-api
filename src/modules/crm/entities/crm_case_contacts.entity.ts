import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_case_contacts`.
 */
@Entity({ schema: 'crm', tableName: 'crm_case_contacts' })
export class CrmCaseContacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm case.
   */
  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  /**
   * Identificador asociado a contact.
   */
  @Property({ fieldName: 'contact_id', type: 'uuid' }) // FK → crm.contacts
  contactId!: string;

  /**
   * Identificador asociado a role concept.
   */
  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

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
