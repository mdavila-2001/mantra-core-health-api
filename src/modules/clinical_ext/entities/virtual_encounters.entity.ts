import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `virtual_encounters`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'virtual_encounters' })
export class VirtualEncounters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  /**
   * Identificador asociado a platform concept.
   */
  @Property({ fieldName: 'platform_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  platformConceptId?: string;

  /**
   * Valor de meeting url mantenido por la instancia.
   */
  @Property({ fieldName: 'meeting_url', columnType: 'text', nullable: true })
  meetingUrl?: string;

  /**
   * Identificador asociado a meeting.
   */
  @Property({ fieldName: 'meeting_id', columnType: 'varchar', nullable: true })
  meetingId?: string;

  /**
   * Identificador asociado a recording file.
   */
  @Property({ fieldName: 'recording_file_id', type: 'uuid', nullable: true }) // FK → common.files
  recordingFileId?: string;

  /**
   * Valor de joined at mantenido por la instancia.
   */
  @Property({
    fieldName: 'joined_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  joinedAt?: Date;

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
