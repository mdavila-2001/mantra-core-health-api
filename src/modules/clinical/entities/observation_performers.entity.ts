import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `observation_performers`.
 */
@Entity({ schema: 'clinical', tableName: 'observation_performers' })
export class ObservationPerformers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  /**
   * Identificador asociado a performer type concept.
   */
  @Property({ fieldName: 'performer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  performerTypeConceptId!: string;

  /**
   * Identificador asociado a performer.
   */
  @Property({ fieldName: 'performer_id', type: 'uuid' })
  performerId!: string;

  /**
   * Identificador asociado a performer role concept.
   */
  @Property({
    fieldName: 'performer_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  performerRoleConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
