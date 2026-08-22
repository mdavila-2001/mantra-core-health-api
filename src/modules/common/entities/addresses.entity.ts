import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `addresses`.
 */
@Entity({ schema: 'common', tableName: 'addresses' })
export class Addresses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a owner type concept.
   */
  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  /**
   * Identificador asociado a owner.
   */
  @Property({ fieldName: 'owner_id', type: 'uuid' })
  ownerId!: string;

  /**
   * Identificador asociado a use concept.
   */
  @Property({ fieldName: 'use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  useConceptId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  lines?: string;

  /**
   * Valor de city mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  city?: string;

  /**
   * Identificador asociado a administrative area concept.
   */
  @Property({
    fieldName: 'administrative_area_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  administrativeAreaConceptId?: string;

  /**
   * Municipio boliviano (miembro de `VS_BO_MUNICIPALITY`), catálogo del INE.
   * `administrativeAreaConceptId` sigue siendo el departamento; este es el
   * nivel de detalle que `city` (texto libre) no puede garantizar consistente.
   */
  @Property({
    fieldName: 'municipality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  municipalityConceptId?: string;

  /**
   * Valor de postal code mantenido por la instancia.
   */
  @Property({ fieldName: 'postal_code', columnType: 'varchar', nullable: true })
  postalCode?: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
