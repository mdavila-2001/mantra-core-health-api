import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `effective_support_access`.
 */
@Entity({ schema: 'delegated_access', tableName: 'effective_support_access' })
export class EffectiveSupportAccess {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments (inferida)
  practitionerRoleAssignmentId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services (inferida)
  healthcareServiceId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  /**
   * Valor de permission code mantenido por la instancia.
   */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /**
   * Identificador asociado a grant.
   */
  @Property({ fieldName: 'grant_id', type: 'uuid' }) // FK (destino no resuelto)
  grantId!: string;

  /**
   * Valor de refreshed at mantenido por la instancia.
   */
  @Property({ fieldName: 'refreshed_at', columnType: 'timestamptz' })
  refreshedAt!: Date;
}
