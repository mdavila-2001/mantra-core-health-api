import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'identity_assurance', tableName: 'identity_checks' })
export class IdentityChecks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'check_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checkTypeConceptId!: string;

  @Property({ fieldName: 'authority_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  authorityId?: string;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({ fieldName: 'check_sequence', columnType: 'int', nullable: true })
  checkSequence?: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
