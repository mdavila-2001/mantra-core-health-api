import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_event_user_data`.
 */
@Entity({ schema: 'ads', tableName: 'conversion_event_user_data' })
export class ConversionEventUserData {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a server conversion event.
   */
  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  /**
   * Valor de external user id hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_user_id_hash',
    columnType: 'varchar',
    nullable: true,
  })
  externalUserIdHash?: string;

  /**
   * Valor de email hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'email_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  emailHashSha256?: string;

  /**
   * Valor de phone hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'phone_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  phoneHashSha256?: string;

  /**
   * Valor de first name hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'first_name_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  firstNameHashSha256?: string;

  /**
   * Valor de last name hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_name_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  lastNameHashSha256?: string;

  /**
   * Valor de city hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'city_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  cityHashSha256?: string;

  /**
   * Valor de country code hash sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'country_code_hash_sha256',
    columnType: 'varchar',
    nullable: true,
  })
  countryCodeHashSha256?: string;

  /**
   * Valor de client ip address encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'client_ip_address_encrypted',
    columnType: 'text',
    nullable: true,
  })
  clientIpAddressEncrypted?: string;

  /**
   * Valor de client user agent encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'client_user_agent_encrypted',
    columnType: 'text',
    nullable: true,
  })
  clientUserAgentEncrypted?: string;

  /**
   * Identificador asociado a click.
   */
  @Property({ fieldName: 'click_id', columnType: 'varchar', nullable: true })
  clickId?: string;

  /**
   * Identificador asociado a browser.
   */
  @Property({ fieldName: 'browser_id', columnType: 'varchar', nullable: true })
  browserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
