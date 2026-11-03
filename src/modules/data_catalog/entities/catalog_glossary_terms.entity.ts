import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_glossary_terms`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_glossary_terms' })
export class CatalogGlossaryTerms {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de term code mantenido por la instancia.
   */
  @Property({ fieldName: 'term_code', columnType: 'varchar' })
  termCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de definition mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  definition!: string;

  /**
   * Identificador asociado a domain.
   */
  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  domainId?: string;

  /**
   * Valor de synonyms mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  synonyms?: unknown;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de current revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'current_revision_no', columnType: 'int' })
  currentRevisionNo!: number;

  /**
   * Valor de approved revision no mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_revision_no',
    columnType: 'int',
    nullable: true,
  })
  approvedRevisionNo?: number;

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
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
