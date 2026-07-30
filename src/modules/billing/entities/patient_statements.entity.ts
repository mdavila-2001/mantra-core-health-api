import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_statements`.
 */
@Entity({ schema: 'billing', tableName: 'patient_statements' })
export class PatientStatements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  /**
   * Valor de opening balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'opening_balance',
    columnType: 'numeric',
    nullable: true,
  })
  openingBalance?: string;

  /**
   * Valor de charges mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  charges?: string;

  /**
   * Valor de payments mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  payments?: string;

  /**
   * Valor de closing balance mantenido por la instancia.
   */
  @Property({
    fieldName: 'closing_balance',
    columnType: 'numeric',
    nullable: true,
  })
  closingBalance?: string;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'generated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  generatedAt?: Date;

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
