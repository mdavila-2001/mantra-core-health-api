import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `fhir_profile_versions`.
 */
@Entity({ schema: 'health_data', tableName: 'fhir_profile_versions' })
export class FhirProfileVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a fhir profile definition.
   */
  @Property({ fieldName: 'fhir_profile_definition_id', type: 'uuid' }) // FK → health_data.fhir_profile_definitions
  fhirProfileDefinitionId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Identificador asociado a fhir release concept.
   */
  @Property({ fieldName: 'fhir_release_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fhirReleaseConceptId!: string;

  /**
   * Valor de structure definition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'structure_definition_json',
    type: 'json',
    columnType: 'jsonb',
  })
  structureDefinitionJson!: unknown;

  /**
   * Valor de package name mantenido por la instancia.
   */
  @Property({
    fieldName: 'package_name',
    columnType: 'varchar',
    nullable: true,
  })
  packageName?: string;

  /**
   * Valor de package version mantenido por la instancia.
   */
  @Property({
    fieldName: 'package_version',
    columnType: 'varchar',
    nullable: true,
  })
  packageVersion?: string;

  /**
   * Valor de checksum sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  checksumSha256?: string;

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
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
