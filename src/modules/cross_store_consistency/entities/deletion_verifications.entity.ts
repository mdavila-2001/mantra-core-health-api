import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'deletion_verifications',
})
export class DeletionVerifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'deletion_target_id', type: 'uuid' })
  deletionTargetId!: string;

  @Property({ fieldName: 'verification_method', columnType: 'varchar' })
  verificationMethod!: string;

  @Property({ fieldName: 'verified_absent', type: 'boolean' })
  verifiedAbsent!: boolean;

  @Property({ fieldName: 'residual_reference_count', columnType: 'int' })
  residualReferenceCount!: number;

  @Property({ fieldName: 'evidence_object_id', type: 'uuid' })
  evidenceObjectId!: string;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
