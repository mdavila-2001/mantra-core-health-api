import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'residency_policies' })
export class ResidencyPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'allowed_country_codes', type: 'array' })
  allowedCountryCodes!: string[];

  @Property({ fieldName: 'forbidden_country_codes', type: 'array' })
  forbiddenCountryCodes!: string[];

  @Property({ fieldName: 'allowed_region_codes', type: 'array' })
  allowedRegionCodes!: string[];

  @Property({ fieldName: 'requires_in_country_backup', type: 'boolean' })
  requiresInCountryBackup!: boolean;

  @Property({ fieldName: 'cross_border_transfer_basis', columnType: 'varchar' })
  crossBorderTransferBasis!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
