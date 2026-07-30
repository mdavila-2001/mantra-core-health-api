import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `employees`.
 */
@Entity({ schema: 'erp', tableName: 'employees' })
export class Employees {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a person user.
   */
  @Property({ fieldName: 'person_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  personUserId?: string;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @Property({ fieldName: 'full_name', columnType: 'varchar' })
  fullName!: string;

  /**
   * Identificador asociado a role concept.
   */
  @Property({ fieldName: 'role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  roleConceptId?: string;

  /**
   * Valor de hire date mantenido por la instancia.
   */
  @Property({ fieldName: 'hire_date', columnType: 'date', nullable: true })
  hireDate?: Date;

  /**
   * Valor de base salary mantenido por la instancia.
   */
  @Property({ fieldName: 'base_salary', columnType: 'numeric', nullable: true })
  baseSalary?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a payment method concept.
   */
  @Property({
    fieldName: 'payment_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentMethodConceptId?: string;

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

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
