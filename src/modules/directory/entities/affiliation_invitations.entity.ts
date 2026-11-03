import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `affiliation_invitations`.
 */
@Entity({ schema: 'directory', tableName: 'affiliation_invitations' })
export class AffiliationInvitations {
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
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Identificador asociado a target person.
   */
  @Property({ fieldName: 'target_person_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  targetPersonId?: string;

  /**
   * Valor de token hash mantenido por la instancia.
   */
  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  /**
   * Valor de max uses mantenido por la instancia.
   */
  @Property({ fieldName: 'max_uses', columnType: 'int' })
  maxUses!: number;

  /**
   * Valor de uses count mantenido por la instancia.
   */
  @Property({ fieldName: 'uses_count', columnType: 'int' })
  usesCount!: number;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Identificador asociado a role template.
   */
  @Property({ fieldName: 'role_template_id', type: 'uuid', nullable: true }) // FK → delegated_access.role_templates (inferida)
  roleTemplateId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  createdByUserId!: string;

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
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
