import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `canonical_resource_identifiers`.
 */
@Entity({ schema: 'health_data', tableName: 'canonical_resource_identifiers' })
export class CanonicalResourceIdentifiers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a canonical health resource.
   */
  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  /**
   * Valor de identifier system mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_system', columnType: 'varchar' })
  identifierSystem!: string;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  /**
   * Identificador asociado a identifier type concept.
   */
  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  /**
   * Valor de assigning authority mantenido por la instancia.
   */
  @Property({
    fieldName: 'assigning_authority',
    columnType: 'varchar',
    nullable: true,
  })
  assigningAuthority?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
