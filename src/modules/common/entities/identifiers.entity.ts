import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identifiers`.
 */
@Entity({ schema: 'common', tableName: 'identifiers' })
export class Identifiers {
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
  @Property({ fieldName: 'type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  typeConceptId!: string;

  /**
   * Valor de system mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  system?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  value!: string;

  /**
   * Identificador asociado a issuer country concept.
   */
  @Property({
    fieldName: 'issuer_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuerCountryConceptId?: string;

  /**
   * Departamento de expedición del documento (la «extensión» del carnet
   * boliviano: SC, LP, CB…). Dato informativo del registro: no participa del
   * login ni de la unicidad. Value set `vs_administrative_area` (v4.1.4).
   */
  @Property({
    fieldName: 'issuing_administrative_area_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuingAdministrativeAreaConceptId?: string;

  /**
   * Identificador asociado a assigner tenant.
   */
  @Property({ fieldName: 'assigner_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  assignerTenantId?: string;

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
