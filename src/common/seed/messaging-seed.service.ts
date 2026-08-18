import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  MessageChannels,
  MessagingProviders,
  ProviderChannelConfigs,
} from '../../modules/messaging/entities';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
// El tipo de proveedor in-app se declara en los conceptos del módulo de agenda:
// el catálogo central sólo trae el de correo y es un archivo compartido que el
// carril P8 no modifica. Ver `scheduling.concepts.ts`.
import { SCHED } from '../../modules/scheduling/scheduling.concepts';

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
  /**
   * Canal in-app: la bandeja del propio producto.
   *
   * Existe por la misma razón que el de correo —`notification_requests.channel_id`
   * es FK NOT NULL y no hay caso de uso para dar de alta canales—, y porque sin
   * él **ninguna** notificación in-app se puede pedir: `deliverNotification`
   * escribe en `messaging.in_app_notifications` sólo cuando el canal declara
   * `CHANNEL_TYPE_IN_APP`. Lo materializa el carril P8 (avisos de agenda) porque
   * fue el primero en necesitarlo; los ids son deterministas, así que cualquier
   * otro carril que lo siembre obtiene exactamente estas filas y no una segunda
   * copia.
   */
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
        'Canales de correo e in-app por defecto materializados',
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

  /** Canal lógico IN_APP: la campana del propio producto. */
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
        // Los avisos de agenda arman su texto con los datos del turno; una
        // plantilla publicada llegará con el centro de notificaciones.
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
   * Proveedor del canal in-app.
   *
   * No sale a ningún tercero: entregar in-app es escribir en la bandeja del
   * destinatario, y eso lo hace `NotificationsService` dentro de la misma
   * transacción. La fila existe porque `notification_deliveries` exige
   * `adapter_code`/`adapter_version` y una configuración de proveedor activa;
   * declarar `IN_APP_INBOX` es más honesto que nombrar a un proveedor que no
   * interviene.
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
        name: 'In-app inbox',
        providerTypeConceptId: SCHED.MSG_PROVIDER_TYPE_IN_APP,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        adapterCode: 'IN_APP_INBOX',
        adapterVersion: '1',
        isBuiltin: true,
        supportsWebhooks: false,
        supportsPolling: false,
        // La bandeja sí sabe si se leyó: es la propia fila la que lo registra
        // (`read_at`), y es lo que el badge de no leídos cuenta.
        supportsDeliveryReceipts: true,
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

  /** Configuración activa del canal in-app para el tenant por defecto. */
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
