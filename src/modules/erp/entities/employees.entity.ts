import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'employees' })
export class Employees {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'person_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  personUserId?: string;

  @Property({ fieldName: 'full_name', columnType: 'varchar' })
  fullName!: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  roleConceptId?: string;

  @Property({ fieldName: 'hire_date', columnType: 'date', nullable: true })
  hireDate?: Date;

  @Property({ fieldName: 'base_salary', columnType: 'numeric', nullable: true })
  baseSalary?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'payment_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentMethodConceptId?: string;

  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
