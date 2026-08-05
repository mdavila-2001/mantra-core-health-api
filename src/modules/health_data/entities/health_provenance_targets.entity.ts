import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_provenance_targets`.
 */
@Entity({ schema: 'health_data', tableName: 'health_provenance_targets' })
export class HealthProvenanceTargets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health provenance record.
   */
  @Property({ fieldName: 'health_provenance_record_id', type: 'uuid' }) // FK → health_data.health_provenance_records
  healthProvenanceRecordId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Identificador asociado a role concept.
   */
  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
