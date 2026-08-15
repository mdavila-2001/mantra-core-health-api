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
 * Identificadores deterministas de los canales de mensajería por defecto.
 *
 * Existen porque `notification_requests.channel_id` es una FK NOT NULL y el
 * módulo `messaging` no expone ningún caso de uso para dar de alta canales ni
 * proveedores: sin estas filas ningún flujo del backend puede pedir una
 * notificación por ese canal.
 *
 * Carril 18 amplía esto más allá de EMAIL con el canal **in-app** (que faltaba
 * por completo: sin proveedor ni configuración sembrados, ni siquiera la
 * bandeja interna funcionaba) y con WHATSAPP/SMS/PUSH — estos últimos solo como
 * *tipo* de canal disponible para que el doctor pueda declarar su preferencia;
 * ningún proveedor real los respalda todavía en este entorno (ver
 * `seedUnconfiguredChannel`).
 */
export const MESSAGING_SEED = {
  emailChannelId: deterministicId('seed:message-channel:email'),
  emailChannelCode: 'EMAIL',
  emailProviderId: deterministicId('seed:messaging-provider:email'),
  emailProviderCode: 'DEFAULT_EMAIL',
  emailChannelConfigId: deterministicId('seed:provider-channel-config:email'),

  inAppChannelId: deterministicId('seed:message-channel:in-app'),
  inAppChannelCode: 'IN_APP',
  inAppProviderId: deterministicId('seed:messaging-provider:in-app'),
  inAppProviderCode: 'INTERNAL_IN_APP',
  inAppChannelConfigId: deterministicId('seed:provider-channel-config:in-app'),

  whatsappChannelId: deterministicId('seed:message-channel:whatsapp'),
  whatsappChannelCode: 'WHATSAPP',
  smsChannelId: deterministicId('seed:message-channel:sms'),
  smsChannelCode: 'SMS',
  pushChannelId: deterministicId('seed:message-channel:push'),
  pushChannelCode: 'PUSH',
} as const;

/** Un canal externo aún sin proveedor real conectado en este entorno. */
interface UnconfiguredChannelSpec {
  id: string;
  code: string;
  name: string;
  channelTypeConceptId: string;
}

const UNCONFIGURED_CHANNELS: readonly UnconfiguredChannelSpec[] = [
  {
    id: MESSAGING_SEED.whatsappChannelId,
    code: MESSAGING_SEED.whatsappChannelCode,
    name: 'WhatsApp',
    channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_WHATSAPP,
  },
  {
    id: MESSAGING_SEED.smsChannelId,
    code: MESSAGING_SEED.smsChannelCode,
    name: 'SMS',
    channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_SMS,
  },
  {
    id: MESSAGING_SEED.pushChannelId,
    code: MESSAGING_SEED.pushChannelCode,
    name: 'Push',
    channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_PUSH,
  },
];

/**
 * Materializa los canales de mensajería que el backend necesita para poder
 * emitir notificaciones sin fingir infraestructura que no existe.
 *
 * - **EMAIL**: canal + proveedor + configuración activa. Quién entrega
 *   realmente el correo lo decide el worker por entorno (`GoogleEmailClient`
 *   si están las credenciales OAuth2, `mock-provider-server` si no); estas
 *   filas describen QUE existe un canal de correo con un proveedor
 *   configurado, no CÓMO se conecta.
 * - **IN_APP**: canal + proveedor + configuración activa, íntegramente
 *   interno (nunca sale a un tercero: `deliverNotification` escribe
 *   directamente en `in_app_notifications`). Antes de este seed la fila de
 *   configuración no existía, así que `deliverNotification` rechazaba
 *   cualquier notificación in-app con 412 — la bandeja interna no funcionaba
 *   ni siquiera en desarrollo.
 * - **WHATSAPP / SMS / PUSH**: solo el *canal* (para que exista un
 *   `channel_id` sobre el que declarar una preferencia); deliberadamente sin
 *   proveedor ni configuración, porque ninguno está conectado en este
 *   entorno. Intentar entregar por ellos falla honestamente con
 *   `'El canal no tiene configuración de proveedor activa'` en vez de
 *   simular un envío.
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
    for (const spec of UNCONFIGURED_CHANNELS) {
      inserted += await this.seedUnconfiguredChannel(em, now, spec);
    }
    await em.flush();

    inserted += await this.seedChannelConfig(em, now);
    inserted += await this.seedInAppChannelConfig(em, now);
    await em.flush();

    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Canales de mensajería por defecto materializados',
      );
    }
    return { inserted };
  }

  /** Canal lógico EMAIL. */
  private async seedChannel(em: EntityManager, now: Date): Promise<number> {
    if (
      await em.findOne(MessageChannels, { id: MESSAGING_SEED.emailChannelId })
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
        id: MESSAGING_SEED.emailProviderId,
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

  /** Canal lógico IN_APP. */
  private async seedInAppChannel(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    if (
      await em.findOne(MessageChannels, { id: MESSAGING_SEED.inAppChannelId })
    )
      return 0;
    em.create(
      MessageChannels,
      {
        id: MESSAGING_SEED.inAppChannelId,
        code: MESSAGING_SEED.inAppChannelCode,
        name: 'Notificación interna',
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

  /** Proveedor in-app: la "entrega" es escribir en la bandeja propia, sin tercero. */
  private async seedInAppProvider(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    if (
      await em.findOne(MessagingProviders, {
        id: MESSAGING_SEED.inAppProviderId,
      })
    )
      return 0;
    em.create(
      MessagingProviders,
      {
        id: MESSAGING_SEED.inAppProviderId,
        code: MESSAGING_SEED.inAppProviderCode,
        name: 'Bandeja interna',
        providerTypeConceptId: CONCEPTS.MSG_PROVIDER_TYPE_IN_APP,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterCode: 'IN_APP_INTERNAL',
        adapterVersion: '1',
        isBuiltin: true,
        supportsWebhooks: false,
        supportsPolling: false,
        supportsDeliveryReceipts: false,
        supportsReadReceipts: true,
        supportsClickReceipts: false,
        supportsReplyReceipts: false,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /** Configuración activa que une el proveedor in-app con su canal, para el tenant por defecto. */
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
    em.create(
      ProviderChannelConfigs,
      {
        id: MESSAGING_SEED.inAppChannelConfigId,
        providerId: MESSAGING_SEED.inAppProviderId,
        channelId: MESSAGING_SEED.inAppChannelId,
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

  /**
   * Canal externo sin proveedor: existe para que se pueda declarar una
   * preferencia sobre él, pero un intento de entrega falla honestamente (no
   * hay `provider_channel_configs` activa) en vez de simular un envío.
   */
  private async seedUnconfiguredChannel(
    em: EntityManager,
    now: Date,
    spec: UnconfiguredChannelSpec,
  ): Promise<number> {
    if (await em.findOne(MessageChannels, { id: spec.id })) return 0;
    em.create(
      MessageChannels,
      {
        id: spec.id,
        code: spec.code,
        name: spec.name,
        channelTypeConceptId: spec.channelTypeConceptId,
        supportsTemplates: false,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }
}
