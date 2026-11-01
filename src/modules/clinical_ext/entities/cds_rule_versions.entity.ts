import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cds_rule_versions`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'cds_rule_versions' })
export class CdsRuleVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a cds rule.
   */
  @Property({ fieldName: 'cds_rule_id', type: 'uuid' }) // FK → clinical_ext.cds_rules (inferida)
  cdsRuleId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de logic json mantenido por la instancia.
   */
  @Property({
    fieldName: 'logic_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  logicJson?: unknown;

  /**
   * Valor de message template mantenido por la instancia.
   */
  @Property({
    fieldName: 'message_template',
    columnType: 'text',
    nullable: true,
  })
  messageTemplate?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  severityConceptId!: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;
}
