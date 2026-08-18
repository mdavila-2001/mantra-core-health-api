import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  MessageChannels,
  MessagingProviders,
  ProviderChannelConfigs,
} from '../../modules/messaging/entities';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';

/**
 * Identificadores deterministas del canal de correo por defecto.
 *
 * Existen porque `notification_requests.channel_id` es una FK NOT NULL y el
 * módulo `messaging` no expone ningún caso de uso para dar de alta canales ni
 * proveedores: sin estas filas ningún flujo del backend puede pedir un correo.
 */
export const MESSAGING_SEED = {
  emailChannelId: deterministicId('seed:message-channel:email'),
  emailChannelCode: 'EMAIL',
  emailProviderId: deterministicId('seed:messaging-provider:email'),
  emailProviderCode: 'DEFAULT_EMAIL',
  emailChannelConfigId: deterministicId('seed:provider-channel-config:email'),

  /* --- Canal in-app (carril P1) -------------------------------------------
     La campana necesita un canal igual que el correo, y por el mismo motivo:
     `notification_requests.channel_id` es una FK NOT NULL y el módulo no
     expone alta de canales. La diferencia es que este canal **no sale a
     ningún proveedor** — su entrega es escribir en `in_app_notifications`,
     que es lo que `deliverNotification` ya hacía para el tipo in-app y no
     tenía canal con el que ejercitarse. */
  inAppChannelId: deterministicId('seed:message-channel:in-app'),
  inAppChannelCode: 'IN_APP',
  inAppProviderId: deterministicId('seed:messaging-provider:in-app'),
  inAppProviderCode: 'DEFAULT_IN_APP',
  inAppChannelConfigId: deterministicId('seed:provider-channel-config:in-app'),
} as const;

/**
 * Materializa el canal EMAIL con su proveedor y su configuración activa.
 *
 * Quién entrega realmente el correo lo decide el worker de mensajería por
 * entorno (`GoogleEmailClient` si están las credenciales OAuth2,
 * `mock-provider-server` si no): estas filas describen QUE existe un canal de
 * correo con un proveedor configurado, no CÓMO se conecta. Por eso el proveedor
 * declara `adapter_code = 'WORKER_DISPATCHED'` en vez de nombrar a Gmail.
 */
@Injectable()
export class MessagingSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Valor de orm requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagingSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración lo invoquen
   * tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(): Promise<{
    /**
     * Valor de inserted mantenido por la instancia.
     */
    inserted: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    // Canal y proveedor son padres de la configuración: se flushean antes.
    inserted += await this.seedChannel(em, now);
    inserted += await this.seedProvider(em, now);
    inserted += await this.seedInAppChannel(em, now);
    inserted += await this.seedInAppProvider(em, now);
    await em.flush();

    inserted += await this.seedChannelConfig(em, now);
    inserted += await this.seedInAppChannelConfig(em, now);
    await em.flush();

    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Canales por defecto (correo e in-app) materializados',
      );
    }
    return { inserted };
  }

  /** Canal lógico EMAIL. */
  /**
   * El id **vigente** de un canal, buscado por su código.
   *
   * Existe porque el id de esta fila puede no ser el que este seed calcula: el
   * paquete de `salud-db` siembra los mismos canales con uuid derivados de otra
   * forma, y el que gana es el que ya está en la base. Las filas hijas tienen
   * que apuntar a ése o la FK las rechaza.
   *
   * @param em - Contexto de persistencia.
   * @param code - Código del canal.
   * @param porDefecto - El id que este seed usaría si tuviera que crearlo.
   * @returns El id que hay que referenciar.
   */
  private async idDeCanal(
    em: EntityManager,
    code: string,
    porDefecto: string,
  ): Promise<string> {
    const fila = await em.findOne(MessageChannels, { code });
    return fila?.id ?? porDefecto;
  }

  /** El id vigente de un proveedor, por su código. Ver {@link idDeCanal}. */
  private async idDeProveedor(
    em: EntityManager,
    code: string,
    porDefecto: string,
  ): Promise<string> {
    const fila = await em.findOne(MessagingProviders, { code });
    return fila?.id ?? porDefecto;
  }

  private async seedChannel(em: EntityManager, now: Date): Promise<number> {
    // Mismo criterio que {@link seedInAppChannel}: la clave natural es la que
    // tiene única, y es la que decide si esta fila ya existe.
    if (
      await em.findOne(MessageChannels, {
        code: MESSAGING_SEED.emailChannelCode,
      })
    )
      return 0;
    em.create(
      MessageChannels,
      {
        id: MESSAGING_SEED.emailChannelId,
        code: MESSAGING_SEED.emailChannelCode,
        name: 'Email',
        channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_EMAIL,
        supportsTemplates: true,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /** Proveedor genérico cuyo envío efectivo resuelve el worker. */
  private async seedProvider(em: EntityManager, now: Date): Promise<number> {
    if (
      await em.findOne(MessagingProviders, {
        code: MESSAGING_SEED.emailProviderCode,
      })
    )
      return 0;
    em.create(
      MessagingProviders,
      {
        id: MESSAGING_SEED.emailProviderId,
        code: MESSAGING_SEED.emailProviderCode,
        name: 'Default email provider',
        providerTypeConceptId: CONCEPTS.MSG_PROVIDER_TYPE_EMAIL,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterCode: 'WORKER_DISPATCHED',
        adapterVersion: '1',
        isBuiltin: true,
        // El adaptador real (Gmail o el emulador) no reporta estado de vuelta a
        // este backend: la entrega se da por hecha cuando el proveedor la acepta.
        supportsWebhooks: false,
        supportsPolling: false,
        supportsDeliveryReceipts: false,
        supportsReadReceipts: false,
        supportsClickReceipts: false,
        supportsReplyReceipts: false,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /**
   * Canal lógico IN_APP (carril P1).
   *
   * `supportsTemplates: false` a propósito: el texto de una notificación de la
   * campana lo arma el módulo que la emite, con el nombre del médico o el de la
   * receta ya resueltos. Una plantilla de `message_templates` acá obligaría a
   * dar de alta una fila por disparador antes de poder emitir.
   */
  private async seedInAppChannel(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    // Por CÓDIGO y no por id: `uq_message_channels_code` es la restricción que
    // existe, y el paquete de seeds ya sembró `IN_APP` con un uuid derivado de
    // otra forma. Buscar por id no lo encontraba y el INSERT moría contra esa
    // única — con el arnés de integración abortando la suite entera.
    if (
      await em.findOne(MessageChannels, {
        code: MESSAGING_SEED.inAppChannelCode,
      })
    )
      return 0;
    em.create(
      MessageChannels,
      {
        id: MESSAGING_SEED.inAppChannelId,
        code: MESSAGING_SEED.inAppChannelCode,
        name: 'In-app',
        channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
        supportsTemplates: false,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /**
   * Proveedor del canal in-app: el propio backend.
   *
   * `adapter_code = 'IN_APP_DIRECT'` y no `'WORKER_DISPATCHED'` porque la
   * diferencia es real y se lee en la auditoría: el correo lo entrega un
   * tercero cuya latencia y cuyos fallos no controlamos, y esto lo entrega
   * una escritura nuestra en la misma transacción. Todos los `supports*` van
   * en `false`: no hay acuses de un proveedor que no existe.
   */
  private async seedInAppProvider(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    if (
      await em.findOne(MessagingProviders, {
        code: MESSAGING_SEED.inAppProviderCode,
      })
    )
      return 0;
    em.create(
      MessagingProviders,
      {
        id: MESSAGING_SEED.inAppProviderId,
        code: MESSAGING_SEED.inAppProviderCode,
        name: 'In-app delivery',
        providerTypeConceptId: CONCEPTS.MSG_PROVIDER_TYPE_IN_APP,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterCode: 'IN_APP_DIRECT',
        adapterVersion: '1',
        isBuiltin: true,
        supportsWebhooks: false,
        supportsPolling: false,
        supportsDeliveryReceipts: false,
        supportsReadReceipts: false,
        supportsClickReceipts: false,
        supportsReplyReceipts: false,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /** Configuración activa que une el proveedor in-app con su canal. */
  private async seedInAppChannelConfig(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    if (
      await em.findOne(ProviderChannelConfigs, {
        id: MESSAGING_SEED.inAppChannelConfigId,
      })
    )
      return 0;
    const channelId = await this.idDeCanal(
      em,
      MESSAGING_SEED.inAppChannelCode,
      MESSAGING_SEED.inAppChannelId,
    );
    const providerId = await this.idDeProveedor(
      em,
      MESSAGING_SEED.inAppProviderCode,
      MESSAGING_SEED.inAppProviderId,
    );
    em.create(
      ProviderChannelConfigs,
      {
        id: MESSAGING_SEED.inAppChannelConfigId,
        providerId,
        channelId,
        tenantId: SEED.tenantId,
        priority: 1,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterConfigVersion: 1,
        trackingModeConceptId: CONCEPTS.MSG_TRACKING_MODE_NONE,
        statusMappingVersion: 1,
        enabledAt: now,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /** Configuración activa que une proveedor y canal para el tenant por defecto. */
  private async seedChannelConfig(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    if (
      await em.findOne(ProviderChannelConfigs, {
        id: MESSAGING_SEED.emailChannelConfigId,
      })
    )
      return 0;
    const channelId = await this.idDeCanal(
      em,
      MESSAGING_SEED.emailChannelCode,
      MESSAGING_SEED.emailChannelId,
    );
    const providerId = await this.idDeProveedor(
      em,
      MESSAGING_SEED.emailProviderCode,
      MESSAGING_SEED.emailProviderId,
    );
    em.create(
      ProviderChannelConfigs,
      {
        id: MESSAGING_SEED.emailChannelConfigId,
        providerId,
        channelId,
        tenantId: SEED.tenantId,
        priority: 1,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterConfigVersion: 1,
        trackingModeConceptId: CONCEPTS.MSG_TRACKING_MODE_NONE,
        statusMappingVersion: 1,
        enabledAt: now,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }
}
