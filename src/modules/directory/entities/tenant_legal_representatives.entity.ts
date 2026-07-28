import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_legal_representatives`.
 */
@Entity({ schema: 'directory', tableName: 'tenant_legal_representatives' })
export class TenantLegalRepresentatives {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a person.
   */
  @Property({ fieldName: 'person_id', type: 'uuid' }) // FK → profiles.persons
  personId!: string;

  /**
   * Identificador asociado a representative role concept.
   */
  @Property({ fieldName: 'representative_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  representativeRoleConceptId!: string;

  /**
   * Identificador asociado a ci identifier.
   */
  @Property({ fieldName: 'ci_identifier_id', type: 'uuid', nullable: true }) // FK → common.identifiers
  ciIdentifierId?: string;

  /**
   * Identificador asociado a power of attorney document.
   */
  @Property({
    fieldName: 'power_of_attorney_document_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenant_affiliation_documents
  powerOfAttorneyDocumentId?: string;

  /**
   * Valor de appointed at mantenido por la instancia.
   */
  @Property({ fieldName: 'appointed_at', columnType: 'date', nullable: true })
  appointedAt?: Date;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
