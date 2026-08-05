import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_identifiers`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_identifiers' })
export class SpecimenIdentifiers {
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
   * Identificador asociado a assigning organization.
   */
  @Property({
    fieldName: 'assigning_organization_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  assigningOrganizationId?: string;

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
