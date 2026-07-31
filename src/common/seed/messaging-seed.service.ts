import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
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
export class MessagingSeedService implements OnApplicationBootstrap {
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
   * Ejecuta la operación on application bootstrap.
   */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.run();
    } catch (error) {
      // Mismo criterio que el resto de seeds: no tumbar el arranque si el
      // esquema aún no existe.
      this.logger.warn({ err: error }, 'Seed de mensajería omitido');
    }
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
    await em.flush();

    inserted += await this.seedChannelConfig(em, now);
    await em.flush();

    if (inserted > 0) {
      this.logger.info({ inserted }, 'Canal de correo por defecto materializado');
    }
    return { inserted };
  }

  /** Canal lógico EMAIL. */
  private async seedChannel(em: EntityManager, now: Date): Promise<number> {
    if (await em.findOne(MessageChannels, { id: MESSAGING_SEED.emailChannelId }))
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
      await em.findOne(MessagingProviders, { id: MESSAGING_SEED.emailProviderId })
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
    em.create(
      ProviderChannelConfigs,
      {
        id: MESSAGING_SEED.emailChannelConfigId,
        providerId: MESSAGING_SEED.emailProviderId,
        channelId: MESSAGING_SEED.emailChannelId,
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
