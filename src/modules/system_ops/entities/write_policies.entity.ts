import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'write_policies' })
export class WritePolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'insert_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  insertModeConceptId!: string;

  @Property({ fieldName: 'update_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  updateModeConceptId!: string;

  @Property({ fieldName: 'delete_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deleteModeConceptId!: string;

  @Property({ fieldName: 'requires_reason', type: 'boolean', nullable: true })
  requiresReason?: boolean;

  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

  @Property({ fieldName: 'max_batch_size', columnType: 'int', nullable: true })
  maxBatchSize?: number;

  @Property({ fieldName: 'dual_control', type: 'boolean', nullable: true })
  dualControl?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
