import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Cada canje de una invitación de afiliación.
 */
@Entity({ schema: 'directory', tableName: 'affiliation_invitation_uses' })
export class AffiliationInvitationUses {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización dueña de la fila (la del padre, verificada por el modelo). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `affiliation_invitation_id`. */
  @Property({ fieldName: 'affiliation_invitation_id', type: 'uuid' }) // FK → directory.affiliation_invitations
  affiliationInvitationId!: string;

  /** Columna `used_by_user_id`. */
  @Property({ fieldName: 'used_by_user_id', type: 'uuid' }) // FK → iam.users
  usedByUserId!: string;

  /** Columna `occurred_at`. */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /** Columna `outcome_concept_id`. */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;
}
