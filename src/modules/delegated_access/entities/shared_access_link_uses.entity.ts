import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'delegated_access', tableName: 'shared_access_link_uses' })
export class SharedAccessLinkUses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'shared_access_link_id', type: 'uuid' }) // FK → delegated_access.shared_access_links (inferida)
  sharedAccessLinkId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  actionConceptId!: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  outcomeConceptId!: string;

  @Property({ fieldName: 'source_ip', columnType: 'inet', nullable: true })
  sourceIp?: string;

  @Property({ fieldName: 'user_agent', columnType: 'varchar', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
