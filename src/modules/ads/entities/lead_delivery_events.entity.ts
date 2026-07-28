import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lead_delivery_events`.
 */
@Entity({ schema: 'ads', tableName: 'lead_delivery_events' })
export class LeadDeliveryEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lead submission.
   */
  @Property({ fieldName: 'lead_submission_id', type: 'uuid' }) // FK → ads.lead_submissions
  leadSubmissionId!: string;

  /**
   * Identificador asociado a destination type concept.
   */
  @Property({ fieldName: 'destination_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  destinationTypeConceptId!: string;

  /**
   * Valor de destination reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'destination_reference',
    columnType: 'varchar',
    nullable: true,
  })
  destinationReference?: string;

  /**
   * Valor de attempted at mantenido por la instancia.
   */
  @Property({ fieldName: 'attempted_at', columnType: 'timestamptz' })
  attemptedAt!: Date;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de response reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  /**
   * Valor de retry at mantenido por la instancia.
   */
  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
