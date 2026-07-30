import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cohort_definitions`.
 */
@Entity({ schema: 'lakehouse', tableName: 'cohort_definitions' })
export class CohortDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a research project.
   */
  @Property({ fieldName: 'research_project_id', type: 'uuid' })
  researchProjectId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

  /**
   * Valor de inclusion expression mantenido por la instancia.
   */
  @Property({ fieldName: 'inclusion_expression', columnType: 'text' })
  inclusionExpression!: string;

  /**
   * Valor de exclusion expression mantenido por la instancia.
   */
  @Property({ fieldName: 'exclusion_expression', columnType: 'text' })
  exclusionExpression!: string;

  /**
   * Identificador asociado a deidentification profile.
   */
  @Property({ fieldName: 'deidentification_profile_id', type: 'uuid' })
  deidentificationProfileId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
