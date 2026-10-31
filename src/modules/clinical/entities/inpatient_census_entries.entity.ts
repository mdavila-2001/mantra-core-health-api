import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inpatient_census_entries`.
 */
@Entity({ schema: 'clinical', tableName: 'inpatient_census_entries' })
export class InpatientCensusEntries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a census day.
   */
  @Property({ fieldName: 'census_day_id', type: 'uuid' }) // FK (destino no resuelto)
  censusDayId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  /**
   * Identificador asociado a bed category concept.
   */
  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  /**
   * Identificador asociado a movement concept.
   */
  @Property({ fieldName: 'movement_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  movementConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
