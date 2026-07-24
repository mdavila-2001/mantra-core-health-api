import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_legal_representatives' })
export class TenantLegalRepresentatives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'person_id', type: 'uuid' })
  personId!: string;

  @Property({ fieldName: 'representative_role_concept_id', type: 'uuid' })
  representativeRoleConceptId!: string;

  @Property({ fieldName: 'ci_identifier_id', type: 'uuid', nullable: true })
  ciIdentifierId?: string;

  @Property({
    fieldName: 'power_of_attorney_document_id',
    type: 'uuid',
    nullable: true,
  })
  powerOfAttorneyDocumentId?: string;

  @Property({ fieldName: 'appointed_at', columnType: 'date', nullable: true })
  appointedAt?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: string;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: string;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
