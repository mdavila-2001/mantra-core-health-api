import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'incident_communications' })
export class IncidentCommunications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  @Property({ fieldName: 'communication_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  communicationTypeConceptId!: string;

  @Property({ fieldName: 'audience_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  audienceConceptId!: string;

  @Property({ fieldName: 'published_at', columnType: 'timestamptz' })
  publishedAt!: Date;

  @Property({ fieldName: 'published_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  publishedByUserId?: string;

  @Property({ fieldName: 'message_text', columnType: 'text' })
  messageText!: string;

  @Property({
    fieldName: 'channel_reference',
    columnType: 'varchar',
    nullable: true,
  })
  channelReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
