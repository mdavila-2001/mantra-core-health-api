import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `value_set_rules`.
 */
@Entity({ schema: 'terminology', tableName: 'value_set_rules' })
export class ValueSetRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a value set version.
   */
  @Property({ fieldName: 'value_set_version_id', type: 'uuid' }) // FK → terminology.value_set_versions
  valueSetVersionId!: string;

  /**
   * Identificador asociado a code system.
   */
  @Property({ fieldName: 'code_system_id', type: 'uuid' }) // FK → terminology.code_systems
  codeSystemId!: string;

  /**
   * Identificador asociado a operator concept.
   */
  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  /**
   * Valor de property mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  property?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  value?: string;

  /**
   * Valor de included mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  included!: boolean;

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
