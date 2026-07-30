import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `content_reports`.
 */
@Entity({ schema: 'community', tableName: 'content_reports' })
export class ContentReports {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a reporter user.
   */
  @Property({ fieldName: 'reporter_user_id', type: 'uuid' }) // FK → iam.users
  reporterUserId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @Property({ fieldName: 'detail_text', columnType: 'text', nullable: true })
  detailText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a assigned moderator user.
   */
  @Property({
    fieldName: 'assigned_moderator_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  assignedModeratorUserId?: string;

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
}
