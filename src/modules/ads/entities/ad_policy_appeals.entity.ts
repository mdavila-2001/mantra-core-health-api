import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_policy_appeals`.
 */
@Entity({ schema: 'ads', tableName: 'ad_policy_appeals' })
export class AdPolicyAppeals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad policy violation.
   */
  @Property({ fieldName: 'ad_policy_violation_id', type: 'uuid' }) // FK → ads.ad_policy_violations
  adPolicyViolationId!: string;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  /**
   * Identificador asociado a submitted by user.
   */
  @Property({ fieldName: 'submitted_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  submittedByUserId?: string;

  /**
   * Valor de appeal reason mantenido por la instancia.
   */
  @Property({ fieldName: 'appeal_reason', columnType: 'text' })
  appealReason!: string;

  /**
   * Identificador asociado a evidence file.
   */
  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a external appeal.
   */
  @Property({
    fieldName: 'external_appeal_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalAppealId?: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Valor de decision reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_reason',
    columnType: 'text',
    nullable: true,
  })
  decisionReason?: string;

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
