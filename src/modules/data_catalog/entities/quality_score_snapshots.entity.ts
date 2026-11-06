import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quality_score_snapshots`.
 */
@Entity({ schema: 'data_catalog', tableName: 'quality_score_snapshots' })
export class QualityScoreSnapshots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de scope kind mantenido por la instancia.
   */
  @Property({ fieldName: 'scope_kind', columnType: 'varchar' })
  scopeKind!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  objectId?: string;

  /**
   * Identificador asociado a domain.
   */
  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  domainId?: string;

  /**
   * Valor de as of mantenido por la instancia.
   */
  @Property({ fieldName: 'as_of', columnType: 'timestamptz' })
  asOf!: Date;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(5,2)' })
  score!: string;

  /**
   * Valor de components json mantenido por la instancia.
   */
  @Property({ fieldName: 'components_json', type: 'json', columnType: 'jsonb' })
  componentsJson!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
