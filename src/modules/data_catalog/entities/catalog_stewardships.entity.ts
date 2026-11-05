import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_stewardships`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_stewardships' })
export class CatalogStewardships {
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
   * Identificador asociado a domain.
   */
  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  domainId?: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  objectId?: string;

  /**
   * Valor de role kind mantenido por la instancia.
   */
  @Property({ fieldName: 'role_kind', columnType: 'varchar' })
  roleKind!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  userId?: string;

  /**
   * Valor de team code mantenido por la instancia.
   */
  @Property({ fieldName: 'team_code', columnType: 'varchar', nullable: true })
  teamCode?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
