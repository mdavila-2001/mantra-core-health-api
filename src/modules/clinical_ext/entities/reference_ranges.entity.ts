import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `reference_ranges`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'reference_ranges' })
export class ReferenceRanges {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Identificador asociado a sex concept.
   */
  @Property({ fieldName: 'sex_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sexConceptId?: string;

  /**
   * Valor de age min days mantenido por la instancia.
   */
  @Property({ fieldName: 'age_min_days', columnType: 'int', nullable: true })
  ageMinDays?: number;

  /**
   * Valor de age max days mantenido por la instancia.
   */
  @Property({ fieldName: 'age_max_days', columnType: 'int', nullable: true })
  ageMaxDays?: number;

  /**
   * Identificador asociado a condition concept.
   */
  @Property({ fieldName: 'condition_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  conditionConceptId?: string;

  /**
   * Valor de low value mantenido por la instancia.
   */
  @Property({ fieldName: 'low_value', columnType: 'numeric', nullable: true })
  lowValue?: string;

  /**
   * Valor de high value mantenido por la instancia.
   */
  @Property({ fieldName: 'high_value', columnType: 'numeric', nullable: true })
  highValue?: string;

  /**
   * Valor de critical low mantenido por la instancia.
   */
  @Property({
    fieldName: 'critical_low',
    columnType: 'numeric',
    nullable: true,
  })
  criticalLow?: string;

  /**
   * Valor de critical high mantenido por la instancia.
   */
  @Property({
    fieldName: 'critical_high',
    columnType: 'numeric',
    nullable: true,
  })
  criticalHigh?: string;

  /**
   * Valor de interpretation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

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
