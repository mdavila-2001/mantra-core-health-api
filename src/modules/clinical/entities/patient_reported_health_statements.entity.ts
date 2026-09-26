import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Lo que la persona **declara** de su propia salud (D-B, CL-04 / CV-01): grupo
 * sanguíneo, alergias que conoce, enfermedades crónicas, medicación actual,
 * cirugías, antecedentes familiares y hábitos. Una fila por titular.
 *
 * Es texto libre **declarado y no verificado**: no reemplaza a las alergias,
 * condiciones u observaciones que registra el médico, y se muestra aparte.
 *
 * Sin `custodian_tenant_id` a propósito (N-09): el dato no lo custodia ningún
 * tenant, lo escribe y lo lee el titular desde su cuenta.
 *
 * Tabla pendiente en el modelo (`diagram_08_clinical.puml`): la agrega M1; ver
 * `docs/progress/DECISIONS.md` § D-B y el reporte del carril M3 § «Pedidos a M1».
 */
@Entity({ schema: 'clinical', tableName: 'patient_reported_health_statements' })
export class PatientReportedHealthStatements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Titular de la declaración. UNIQUE: una fila por paciente.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /** Grupo y factor, tal como la persona lo declara («O+»). */
  @Property({
    fieldName: 'blood_type_text',
    columnType: 'varchar(20)',
    nullable: true,
  })
  bloodTypeText?: string;

  /** A qué dice ser alérgica. */
  @Property({ fieldName: 'allergies_text', columnType: 'text', nullable: true })
  allergiesText?: string;

  /** Enfermedades crónicas o condiciones que declara. */
  @Property({
    fieldName: 'chronic_conditions_text',
    columnType: 'text',
    nullable: true,
  })
  chronicConditionsText?: string;

  /** Qué está tomando ahora, incluidos los de venta libre. */
  @Property({
    fieldName: 'current_medications_text',
    columnType: 'text',
    nullable: true,
  })
  currentMedicationsText?: string;

  /** Cirugías y hospitalizaciones anteriores. */
  @Property({ fieldName: 'surgeries_text', columnType: 'text', nullable: true })
  surgeriesText?: string;

  /** Antecedentes familiares relevantes. */
  @Property({
    fieldName: 'family_history_text',
    columnType: 'text',
    nullable: true,
  })
  familyHistoryText?: string;

  /** Hábitos: tabaco, alcohol, actividad física, alimentación. */
  @Property({ fieldName: 'habits_text', columnType: 'text', nullable: true })
  habitsText?: string;

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
