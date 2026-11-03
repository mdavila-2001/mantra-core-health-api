import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `affiliation_invitation_uses`.
 */
@Entity({ schema: 'directory', tableName: 'affiliation_invitation_uses' })
export class AffiliationInvitationUses {
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
   * Identificador asociado a affiliation invitation.
   */
  @Property({ fieldName: 'affiliation_invitation_id', type: 'uuid' }) // FK → directory.affiliation_invitations (inferida)
  affiliationInvitationId!: string;

  /**
   * Identificador asociado a used by user.
   */
  @Property({ fieldName: 'used_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  usedByUserId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  outcomeConceptId!: string;
}
