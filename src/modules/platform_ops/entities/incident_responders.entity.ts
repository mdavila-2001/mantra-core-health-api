import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'incident_responders' })
export class IncidentResponders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'responder_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responderRoleConceptId!: string;

  @Property({ fieldName: 'joined_at', columnType: 'timestamptz' })
  joinedAt!: Date;

  @Property({ fieldName: 'left_at', columnType: 'timestamptz', nullable: true })
  leftAt?: Date;

  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
