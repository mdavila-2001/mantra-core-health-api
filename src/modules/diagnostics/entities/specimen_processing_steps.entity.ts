import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_processing_steps`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_processing_steps' })
export class SpecimenProcessingSteps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Identificador asociado a procedure concept.
   */
  @Property({ fieldName: 'procedure_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  procedureConceptId!: string;

  /**
   * Identificador asociado a additive concept.
   */
  @Property({ fieldName: 'additive_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  additiveConceptId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Valor de performed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'performed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  performedAt?: Date;

  /**
   * Identificador asociado a performer profile.
   */
  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  performerProfileId?: string;

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
