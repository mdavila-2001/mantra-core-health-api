import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `retrieval_sessions`.
 */
@Entity({ schema: 'vector_rag', tableName: 'retrieval_sessions' })
export class RetrievalSessions {
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
   * Identificador asociado a principal.
   */
  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' })
  agentId!: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a consent directive.
   */
  @Property({ fieldName: 'consent_directive_id', type: 'uuid' })
  consentDirectiveId!: string;

  /**
   * Valor de query text redacted mantenido por la instancia.
   */
  @Property({ fieldName: 'query_text_redacted', columnType: 'text' })
  queryTextRedacted!: string;

  /**
   * Valor de query hash mantenido por la instancia.
   */
  @Property({ fieldName: 'query_hash', columnType: 'varchar' })
  queryHash!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;
}
