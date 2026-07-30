import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `system_ops_data_classifications`.
 */
@Entity({ schema: 'system_ops', tableName: 'data_classifications' })
export class SystemOpsDataClassifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  rank?: number;

  /**
   * Valor de is pii mantenido por la instancia.
   */
  @Property({ fieldName: 'is_pii', type: 'boolean', nullable: true })
  isPii?: boolean;

  /**
   * Valor de is phi mantenido por la instancia.
   */
  @Property({ fieldName: 'is_phi', type: 'boolean', nullable: true })
  isPhi?: boolean;

  /**
   * Valor de handling rules json mantenido por la instancia.
   */
  @Property({
    fieldName: 'handling_rules_json',
    type: 'json',
    columnType: 'jsonb',
  })
  handlingRulesJson!: unknown;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
