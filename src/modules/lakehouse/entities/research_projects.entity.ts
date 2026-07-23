import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'research_projects' })
export class ResearchProjects {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'protocol_reference', columnType: 'varchar' })
  protocolReference!: string;

  @Property({ fieldName: 'principal_investigator_id', type: 'uuid' })
  principalInvestigatorId!: string;

  @Property({ fieldName: 'ethics_approval_reference', columnType: 'varchar' })
  ethicsApprovalReference!: string;

  @Property({ fieldName: 'approved_from', columnType: 'date' })
  approvedFrom!: Date;

  @Property({ fieldName: 'approved_to', columnType: 'date' })
  approvedTo!: Date;

  @Property({ columnType: 'varchar' })
  state!: string;
}
