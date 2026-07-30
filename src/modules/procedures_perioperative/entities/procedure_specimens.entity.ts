import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_specimens`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_specimens',
})
export class ProcedureSpecimens {
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
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Identificador asociado a specimen role concept.
   */
  @Property({ fieldName: 'specimen_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  specimenRoleConceptId!: string;

  /**
   * Identificador asociado a operative step.
   */
  @Property({ fieldName: 'operative_step_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.operative_steps
  operativeStepId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Valor de orientation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'orientation_text',
    columnType: 'text',
    nullable: true,
  })
  orientationText?: string;

  /**
   * Valor de surgeon comment mantenido por la instancia.
   */
  @Property({
    fieldName: 'surgeon_comment',
    columnType: 'text',
    nullable: true,
  })
  surgeonComment?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
