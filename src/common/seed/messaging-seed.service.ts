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
    if (
      await em.findOne(MessageChannels, { id: MESSAGING_SEED.inAppChannelId })
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
        id: MESSAGING_SEED.inAppProviderId,
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
