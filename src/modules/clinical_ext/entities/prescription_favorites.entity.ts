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
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @Property({ fieldName: 'medication_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  medicationConceptId!: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @Property({
    fieldName: 'substance_atc_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substanceAtcConceptId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @Property({ fieldName: 'dose_text', columnType: 'varchar', nullable: true })
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @Property({ fieldName: 'route_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @Property({
    fieldName: 'frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  quantityDecimal?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de patient instructions text mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_instructions_text',
    columnType: 'text',
    nullable: true,
  })
  patientInstructionsText?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
