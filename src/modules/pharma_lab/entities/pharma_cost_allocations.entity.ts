import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Imputación analítica de una operación contable a las dimensiones propias del
 * laboratorio (spec 5649-5661): producto, proyecto, sede, área, visitador y
 * campaña.
 *
 * **No duplica la contabilidad.** El asiento vive en `accounting`, que es donde
 * viven activos, pasivos, patrimonio, ingresos, gastos, facturas y comprobantes
 * de todas las organizaciones del sistema. Lo que `accounting` no tiene es el
 * eje «visitador» ni «campaña» ni «producto farmacéutico», y eso es exactamente
 * lo que esta tabla agrega para poder responder «rentabilidad por producto» y
 * «costos por proyecto» sin forkear el módulo contable.
 */
@Entity({ schema: 'pharma_lab', tableName: 'pharma_cost_allocations' })
export class PharmaCostAllocations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Laboratorio propietario.
   */
  @Property({ fieldName: 'pharma_lab_id', type: 'uuid' }) // FK → pharma_lab.pharma_labs
  pharmaLabId!: string;

  /**
   * Asiento contable imputado.
   */
  @Property({ fieldName: 'journal_transaction_id', type: 'uuid' }) // FK → accounting.journal_transactions
  journalTransactionId!: string;

  /**
   * Naturaleza del costo: investigación, desarrollo, producción o comercial.
   */
  @Property({ fieldName: 'cost_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  costTypeConceptId!: string;

  /**
   * Importe imputado.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

  /**
   * Moneda del importe.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Producto imputado.
   */
  @Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true }) // FK → pharma_lab.pharma_products
  pharmaProductId?: string;

  /**
   * Proyecto imputado.
   */
  @Property({
    fieldName: 'project_code',
    columnType: 'varchar',
    nullable: true,
  })
  projectCode?: string;

  /**
   * Sede imputada.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Área imputada.
   */
  @Property({ columnType: 'varchar', nullable: true })
  area?: string;

  /**
   * Visitador imputado.
   */
  @Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true }) // FK → pharma_lab.medical_visitors
  medicalVisitorId?: string;

  /**
   * Campaña imputada.
   */
  @Property({
    fieldName: 'campaign_code',
    columnType: 'varchar',
    nullable: true,
  })
  campaignCode?: string;

  /**
   * Fecha contable de la imputación.
   */
  @Property({ fieldName: 'allocated_on', columnType: 'date' })
  allocatedOn!: string;

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
