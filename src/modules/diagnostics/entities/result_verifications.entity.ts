import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'result_verifications' })
export class ResultVerifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'verifiable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verifiableTypeConceptId!: string;

  @Property({ fieldName: 'verifiable_id', type: 'uuid' })
  verifiableId!: string;

  @Property({ fieldName: 'verification_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationLevelConceptId!: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'verified_by_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  verifiedByProfileId!: string;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  @Property({
    fieldName: 'verification_comment',
    columnType: 'text',
    nullable: true,
  })
  verificationComment?: string;

  @Property({
    fieldName: 'previous_verification_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  previousVerificationId?: string;

  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  signatureId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
