import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_call_logs`.
 */
@Entity({ schema: 'crm', tableName: 'crm_call_logs' })
export class CrmCallLogs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Identificador asociado a call direction concept.
   */
  @Property({ fieldName: 'call_direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  callDirectionConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Valor de duration seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'duration_seconds',
    columnType: 'int',
    nullable: true,
  })
  durationSeconds?: number;

  /**
   * Valor de from number masked mantenido por la instancia.
   */
  @Property({
    fieldName: 'from_number_masked',
    columnType: 'varchar',
    nullable: true,
  })
  fromNumberMasked?: string;

  /**
   * Valor de to number masked mantenido por la instancia.
   */
  @Property({
    fieldName: 'to_number_masked',
    columnType: 'varchar',
    nullable: true,
  })
  toNumberMasked?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  /**
   * Identificador asociado a recording file.
   */
  @Property({ fieldName: 'recording_file_id', type: 'uuid', nullable: true }) // FK → common.files
  recordingFileId?: string;

  /**
   * Identificador asociado a external call.
   */
  @Property({
    fieldName: 'external_call_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalCallId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
