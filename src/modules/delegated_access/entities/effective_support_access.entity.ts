import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Tabla derivada: qué puede hacer cada persona de apoyo sobre cada doctor/servicio/espacio. Se recalcula al cambiar permisos, estructura o vínculos.
 */
@Entity({ schema: 'delegated_access', tableName: 'effective_support_access' })
export class EffectiveSupportAccess {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `user_id`. */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `practitioner_role_assignment_id`. */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  /** Columna `healthcare_service_id`. */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  /** Columna `care_space_id`. */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /** Columna `permission_code`. */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /** Columna `grant_id`. */
  @Property({ fieldName: 'grant_id', type: 'uuid' }) // FK → delegated_access.support_scope_grants
  grantId!: string;

  /** Columna `refreshed_at`. */
  @Property({ fieldName: 'refreshed_at', columnType: 'timestamptz' })
  refreshedAt!: Date;
}
