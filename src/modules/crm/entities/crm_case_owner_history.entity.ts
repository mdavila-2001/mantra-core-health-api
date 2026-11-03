import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_case_owner_history`.
 */
@Entity({ schema: 'crm', tableName: 'crm_case_owner_history' })
export class CrmCaseOwnerHistory {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm case.
   */
  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases (inferida)
  crmCaseId!: string;

  /**
   * Identificador asociado a from owner user.
   */
  @Property({ fieldName: 'from_owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  fromOwnerUserId?: string;

  /**
   * Identificador asociado a to owner user.
   */
  @Property({ fieldName: 'to_owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  toOwnerUserId?: string;

  /**
   * Valor de changed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  changedAt?: Date;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  changedByUserId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
