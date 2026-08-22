import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Favoritos de prescripción de un profesional (Patch v4.1.7).
 *
 * Es una plantilla **personal**: la indicación que quien atiende repite todos los
 * días, guardada con un rótulo propio para no volver a tipearla. Cuelga del perfil
 * profesional, no de un tenant ni de un paciente — a diferencia de `order_sets`,
 * que es la plantilla de la organización.
 *
 * Aplicar un favorito NO crea nada acá: produce una `clinical.medication_requests`
 * normal, con su máquina de estados, su firma (D-05) y su emisión. Por eso esta
 * entidad no participa de ningún flujo clínico y sus filas se borran sin archivar.
 */
@Entity({ schema: 'clinical_ext', tableName: 'prescription_favorites' })
export class PrescriptionFavorites {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'medication_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  medicationConceptId!: string;

  @Property({
    fieldName: 'substance_atc_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substanceAtcConceptId?: string;

  @Property({ fieldName: 'dose_text', columnType: 'varchar', nullable: true })
  doseText?: string;

  @Property({ fieldName: 'route_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  routeConceptId?: string;

  @Property({
    fieldName: 'frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  frequencyText?: string;

  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  quantityDecimal?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'patient_instructions_text',
    columnType: 'text',
    nullable: true,
  })
  patientInstructionsText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
