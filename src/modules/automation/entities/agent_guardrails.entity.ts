import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agent_guardrails' })
export class AgentGuardrails {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  @Property({ fieldName: 'guardrail_policy_id', type: 'uuid' }) // FK → automation.guardrail_policies
  guardrailPolicyId!: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean' })
  isEnabled!: boolean;

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
