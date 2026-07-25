import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'retrieval_sessions' })
export class RetrievalSessions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'principal_id', type: 'uuid' })
  principalId!: string;

  @Property({ fieldName: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'consent_directive_id', type: 'uuid' })
  consentDirectiveId!: string;

  @Property({ fieldName: 'query_text_redacted', columnType: 'text' })
  queryTextRedacted!: string;

  @Property({ fieldName: 'query_hash', columnType: 'varchar' })
  queryHash!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;

  @Property({ columnType: 'varchar' })
  status!: string;
}
