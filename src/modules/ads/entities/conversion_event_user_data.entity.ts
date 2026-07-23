import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'conversion_event_user_data' })
export class ConversionEventUserData {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  @Property({
    fieldName: 'external_user_id_hash',
    columnType: 'varchar',
    nullable: true,
  })
  externalUserIdHash?: string;

  @Property({
    fieldName: 'email_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  emailHashSha256?: string;

  @Property({
    fieldName: 'phone_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  phoneHashSha256?: string;

  @Property({
    fieldName: 'first_name_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  firstNameHashSha256?: string;

  @Property({
    fieldName: 'last_name_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  lastNameHashSha256?: string;

  @Property({
    fieldName: 'city_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  cityHashSha256?: string;

  @Property({
    fieldName: 'country_code_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  countryCodeHashSha256?: string;

  @Property({
    fieldName: 'client_ip_address_encrypted',
    columnType: 'text',
    nullable: true,
  })
  clientIpAddressEncrypted?: string;

  @Property({
    fieldName: 'client_user_agent_encrypted',
    columnType: 'text',
    nullable: true,
  })
  clientUserAgentEncrypted?: string;

  @Property({ fieldName: 'click_id', columnType: 'varchar', nullable: true })
  clickId?: string;

  @Property({ fieldName: 'browser_id', columnType: 'varchar', nullable: true })
  browserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
