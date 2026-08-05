import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_use_agreements`.
 */
@Entity({ schema: 'organization_extensions', tableName: 'data_use_agreements' })
export class DataUseAgreements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a counterparty org.
   */
  @Property({ fieldName: 'counterparty_org_id', type: 'uuid', nullable: true })
  counterpartyOrgId?: string;

  /**
   * Valor de agreement number mantenido por la instancia.
   */
  @Property({
    fieldName: 'agreement_number',
    columnType: 'varchar',
    nullable: true,
  })
  agreementNumber?: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @Property({ fieldName: 'purpose_concept_id', type: 'uuid', nullable: true })
  purposeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  /**
   * Valor de effective date mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_date', columnType: 'date', nullable: true })
  effectiveDate?: string;

  /**
   * Valor de expiry date mantenido por la instancia.
   */
  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
