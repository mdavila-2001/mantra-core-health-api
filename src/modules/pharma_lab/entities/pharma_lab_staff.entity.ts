import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Personal del laboratorio (spec 5262-5288): administrativo, investigadores,
 * farmacéuticos, químicos, bioquímicos, personal médico, comercial, visitadores,
 * legal, regulatorio, farmacovigilancia, contable y otros colaboradores.
 *
 * El visitador médico también tiene fila acá —es personal— y además una fila en
 * `medical_visitors` con lo que es exclusivo de su función comercial.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_lab_staff' })
export class PharmaLabStaff {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio al que pertenece.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Cuenta de la plataforma asociada al colaborador.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Tipo de personal.
   */
  @Property({ fieldName: 'staff_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  staffTypeConceptId!: string;

  /**
   * Rol funcional asignado dentro de la organización (código de `authz`).
   */
  @Property({ fieldName: 'role_code', columnType: 'varchar', nullable: true })
  roleCode?: string;

  /**
   * Cargo.
   */
  @Property({ columnType: 'varchar', nullable: true })
  position?: string;

  /**
   * Área.
   */
  @Property({ columnType: 'varchar', nullable: true })
  area?: string;

  /**
   * Sede de trabajo.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Jornada (completa, parcial, por horas…).
   */
  @Property({
    fieldName: 'work_schedule',
    columnType: 'varchar',
    nullable: true,
  })
  workSchedule?: string;

  /**
   * Fecha de ingreso.
   */
  @Property({ fieldName: 'hired_on', columnType: 'date' })
  hiredOn!: string;

  /**
   * Fecha de baja, cuando el colaborador fue desvinculado.
   */
  @Property({ fieldName: 'ended_on', columnType: 'date', nullable: true })
  endedOn?: string;

  /**
   * Permisos concedidos, más finos que el rol.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  permissions?: string[];

  /**
   * Estado de verificación de credenciales profesionales, cuando corresponde.
   */
  @Property({ fieldName: 'credential_verification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  credentialVerificationConceptId!: string;

  /**
   * Estado de la vinculación (activa, terminada, suspendida).
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
