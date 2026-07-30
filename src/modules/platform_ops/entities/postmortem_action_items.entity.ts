import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `postmortem_action_items`.
 */
@Entity({ schema: 'platform_ops', tableName: 'postmortem_action_items' })
export class PostmortemActionItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a postmortem.
   */
  @Property({ fieldName: 'postmortem_id', type: 'uuid' }) // FK → platform_ops.postmortems
  postmortemId!: string;

  /**
   * Valor de action code mantenido por la instancia.
   */
  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  description!: string;

  /**
   * Identificador asociado a action type concept.
   */
  @Property({ fieldName: 'action_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionTypeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de verification evidence json mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationEvidenceJson?: unknown;

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
