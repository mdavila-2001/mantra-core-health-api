import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `space_tariffs`.
 */
@Entity({ schema: 'billing', tableName: 'space_tariffs' })
export class SpaceTariffs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices (inferida)
  practiceId!: string;

  /**
   * Identificador asociado a tariff kind concept.
   */
  @Property({ fieldName: 'tariff_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  tariffKindConceptId!: string;

  /**
   * Identificador asociado a bed category concept.
   */
  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  /**
   * Identificador asociado a service catalog.
   */
  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog (inferida)
  serviceCatalogId!: string;

  /**
   * Valor de unit minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_minutes', columnType: 'int', nullable: true })
  unitMinutes?: number;

  /**
   * Valor de minimum units mantenido por la instancia.
   */
  @Property({ fieldName: 'minimum_units', columnType: 'int', nullable: true })
  minimumUnits?: number;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_price',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  unitPrice?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  currencyConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
