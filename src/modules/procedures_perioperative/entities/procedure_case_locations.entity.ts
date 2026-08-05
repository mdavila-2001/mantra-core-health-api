import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_case_locations`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_locations',
})
export class ProcedureCaseLocations {
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
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces
  careSpaceId!: string;

  /**
   * Identificador asociado a location role concept.
   */
  @Property({ fieldName: 'location_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  locationRoleConceptId!: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @Property({ fieldName: 'starts_at', columnType: 'timestamptz' })
  startsAt!: Date;

  /**
   * Valor de ends at mantenido por la instancia.
   */
  @Property({ fieldName: 'ends_at', columnType: 'timestamptz', nullable: true })
  endsAt?: Date;

  /**
   * Identificador asociado a transfer reason concept.
   */
  @Property({
    fieldName: 'transfer_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  transferReasonConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
