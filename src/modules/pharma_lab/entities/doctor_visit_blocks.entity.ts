import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Bloqueo de un laboratorio o de un visitador concreto por parte del doctor
 * (spec 5421: «permitir bloquear a un laboratorio o visitador cuando exista una
 * razón justificada»).
 *
 * El motivo es obligatorio: la spec pide razón justificada, y un bloqueo sin
 * motivo no se puede revisar ni apelar.
 */
@Entity({ schema: 'pharma_lab', tableName: 'doctor_visit_blocks' })
export class DoctorVisitBlocks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Doctor que bloquea.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users
  doctorUserId!: string;

  /**
   * Laboratorio bloqueado, si el bloqueo es institucional.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_labs
  pharmaLabId?: string;

  /**
   * Visitador bloqueado, si el bloqueo es individual.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Razón justificada del bloqueo.
   */
  @Property({ columnType: 'text' })
  reason!: string;

  /**
   * Estado del bloqueo: vigente o levantado.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Momento en que se levantó el bloqueo.
   */
  @Property({
    fieldName: 'lifted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  liftedAt?: Date;

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
