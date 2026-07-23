import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'polls' })
export class Polls {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'post_id', type: 'uuid' }) // FK (destino no resuelto)
  postId!: string;

  @Property({ columnType: 'varchar' })
  question!: string;

  @Property({ fieldName: 'allows_multiple', type: 'boolean' })
  allowsMultiple!: boolean;

  @Property({
    fieldName: 'closes_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closesAt?: Date;

  @Property({ fieldName: 'total_votes', type: 'bigint', nullable: true })
  totalVotes?: string;

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
