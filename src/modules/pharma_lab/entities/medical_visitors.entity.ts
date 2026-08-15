import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Visitador médico (spec 5290-5341).
 *
 * **Regla principal del carril**: el visitador existe funcionalmente solo
 * mientras mantenga vinculación activa con un laboratorio. Por eso
 * `pharma_lab_id` es NOT NULL y no hay forma de crear la fila sin laboratorio:
 * la dependencia obligatoria es del esquema, no de una validación que un
 * endpoint pueda saltarse.
 *
 * La fila NO se borra al desvincular: se desactiva y se conserva para auditoría
 * y obligaciones legales (spec 5332-5339).
 */
@Entity({ schema: 'pharma_lab', tableName: 'medical_visitors' })
export class MedicalVisitors {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio del que depende. Sin él la cuenta no puede existir.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Cuenta de la plataforma, creada por la organización.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', unique: true }) // FK → iam.users
  userId!: string;

  /**
   * Ficha de personal correspondiente, cuando el visitador es además plantilla.
   */
  @Property({ fieldName: 'staff_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_lab_staff
  staffId?: string;

  /**
   * Nombre completo tal como lo registra la organización.
   */
  @Property({ fieldName: 'full_name', columnType: 'varchar' })
  fullName!: string;

  /**
   * URL de la fotografía.
   */
  @Property({ fieldName: 'photo_url', columnType: 'varchar', nullable: true })
  photoUrl?: string;

  /**
   * Código interno del visitador dentro del laboratorio.
   */
  @Property({ fieldName: 'internal_code', columnType: 'varchar' })
  internalCode!: string;

  /**
   * Cargo.
   */
  @Property({ columnType: 'varchar', nullable: true })
  position?: string;

  /**
   * Supervisor, como ficha de personal del mismo laboratorio.
   */
  @Property({ fieldName: 'supervisor_staff_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_lab_staff
  supervisorStaffId?: string;

  /**
   * Sede a la que reporta.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Región geográfica asignada.
   */
  @Property({ columnType: 'varchar', nullable: true })
  region?: string;

  /**
   * Área comercial.
   */
  @Property({
    fieldName: 'commercial_area',
    columnType: 'varchar',
    nullable: true,
  })
  commercialArea?: string;

  /**
   * Zona asignada dentro del área comercial.
   */
  @Property({
    fieldName: 'assigned_zone',
    columnType: 'varchar',
    nullable: true,
  })
  assignedZone?: string;

  /**
   * Fecha de inicio de la vinculación.
   */
  @Property({ fieldName: 'started_on', columnType: 'date' })
  startedOn!: string;

  /**
   * Fecha de finalización prevista o efectiva.
   */
  @Property({ fieldName: 'ended_on', columnType: 'date', nullable: true })
  endedOn?: string;

  /**
   * Verificación de identidad.
   */
  @Property({ fieldName: 'identity_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identityVerificationConceptId!: string;

  /**
   * Verificación del contrato.
   */
  @Property({ fieldName: 'contract_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contractVerificationConceptId!: string;

  /**
   * Verificación de credenciales.
   */
  @Property({ fieldName: 'credential_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  credentialVerificationConceptId!: string;

  /**
   * Estado de la vinculación. `LINK_ACTIVE` es la única que habilita operar.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Si el perfil se muestra públicamente. Al desvincular pasa a `false`
   * (spec 5331).
   */
  @Property({ fieldName: 'publicly_listed', type: 'boolean' })
  publiclyListed: boolean = true;

  /**
   * Momento de la desvinculación, cuando ocurrió.
   */
  @Property({
    fieldName: 'unlinked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  unlinkedAt?: Date;

  /**
   * Motivo de la desvinculación.
   */
  @Property({ fieldName: 'unlink_reason', columnType: 'text', nullable: true })
  unlinkReason?: string;

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
