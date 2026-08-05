import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_legal_holds`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_legal_holds' })
export class ObjectLegalHolds {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object version.
   */
  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de legal case reference mantenido por la instancia.
   */
  @Property({ fieldName: 'legal_case_reference', columnType: 'varchar' })
  legalCaseReference!: string;

  /**
   * Valor de hold state mantenido por la instancia.
   */
  @Property({ fieldName: 'hold_state', columnType: 'varchar' })
  holdState!: string;

  /**
   * Identificador asociado a placed by user.
   */
  @Property({ fieldName: 'placed_by_user_id', type: 'uuid' })
  placedByUserId!: string;

  /**
   * Valor de placed at mantenido por la instancia.
   */
  @Property({ fieldName: 'placed_at', columnType: 'timestamptz' })
  placedAt!: Date;

  /**
   * Valor de released at mantenido por la instancia.
   */
  @Property({ fieldName: 'released_at', columnType: 'timestamptz' })
  releasedAt!: Date;
}
