import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_plans`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_plans' })
export class InsurancePlans {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance product.
   */
  @Property({ fieldName: 'insurance_product_id', type: 'uuid' }) // FK → insurance.insurance_products
  insuranceProductId!: string;

  /**
   * Valor de plan code mantenido por la instancia.
   */
  @Property({ fieldName: 'plan_code', columnType: 'varchar' })
  planCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a plan type concept.
   */
  @Property({ fieldName: 'plan_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  planTypeConceptId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Prima de lista MENSUAL del plan, en la moneda del plan (`currencyConceptId`).
   *
   * Es el denominador **estimado** del loss ratio del tablero de siniestralidad
   * (v4.2.14, subtarea 3.1): primas devengadas = coberturas vigentes × prima ×
   * meses prorrateados. No es la prima de cada póliza. `undefined` = la
   * aseguradora todavía no la declaró; el tablero lo informa como «sin prima
   * registrada» y deja el loss ratio en `null`, nunca en cero. La carga la
   * consola de planes (`POST .../plans`, `PUT /insurance-plans/:id/premium`);
   * ningún seed la inventa. Cadena decimal, como todo importe del módulo.
   */
  @Property({
    fieldName: 'monthly_premium_amount',
    columnType: 'numeric',
    nullable: true,
  })
  monthlyPremiumAmount?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  /**
   * Identificador asociado a policy document file.
   */
  @Property({
    fieldName: 'policy_document_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  policyDocumentFileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
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
