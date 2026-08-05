import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cash_registers`.
 */
@Entity({ schema: 'payments', tableName: 'cash_registers' })
export class CashRegisters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true })
  careSpaceId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  code?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  /**
   * Valor de last opened at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastOpenedAt?: Date;

  /**
   * Valor de last closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastClosedAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
