import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `segment_members`.
 */
@Entity({ schema: 'marketing', tableName: 'segment_members' })
export class SegmentMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a segment.
   */
  @Property({ fieldName: 'segment_id', type: 'uuid' }) // FK → marketing.segments
  segmentId!: string;

  /**
   * Identificador asociado a member type concept.
   */
  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  /**
   * Identificador asociado a member ref.
   */
  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  score?: string;

  /**
   * Valor de added at mantenido por la instancia.
   */
  @Property({
    fieldName: 'added_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  addedAt?: Date;

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
