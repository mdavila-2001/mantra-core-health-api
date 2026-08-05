import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `social_notifications`.
 */
@Entity({ schema: 'community', tableName: 'social_notifications' })
export class SocialNotifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a recipient profile.
   */
  @Property({ fieldName: 'recipient_profile_id', type: 'uuid' }) // FK → community.public_profiles
  recipientProfileId!: string;

  /**
   * Identificador asociado a notification type concept.
   */
  @Property({ fieldName: 'notification_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  notificationTypeConceptId!: string;

  /**
   * Identificador asociado a actor profile.
   */
  @Property({ fieldName: 'actor_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  actorProfileId?: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  /**
   * Valor de preview text mantenido por la instancia.
   */
  @Property({
    fieldName: 'preview_text',
    columnType: 'varchar',
    nullable: true,
  })
  previewText?: string;

  /**
   * Valor de is read mantenido por la instancia.
   */
  @Property({ fieldName: 'is_read', type: 'boolean', nullable: true })
  isRead?: boolean;

  /**
   * Valor de read at mantenido por la instancia.
   */
  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

  /**
   * Identificador asociado a notification request.
   */
  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
