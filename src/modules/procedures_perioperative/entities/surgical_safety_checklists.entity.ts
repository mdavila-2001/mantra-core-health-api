import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `surgical_safety_checklists`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_checklists',
})
export class SurgicalSafetyChecklists {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a checklist type concept.
   */
  @Property({ fieldName: 'checklist_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checklistTypeConceptId!: string;

  /**
   * Valor de checklist version mantenido por la instancia.
   */
  @Property({ fieldName: 'checklist_version', columnType: 'varchar' })
  checklistVersion!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de sign in completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'sign_in_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signInCompletedAt?: Date;

  /**
   * Valor de time out completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'time_out_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  timeOutCompletedAt?: Date;

  /**
   * Valor de sign out completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'sign_out_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signOutCompletedAt?: Date;

  /**
   * Identificador asociado a coordinator profile.
   */
  @Property({
    fieldName: 'coordinator_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  coordinatorProfileId?: string;

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
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
