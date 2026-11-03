import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `unit_medical_visitors`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'unit_medical_visitors' })
export class UnitMedicalVisitors {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units (inferida)
  diagnosticUnitId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @Property({ fieldName: 'full_name', columnType: 'varchar' })
  fullName!: string;

  /**
   * Valor de photo url mantenido por la instancia.
   */
  @Property({ fieldName: 'photo_url', columnType: 'varchar', nullable: true })
  photoUrl?: string;

  /**
   * Valor de internal code mantenido por la instancia.
   */
  @Property({ fieldName: 'internal_code', columnType: 'varchar' })
  internalCode!: string;

  /**
   * Valor de position mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  position?: string;

  /**
   * Identificador asociado a supervisor user.
   */
  @Property({ fieldName: 'supervisor_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  supervisorUserId?: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches (inferida)
  branchId?: string;

  /**
   * Valor de region mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  region?: string;

  /**
   * Valor de commercial area mantenido por la instancia.
   */
  @Property({
    fieldName: 'commercial_area',
    columnType: 'varchar',
    nullable: true,
  })
  commercialArea?: string;

  /**
   * Valor de assigned zone mantenido por la instancia.
   */
  @Property({
    fieldName: 'assigned_zone',
    columnType: 'varchar',
    nullable: true,
  })
  assignedZone?: string;

  /**
   * Valor de started on mantenido por la instancia.
   */
  @Property({ fieldName: 'started_on', columnType: 'date' })
  startedOn!: Date;

  /**
   * Valor de ended on mantenido por la instancia.
   */
  @Property({ fieldName: 'ended_on', columnType: 'date', nullable: true })
  endedOn?: Date;

  /**
   * Identificador asociado a identity verification concept.
   */
  @Property({ fieldName: 'identity_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  identityVerificationConceptId!: string;

  /**
   * Identificador asociado a contract verification concept.
   */
  @Property({ fieldName: 'contract_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  contractVerificationConceptId!: string;

  /**
   * Identificador asociado a credential verification concept.
   */
  @Property({ fieldName: 'credential_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  credentialVerificationConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de publicly listed mantenido por la instancia.
   */
  @Property({ fieldName: 'publicly_listed', type: 'boolean', default: true })
  publiclyListed!: boolean;

  /**
   * Valor de unlinked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'unlinked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  unlinkedAt?: Date;

  /**
   * Valor de unlink reason mantenido por la instancia.
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
