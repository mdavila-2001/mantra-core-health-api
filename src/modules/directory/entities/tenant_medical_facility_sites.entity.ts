import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tenant_medical_facility_sites`.
 *
 * La casa central (`site_kind = 'headquarters'`, ordinal 0) y las sucursales
 * (`'branch'`, ordinal 1..50) que el alta declaró. Son sedes **declaradas**:
 * no son `directory.branches` ni `practice.practice_sites`, que se crean al
 * configurar el centro tras la verificación.
 */
@Entity({ schema: 'directory', tableName: 'tenant_medical_facility_sites' })
export class TenantMedicalFacilitySites {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant (denormalizado para el aislamiento por RLS).
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a medical facility.
   */
  @Property({ fieldName: 'medical_facility_id', type: 'uuid' }) // FK → directory.tenant_medical_facilities
  medicalFacilityId!: string;

  /**
   * Tipo de sede: `headquarters` o `branch`.
   */
  @Property({ fieldName: 'site_kind', columnType: 'varchar' })
  siteKind!: 'headquarters' | 'branch';

  /**
   * Posición dentro del establecimiento: 0 la casa central, 1..50 las
   * sucursales en el orden en que se declararon.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Nombre de la sede.
   */
  @Property({ columnType: 'varchar(200)' })
  name!: string;

  /**
   * Líneas de la dirección (al menos una).
   */
  @Property({ fieldName: 'address_lines', type: 'array' })
  addressLines!: string[];

  /**
   * Latitud del punto en el mapa; va junto con la longitud o no va.
   */
  @Property({ columnType: 'numeric', nullable: true })
  latitude?: string;

  /**
   * Longitud del punto en el mapa; va junto con la latitud o no va.
   */
  @Property({ columnType: 'numeric', nullable: true })
  longitude?: string;

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
