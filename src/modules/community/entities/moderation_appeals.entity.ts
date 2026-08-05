import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `moderation_appeals`.
 */
@Entity({ schema: 'community', tableName: 'moderation_appeals' })
export class ModerationAppeals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a moderation decision.
   */
  @Property({ fieldName: 'moderation_decision_id', type: 'uuid' }) // FK → community.moderation_decisions
  moderationDecisionId!: string;

  /**
   * Identificador asociado a appellant profile.
   */
  @Property({ fieldName: 'appellant_profile_id', type: 'uuid' }) // FK → community.public_profiles
  appellantProfileId!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text' })
  reasonText!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Identificador asociado a resolution concept.
   */
  @Property({
    fieldName: 'resolution_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  resolutionConceptId?: string;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

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
