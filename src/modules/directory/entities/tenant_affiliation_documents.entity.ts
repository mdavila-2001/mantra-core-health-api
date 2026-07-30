import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_affiliation_documents`.
 */
@Entity({ schema: 'directory', tableName: 'tenant_affiliation_documents' })
export class TenantAffiliationDocuments {
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
   * Identificador asociado a document type concept.
   */
  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  /**
   * Identificador asociado a issuing authority concept.
   */
  @Property({ fieldName: 'issuing_authority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  issuingAuthorityConceptId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Identificador asociado a identifier.
   */
  @Property({ fieldName: 'identifier_id', type: 'uuid', nullable: true }) // FK → common.identifiers
  identifierId?: string;

  /**
   * Identificador asociado a related person.
   */
  @Property({ fieldName: 'related_person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  relatedPersonId?: string;

  /**
   * Valor de document number mantenido por la instancia.
   */
  @Property({
    fieldName: 'document_number',
    columnType: 'varchar',
    nullable: true,
  })
  documentNumber?: string;

  /**
   * Valor de registered at mantenido por la instancia.
   */
  @Property({ fieldName: 'registered_at', columnType: 'date', nullable: true })
  registeredAt?: Date;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({ fieldName: 'issued_at', columnType: 'date', nullable: true })
  issuedAt?: Date;

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
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a verified by user.
   */
  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verifiedByUserId?: string;

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
   * Valor de is required for affiliation mantenido por la instancia.
   */
  @Property({
    fieldName: 'is_required_for_affiliation',
    type: 'boolean',
    nullable: true,
  })
  isRequiredForAffiliation?: boolean;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  notes?: string;

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
