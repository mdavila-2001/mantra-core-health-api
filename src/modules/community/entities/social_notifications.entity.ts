import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'social_notifications' })
export class SocialNotifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'recipient_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  recipientProfileId!: string;

  @Property({ fieldName: 'notification_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  notificationTypeConceptId!: string;

  @Property({ fieldName: 'actor_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  actorProfileId?: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  @Property({
    fieldName: 'preview_text',
    columnType: 'varchar',
    nullable: true,
  })
  previewText?: string;

  @Property({ fieldName: 'is_read', type: 'boolean', nullable: true })
  isRead?: boolean;

  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

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
