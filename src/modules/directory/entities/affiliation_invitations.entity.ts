import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Invitación de afiliación por código o QR (doctores o personal de apoyo). Un solo uso para una persona específica, o varios usos.
 */
@Entity({ schema: 'directory', tableName: 'affiliation_invitations' })
export class AffiliationInvitations {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `kind_concept_id`. */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /** Columna `target_person_id`. */
  @Property({ fieldName: 'target_person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  targetPersonId?: string;

  /** Columna `token_hash`. */
  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  /** Columna `max_uses`. */
  @Property({ fieldName: 'max_uses', columnType: 'int' })
  maxUses!: number;

  /** Columna `uses_count`. */
  @Property({ fieldName: 'uses_count', columnType: 'int' })
  usesCount!: number;

  /** Columna `expires_at`. */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /** Columna `role_template_id`. */
  @Property({ fieldName: 'role_template_id', type: 'uuid', nullable: true }) // FK → delegated_access.role_templates
  roleTemplateId?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;
}
