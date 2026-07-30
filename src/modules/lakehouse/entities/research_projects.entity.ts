import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `research_projects`.
 */
@Entity({ schema: 'lakehouse', tableName: 'research_projects' })
export class ResearchProjects {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de protocol reference mantenido por la instancia.
   */
  @Property({ fieldName: 'protocol_reference', columnType: 'varchar' })
  protocolReference!: string;

  /**
   * Identificador asociado a principal investigator.
   */
  @Property({ fieldName: 'principal_investigator_id', type: 'uuid' })
  principalInvestigatorId!: string;

  /**
   * Valor de ethics approval reference mantenido por la instancia.
   */
  @Property({ fieldName: 'ethics_approval_reference', columnType: 'varchar' })
  ethicsApprovalReference!: string;

  /**
   * Valor de approved from mantenido por la instancia.
   */
  @Property({ fieldName: 'approved_from', columnType: 'date' })
  approvedFrom!: Date;

  /**
   * Valor de approved to mantenido por la instancia.
   */
  @Property({ fieldName: 'approved_to', columnType: 'date' })
  approvedTo!: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
