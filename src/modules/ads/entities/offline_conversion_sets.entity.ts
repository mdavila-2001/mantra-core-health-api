import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `offline_conversion_sets`.
 */
@Entity({ schema: 'ads', tableName: 'offline_conversion_sets' })
export class OfflineConversionSets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a upload source concept.
   */
  @Property({ fieldName: 'upload_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  uploadSourceConceptId!: string;

  /**
   * Valor de total events mantenido por la instancia.
   */
  @Property({ fieldName: 'total_events', columnType: 'int', nullable: true })
  totalEvents?: number;

  /**
   * Valor de matched events mantenido por la instancia.
   */
  @Property({ fieldName: 'matched_events', columnType: 'int', nullable: true })
  matchedEvents?: number;

  /**
   * Valor de match rate mantenido por la instancia.
   */
  @Property({ fieldName: 'match_rate', columnType: 'numeric', nullable: true })
  matchRate?: string;

  /**
   * Valor de attributed value mantenido por la instancia.
   */
  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de uploaded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'uploaded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  uploadedAt?: Date;

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
