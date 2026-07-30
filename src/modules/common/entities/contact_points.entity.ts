import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contact_points`.
 */
@Entity({ schema: 'common', tableName: 'contact_points' })
export class ContactPoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a owner type concept.
   */
  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  /**
   * Identificador asociado a owner.
   */
  @Property({ fieldName: 'owner_id', type: 'uuid' })
  ownerId!: string;

  /**
   * Identificador asociado a system concept.
   */
  @Property({ fieldName: 'system_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  systemConceptId!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  value!: string;

  /**
   * Identificador asociado a use concept.
   */
  @Property({ fieldName: 'use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  useConceptId?: string;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  rank?: number;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  verified?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
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
