import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `breach_notifications`.
 */
@Entity({ schema: 'system_ops', tableName: 'breach_notifications' })
export class BreachNotifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a security incident.
   */
  @Property({ fieldName: 'security_incident_id', type: 'uuid' }) // FK → system_ops.security_incidents
  securityIncidentId!: string;

  /**
   * Identificador asociado a authority concept.
   */
  @Property({ fieldName: 'authority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  authorityConceptId!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a regulation concept.
   */
  @Property({
    fieldName: 'regulation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  regulationConceptId?: string;

  /**
   * Valor de deadline at mantenido por la instancia.
   */
  @Property({
    fieldName: 'deadline_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deadlineAt?: Date;

  /**
   * Valor de notified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'notified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  notifiedAt?: Date;

  /**
   * Valor de affected subjects mantenido por la instancia.
   */
  @Property({
    fieldName: 'affected_subjects',
    columnType: 'int',
    nullable: true,
  })
  affectedSubjects?: number;

  /**
   * Identificador asociado a notification channel concept.
   */
  @Property({
    fieldName: 'notification_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  notificationChannelConceptId?: string;

  /**
   * Valor de reference number mantenido por la instancia.
   */
  @Property({
    fieldName: 'reference_number',
    columnType: 'varchar',
    nullable: true,
  })
  referenceNumber?: string;

  /**
   * Valor de subjects notified mantenido por la instancia.
   */
  @Property({ fieldName: 'subjects_notified', type: 'boolean', nullable: true })
  subjectsNotified?: boolean;

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
