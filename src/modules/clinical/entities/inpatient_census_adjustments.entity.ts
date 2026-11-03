import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inpatient_census_adjustments`.
 */
@Entity({ schema: 'clinical', tableName: 'inpatient_census_adjustments' })
export class InpatientCensusAdjustments {
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
   * Identificador asociado a census day.
   */
  @Property({ fieldName: 'census_day_id', type: 'uuid' }) // FK (destino no resuelto)
  censusDayId!: string;

  /**
   * Valor de field code mantenido por la instancia.
   */
  @Property({ fieldName: 'field_code', columnType: 'varchar' })
  fieldCode!: string;

  /**
   * Valor de previous value mantenido por la instancia.
   */
  @Property({ fieldName: 'previous_value', columnType: 'int' })
  previousValue!: number;

  /**
   * Valor de new value mantenido por la instancia.
   */
  @Property({ fieldName: 'new_value', columnType: 'int' })
  newValue!: number;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text' })
  reasonText!: string;

  /**
   * Identificador asociado a entry ref.
   */
  @Property({ fieldName: 'entry_ref_id', type: 'uuid', nullable: true })
  entryRefId?: string;

  /**
   * Identificador asociado a adjusted by user.
   */
  @Property({ fieldName: 'adjusted_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  adjustedByUserId!: string;

  /**
   * Identificador asociado a request.
   */
  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
