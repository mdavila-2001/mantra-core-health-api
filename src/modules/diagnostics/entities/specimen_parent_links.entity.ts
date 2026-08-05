import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_parent_links`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_parent_links' })
export class SpecimenParentLinks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a child specimen.
   */
  @Property({ fieldName: 'child_specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  childSpecimenId!: string;

  /**
   * Identificador asociado a parent specimen.
   */
  @Property({ fieldName: 'parent_specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  parentSpecimenId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @Property({ fieldName: 'relationship_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipTypeConceptId!: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  quantityDecimal?: string;

  /**
   * Identificador asociado a quantity unit concept.
   */
  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
