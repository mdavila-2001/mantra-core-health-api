import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_opening_hours`.
 *
 * Un turno del horario de atención declarado en el alta: día ISO (1 = lunes),
 * ordinal 1 o 2 dentro del día, apertura y cierre (`24:00` cierra el día). Sin
 * `branchId` ni `medicalFacilitySiteId` es la casa central.
 */
@Entity({ schema: 'directory', tableName: 'tenant_opening_hours' })
export class TenantOpeningHours {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  @Property({
    fieldName: 'medical_facility_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenant_medical_facility_sites
  medicalFacilitySiteId?: string;

  @Property({ fieldName: 'day_of_week', columnType: 'smallint' })
  dayOfWeek!: number;

  @Property({ fieldName: 'shift_ordinal', columnType: 'smallint' })
  shiftOrdinal!: number;

  @Property({ fieldName: 'opens_at', columnType: 'time' })
  opensAt!: string;

  @Property({ fieldName: 'closes_at', columnType: 'time' })
  closesAt!: string;

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
