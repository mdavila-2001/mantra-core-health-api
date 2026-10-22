import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `encounters`.
 */
@Entity({ schema: 'clinical', tableName: 'encounters' })
export class Encounters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a episode.
   */
  @Property({ fieldName: 'episode_id', type: 'uuid', nullable: true }) // FK → clinical.care_episodes
  episodeId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Identificador asociado a primary practitioner.
   */
  @Property({
    fieldName: 'primary_practitioner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  primaryPractitionerId?: string;

  /**
   * Identificador asociado a class concept.
   */
  @Property({ fieldName: 'class_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  classConceptId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  /**
   * Identificador asociado a appointment.
   */
  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true }) // FK → clinical.appointments
  appointmentId?: string;

  /**
   * Sello SHA-256 del contenido del encuentro, calculado al cerrarlo.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Fecha y hora en que se calculó el sello del encuentro.
   */
  @Property({
    fieldName: 'sealed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sealedAt?: Date;

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
