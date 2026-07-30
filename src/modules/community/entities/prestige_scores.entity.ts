import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `prestige_scores`.
 */
@Entity({ schema: 'community', tableName: 'prestige_scores' })
export class PrestigeScores {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject ref.
   */
  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  /**
   * Identificador asociado a public profile.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  /**
   * Valor de total points mantenido por la instancia.
   */
  @Property({ fieldName: 'total_points', columnType: 'numeric' })
  totalPoints!: string;

  /**
   * Identificador asociado a level concept.
   */
  @Property({ fieldName: 'level_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  levelConceptId?: string;

  /**
   * Valor de rank position mantenido por la instancia.
   */
  @Property({ fieldName: 'rank_position', columnType: 'int', nullable: true })
  rankPosition?: number;

  /**
   * Identificador asociado a last award.
   */
  @Property({ fieldName: 'last_award_id', type: 'uuid', nullable: true }) // FK → community.prestige_awards
  lastAwardId?: string;

  /**
   * Valor de calculated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'calculated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  calculatedAt?: Date;

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
