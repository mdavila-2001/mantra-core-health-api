import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_assertions`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_assertions' })
export class TestAssertions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a test case.
   */
  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  /**
   * Identificador asociado a assertion type concept.
   */
  @Property({ fieldName: 'assertion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assertionTypeConceptId!: string;

  /**
   * Valor de json path mantenido por la instancia.
   */
  @Property({ fieldName: 'json_path', columnType: 'varchar', nullable: true })
  jsonPath?: string;

  /**
   * Identificador asociado a operator concept.
   */
  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  /**
   * Valor de expected value mantenido por la instancia.
   */
  @Property({ fieldName: 'expected_value', columnType: 'text', nullable: true })
  expectedValue?: string;

  /**
   * Valor de tolerance mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  tolerance?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
