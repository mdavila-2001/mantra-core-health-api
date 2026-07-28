import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Representación legal del paciente (C-07 / A-03): un usuario autorizado a actuar
 * sobre los datos del paciente (tutor, progenitor, apoderado, curador). El PDP la
 * trata como base legítima de acceso a los datos del paciente representado.
 * Nunca se borra: se revoca cambiando el estado.
 */
@Entity({ schema: 'authz', tableName: 'patient_legal_representations' })
export class PatientLegalRepresentations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'representative_user_id', type: 'uuid' }) // FK → iam.users
  representativeUserId!: string;

  @Property({ fieldName: 'representation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  representationTypeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({ fieldName: 'valid_to', columnType: 'timestamptz', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'document_ref', columnType: 'varchar(200)', nullable: true })
  documentRef?: string;

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
