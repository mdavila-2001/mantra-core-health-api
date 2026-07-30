import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contact_channel_endpoints`.
 */
@Entity({ schema: 'crm', tableName: 'contact_channel_endpoints' })
export class ContactChannelEndpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

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
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Identificador asociado a endpoint type concept.
   */
  @Property({ fieldName: 'endpoint_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  endpointTypeConceptId!: string;

  /**
   * Valor de normalized value mantenido por la instancia.
   */
  @Property({ fieldName: 'normalized_value', columnType: 'varchar' })
  normalizedValue!: string;

  /**
   * Valor de masked display value mantenido por la instancia.
   */
  @Property({ fieldName: 'masked_display_value', columnType: 'varchar' })
  maskedDisplayValue!: string;

  /**
   * Valor de value hash mantenido por la instancia.
   */
  @Property({ fieldName: 'value_hash', columnType: 'varchar' })
  valueHash!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Identificador asociado a deliverability status concept.
   */
  @Property({ fieldName: 'deliverability_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deliverabilityStatusConceptId!: string;

  /**
   * Valor de last success at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

  /**
   * Valor de last failure at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_failure_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastFailureAt?: Date;

  /**
   * Valor de do not contact mantenido por la instancia.
   */
  @Property({ fieldName: 'do_not_contact', type: 'boolean' })
  doNotContact!: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
