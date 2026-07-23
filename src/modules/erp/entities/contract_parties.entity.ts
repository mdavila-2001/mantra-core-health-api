import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_parties' })
export class ContractParties {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({ fieldName: 'party_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partyRoleConceptId!: string;

  @Property({ fieldName: 'party_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partyTypeConceptId!: string;

  @Property({
    fieldName: 'party_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  partyRefType?: string;

  @Property({ fieldName: 'party_ref_id', type: 'uuid', nullable: true })
  partyRefId?: string;

  @Property({ fieldName: 'party_name', columnType: 'varchar', nullable: true })
  partyName?: string;

  @Property({ fieldName: 'signatory_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  signatoryUserId?: string;

  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

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
