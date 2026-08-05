import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `surgical_safety_responses`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_responses',
})
export class SurgicalSafetyResponses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a surgical safety checklist.
   */
  @Property({ fieldName: 'surgical_safety_checklist_id', type: 'uuid' }) // FK → procedures_perioperative.surgical_safety_checklists
  surgicalSafetyChecklistId!: string;

  /**
   * Identificador asociado a surgical safety item.
   */
  @Property({ fieldName: 'surgical_safety_item_id', type: 'uuid' }) // FK → procedures_perioperative.surgical_safety_items
  surgicalSafetyItemId!: string;

  /**
   * Identificador asociado a response status concept.
   */
  @Property({ fieldName: 'response_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responseStatusConceptId!: string;

  /**
   * Valor de response boolean mantenido por la instancia.
   */
  @Property({ fieldName: 'response_boolean', type: 'boolean', nullable: true })
  responseBoolean?: boolean;

  /**
   * Valor de response text mantenido por la instancia.
   */
  @Property({ fieldName: 'response_text', columnType: 'text', nullable: true })
  responseText?: string;

  /**
   * Identificador asociado a response concept.
   */
  @Property({ fieldName: 'response_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  responseConceptId?: string;

  /**
   * Identificador asociado a responded by profile.
   */
  @Property({
    fieldName: 'responded_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  respondedByProfileId?: string;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({ fieldName: 'responded_at', columnType: 'timestamptz' })
  respondedAt!: Date;

  /**
   * Valor de exception reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'exception_reason',
    columnType: 'text',
    nullable: true,
  })
  exceptionReason?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
