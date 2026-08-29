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
   * Departamento boliviano que emitió el documento (miembro de
   * `VS_BO_DEPARTMENT`), para no confundir cédulas homónimas de distinto
   * departamento (SALUD/Arquitectura/alovida-backlog-procesos.md, T-01).
   */
  @Property({
    fieldName: 'issuer_administrative_area_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuerAdministrativeAreaConceptId?: string;

  /**
   * Identificador asociado a assigner tenant.
   */
  @Property({ fieldName: 'assigner_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  assignerTenantId?: string;

  /**
   * A nombre de quién sale el comprobante — la razón social del NIT.
   *
   * Va con el identificador y no con la persona porque es el titular DEL
   * IDENTIFICADOR: alguien puede facturar a nombre de su empresa, y el día que
   * cambie de NIT la razón social cambia con él.
   *
   * Nullable porque un CI no tiene razón social: sólo se llena en los de tipo
   * fiscal.
   */
  @Property({ fieldName: 'holder_name', nullable: true })
  holderName?: string;

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
