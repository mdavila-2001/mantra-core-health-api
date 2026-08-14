import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `residency_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'residency_policies' })
export class ResidencyPolicies {
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
   * Valor de allowed country codes mantenido por la instancia.
   */
  @Property({ fieldName: 'allowed_country_codes', type: 'array' })
  allowedCountryCodes!: string[];

  /**
   * Valor de forbidden country codes mantenido por la instancia.
   */
  @Property({
    fieldName: 'forbidden_country_codes',
    type: 'array',
    nullable: true,
  })
  forbiddenCountryCodes?: string[];

  /**
   * Valor de allowed region codes mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_region_codes',
    type: 'array',
    nullable: true,
  })
  allowedRegionCodes?: string[];

  /**
   * Valor de requires in country backup mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_in_country_backup', type: 'boolean' })
  requiresInCountryBackup!: boolean;

  /**
   * Valor de cross border transfer basis mantenido por la instancia.
   */
  @Property({
    fieldName: 'cross_border_transfer_basis',
    columnType: 'varchar',
    nullable: true,
  })
  crossBorderTransferBasis?: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
