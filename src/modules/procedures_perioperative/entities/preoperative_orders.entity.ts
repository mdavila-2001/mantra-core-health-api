import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `preoperative_orders`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'preoperative_orders',
})
export class PreoperativeOrders {
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
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests
  serviceRequestId!: string;

  /**
   * Identificador asociado a order role concept.
   */
  @Property({ fieldName: 'order_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  orderRoleConceptId!: string;

  /**
   * Identificador asociado a required before milestone concept.
   */
  @Property({ fieldName: 'required_before_milestone_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  requiredBeforeMilestoneConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Identificador asociado a verified by profile.
   */
  @Property({
    fieldName: 'verified_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  verifiedByProfileId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
