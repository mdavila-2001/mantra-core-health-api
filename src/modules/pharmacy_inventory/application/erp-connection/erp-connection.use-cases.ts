import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  assertOutboundUrlAllowed,
  type AuthenticatedUser,
} from '../../../../common';
import { INTEG } from '../../../integrations/integrations.concepts';
import {
  lastFour,
  maskSecretHint,
  resolveStockMode,
  type ConnectionCheckResult,
} from '../../domain/erp-connection/pharmacy-stock-mode';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import {
  ErpConnectionRepository,
  type ErpConnectionConfig,
  type ErpConnectionRecord,
} from '../../infrastructure/repositories/erp-connection.repository';
import type {
  ErpConnectionDto,
  ErpConnectionTestResultDto,
  SaveErpConnectionDto,
  TestErpConnectionDto,
} from '../../presentation/dto/erp-connection.dto';
import {
  PHARMACY_CATALOG_FACTORY_PORT,
  PHARMACY_CONNECTION_CIPHER_PORT,
  type PharmacyCatalogFactoryPort,
  type PharmacyConnectionCipherPort,
  type PharmacySystemAccess,
  type ExternalPharmacyCatalogPort,
} from '../ports/external-pharmacy-catalog.port';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import { integrationConnectionInactive } from '../inventory-sync/integration-errors';
import { isSafePharmacySystemBaseUrl } from '../../domain/erp-connection/pharmacy-system-url';
import {
  connectionIncomplete,
  connectionNotFound,
  encryptionNotConfigured,
  keyRequired,
  keyRequiredForNewDestination,
  siteNotInPharmacy,
  systemNotAvailable,
} from './erp-connection-errors';

/** Tiempo máximo de una llamada al sistema de la farmacia, sin reintentos (FAR-C9). */
export const PHARMACY_SYSTEM_TIMEOUT_MS = 3_000;

/** Estado de la última llamada, para guardar en la conexión. */
export function statusFor(
  result: ConnectionCheckResult,
  at: Date,
): Pick<ErpConnectionConfig, 'statusCode' | 'reasonCode' | 'checkedAt'> {
  if (result === 'OK') {
    return {
      statusCode: 'PINV_ERP_CONNECTION_ACTIVE',
      reasonCode: null,
      checkedAt: at.toISOString(),
    };
  }
  return {
    statusCode: 'PINV_ERP_CONNECTION_ERROR',
    reasonCode:
      result === 'AUTH_REJECTED'
        ? 'PINV_ERP_REASON_AUTH_REJECTED'
        : 'PINV_ERP_REASON_UNREACHABLE',
    checkedAt: at.toISOString(),
  };
}

/** Qué dijo una falla del sistema de la farmacia, sin su detalle interno. */
export function resultOf(error: unknown): ConnectionCheckResult {
  if (error instanceof ExternalCatalogUnavailableError) return error.kind;
  return 'UNREACHABLE';
}

/**
 * La conexión de cada farmacia con su propio sistema (FAR-C9, D-8): verla,
 * guardarla y probarla, desde la pestaña Integración de la farmacia.
 *
 * El ámbito es el de la farmacia (titular o personal del tenant, o
 * `SECURITY_ADMIN`), como «Sincronizar ahora». La clave se guarda cifrada y
 * nunca vuelve: solo sus últimos 4 caracteres.
 */
@Injectable()
export class ErpConnectionUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly connections: ErpConnectionRepository,
    @Inject(PHARMACY_CATALOG_FACTORY_PORT)
    private readonly catalogs: PharmacyCatalogFactoryPort,
    @Inject(PHARMACY_CONNECTION_CIPHER_PORT)
    private readonly cipher: PharmacyConnectionCipherPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('ErpConnectionUseCases');
  }

  async view(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<ErpConnectionDto> {
    const em = this.em.fork({ keepTransactionContext: true });
    await this.scope.requireManagedPharmacy(em, pharmacyId, actor);
    return this.describe(em, pharmacyId);
  }

  /** Catálogo de una conexión ya validada por ámbito; conserva C8 donde no hay ERP propio. */
  async catalogForConnection(
    em: EntityManager,
    pharmacyId: string,
    linkId: string,
    fallback: ExternalPharmacyCatalogPort,
  ): Promise<{
    catalog: ExternalPharmacyCatalogPort;
    pharmacyCode?: string;
    siteCodes: Readonly<Record<string, string>>;
  }> {
    const current = await this.connections.findForPharmacy(em, pharmacyId);
    if (!current || current.link.id !== linkId)
      return { catalog: fallback, siteCodes: {} };
    if (current.connection.stateConceptId !== INTEG.CONN_ACTIVE)
      throw integrationConnectionInactive();
    if (!this.cipher.isConfigured()) throw encryptionNotConfigured();
    return {
      catalog: this.catalogs.forAccess(this.accessFor(current)),
      pharmacyCode: current.config.pharmacyCode,
      siteCodes: current.config.siteCodes,
    };
  }

  /**
   * Guarda la conexión. «Manual» la desactiva y conserva lo cargado;
   * «Conectada» exige tipo, dirección, código de farmacia y una clave (la
   * nueva o la que ya estaba). Al cambiar algo, el estado se limpia: lo dirá
   * la próxima llamada o «Probar».
   */
  async save(
    pharmacyId: string,
    dto: SaveErpConnectionDto,
    actor: AuthenticatedUser,
  ): Promise<ErpConnectionDto> {
    if (!this.cipher.isConfigured()) throw encryptionNotConfigured();
    await this.em.transactional(async (tx) => {
      await this.scope.requireManagedPharmacy(tx, pharmacyId, actor);
      const pharmacy = await this.connections.findPharmacy(tx, pharmacyId);
      if (!pharmacy) throw connectionNotFound();
      const current = await this.connections.findForPharmacy(tx, pharmacyId);
      const enabled = dto.mode === 'CONNECTED';

      if (!enabled && !current) return; // Manual y nunca configurada: nada que guardar.

      const systemCode = dto.systemCode ?? current?.systemCode ?? null;
      const baseUrl = normalizeUrl(
        dto.baseUrl ?? current?.config.baseUrl ?? '',
      );
      const pharmacyCode =
        dto.pharmacyCode ?? current?.config.pharmacyCode ?? '';
      if (enabled && (!systemCode || baseUrl === '' || pharmacyCode === '')) {
        throw connectionIncomplete();
      }
      if (enabled && !dto.apiKey && !current?.credential) throw keyRequired();
      // La clave guardada solo viaja al destino para el que se cargó: si cambia
      // la dirección o el tipo, hay que volver a cargarla.
      if (
        !dto.apiKey &&
        current?.credential &&
        destinationChanged(current, systemCode, baseUrl)
      ) {
        throw keyRequiredForNewDestination();
      }
      if (baseUrl !== '') assertOutboundUrlAllowed(baseUrl);
      const provider = systemCode
        ? await this.connections.findProviderByCode(tx, systemCode)
        : null;
      if (systemCode && !provider) throw systemNotAvailable(systemCode);

      const siteCodes = await this.siteCodesFor(
        tx,
        pharmacyId,
        dto.siteCodes,
        current?.config.siteCodes ?? {},
      );
      const config: ErpConnectionConfig = {
        version: 1,
        baseUrl,
        pharmacyCode,
        siteCodes,
        keyLast4: dto.apiKey
          ? lastFour(dto.apiKey)
          : (current?.config.keyLast4 ?? null),
        keyHintSafe: dto.apiKey ? true : current?.config.keyHintSafe === true,
        statusCode: null,
        reasonCode: null,
        checkedAt: null,
      };

      let connection = current?.connection;
      if (connection && provider) {
        this.connections.updateConnection(connection, {
          providerId: provider.id,
          enabled,
          config,
          actorUserId: actor.id,
        });
      } else if (connection) {
        // Manual sobre una conexión ya guardada sin tipo: solo se desactiva.
        connection.stateConceptId = INTEG.CONN_PAUSED;
      } else if (provider) {
        connection = this.connections.createConnection(tx, {
          providerId: provider.id,
          tenantId: pharmacy.tenantId,
          enabled,
          config,
          actorUserId: actor.id,
        });
        await tx.flush();
        const link = await this.connections.findOrCreateLink(
          tx,
          pharmacyId,
          actor.id,
        );
        link.connectionId = connection.id;
      }
      if (connection && dto.apiKey) {
        await tx.flush();
        const credential = this.connections.rotateCredential(
          tx,
          connection,
          current?.credential ?? null,
          this.cipher.encrypt(dto.apiKey),
          actor.id,
        );
        await tx.flush();
        connection.credentialId = credential.id;
      }
      await tx.flush();
    });
    this.logger.info(
      {
        operation: 'pharmacy_inventory.erp_connection.save',
        pharmacyId,
        mode: dto.mode,
      },
      'Conexión de la farmacia guardada',
    );
    return this.describe(
      this.em.fork({ keepTransactionContext: true }),
      pharmacyId,
    );
  }

  /** «Probar conexión» con los datos del formulario, sin guardar nada. */
  async testDraft(
    pharmacyId: string,
    dto: TestErpConnectionDto,
    actor: AuthenticatedUser,
  ): Promise<ErpConnectionTestResultDto> {
    if (!this.cipher.isConfigured()) throw encryptionNotConfigured();
    const em = this.em.fork({ keepTransactionContext: true });
    await this.scope.requireManagedPharmacy(em, pharmacyId, actor);
    const baseUrl = normalizeUrl(dto.baseUrl);
    assertOutboundUrlAllowed(baseUrl);
    let apiKey = dto.apiKey;
    if (!apiKey) {
      const current = await this.connections.findForPharmacy(em, pharmacyId);
      if (!current?.credential?.secretRef) throw keyRequired();
      if (destinationChanged(current, dto.systemCode, baseUrl)) {
        throw keyRequiredForNewDestination();
      }
      apiKey = this.cipher.decrypt(current.credential.secretRef);
    }
    const result = await this.check({
      systemCode: dto.systemCode,
      baseUrl,
      pharmacyCode: dto.pharmacyCode,
      apiKey,
      timeoutMs: PHARMACY_SYSTEM_TIMEOUT_MS,
    });
    return { result };
  }

  /** «Probar conexión» de lo guardado; deja el estado en la conexión. */
  async testSaved(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<ErpConnectionTestResultDto> {
    if (!this.cipher.isConfigured()) throw encryptionNotConfigured();
    const result = await this.em.transactional(async (tx) => {
      await this.scope.requireManagedPharmacy(tx, pharmacyId, actor);
      const current = await this.connections.findForPharmacy(tx, pharmacyId);
      if (!current?.systemCode || !current.credential?.secretRef) {
        throw connectionNotFound();
      }
      const checked = await this.check(this.accessFor(current));
      this.connections.recordStatus(
        current.connection,
        statusFor(checked, new Date()),
      );
      await tx.flush();
      return checked;
    });
    return {
      result,
      connection: await this.describe(
        this.em.fork({ keepTransactionContext: true }),
        pharmacyId,
      ),
    };
  }

  /** Con qué hablarle al sistema guardado (la clave, descifrada en memoria). */
  accessFor(record: ErpConnectionRecord): PharmacySystemAccess {
    if (!record.systemCode || !record.credential?.secretRef) {
      throw connectionNotFound();
    }
    return {
      systemCode: record.systemCode,
      baseUrl: record.config.baseUrl,
      pharmacyCode: record.config.pharmacyCode,
      apiKey: this.cipher.decrypt(record.credential.secretRef),
      timeoutMs: PHARMACY_SYSTEM_TIMEOUT_MS,
    };
  }

  private async check(
    access: PharmacySystemAccess,
  ): Promise<ConnectionCheckResult> {
    try {
      await this.catalogs.forAccess(access).checkHealth();
      return 'OK';
    } catch (error) {
      const result = resultOf(error);
      this.logger.warn(
        {
          operation: 'pharmacy_inventory.erp_connection.check',
          systemCode: access.systemCode,
          result,
          detail:
            error instanceof ExternalCatalogUnavailableError
              ? error.detail
              : 'unknown',
        },
        'El sistema de la farmacia no pasó la prueba',
      );
      return result;
    }
  }

  private async siteCodesFor(
    em: EntityManager,
    pharmacyId: string,
    incoming: SaveErpConnectionDto['siteCodes'],
    previous: Readonly<Record<string, string>>,
  ): Promise<Record<string, string>> {
    if (!incoming) return { ...previous };
    const sites = new Set(
      (await this.connections.findActiveSites(em, pharmacyId)).map((s) => s.id),
    );
    const codes: Record<string, string> = {};
    for (const entry of incoming) {
      if (!sites.has(entry.siteId)) throw siteNotInPharmacy(entry.siteId);
      codes[entry.siteId] = entry.externalCode;
    }
    return codes;
  }

  private async describe(
    em: EntityManager,
    pharmacyId: string,
  ): Promise<ErpConnectionDto> {
    const record = await this.connections.findForPharmacy(em, pharmacyId);
    const sites = await this.connections.findActiveSites(em, pharmacyId);
    const mode = resolveStockMode(
      record && {
        linked: true,
        enabled: record.connection.stateConceptId === INTEG.CONN_ACTIVE,
        hasCredential: record.credential !== null,
        supportedSystem: record.systemCode !== null,
      },
    );
    const config = record?.config;
    const failing = config?.statusCode === 'PINV_ERP_CONNECTION_ERROR';
    return {
      pharmacyId,
      mode,
      status: mode === 'MANUAL' ? 'MANUAL' : failing ? 'ERROR' : 'ACTIVE',
      errorReason: failing
        ? config?.reasonCode === 'PINV_ERP_REASON_AUTH_REJECTED'
          ? 'AUTH_REJECTED'
          : 'UNREACHABLE'
        : null,
      checkedAt: config?.checkedAt ?? null,
      systemCode: record?.systemCode ?? null,
      baseUrl:
        config?.baseUrl && isSafePharmacySystemBaseUrl(config.baseUrl)
          ? config.baseUrl
          : null,
      pharmacyCode: config?.pharmacyCode || null,
      keyHint: record?.credential ? maskSecretHint(config?.keyLast4) : null,
      encryptionConfigured: this.cipher.isConfigured(),
      integrationConnectionId: record?.link.id ?? null,
      sites: sites.map((site) => ({
        siteId: site.id,
        siteName: site.name,
        platformCode: site.code,
        externalCode: config?.siteCodes[site.id] ?? site.code,
      })),
    };
  }
}

/** ¿La conexión apunta a otro sistema o a otra dirección que la guardada? */
function destinationChanged(
  current: ErpConnectionRecord,
  systemCode: string | null,
  baseUrl: string,
): boolean {
  return (
    current.systemCode !== systemCode ||
    normalizeUrl(current.config.baseUrl) !== baseUrl
  );
}

/** Sin barra final: los adaptadores suman sus rutas. */
function normalizeUrl(url: string): string {
  const value = url.trim().replace(/\/+$/, '');
  if (value !== '' && !isSafePharmacySystemBaseUrl(value))
    throw connectionIncomplete();
  return value;
}

/** El concepto que deja el estado, para quien lo necesite nombrar. */
export const ERP_STATUS_CONCEPTS = {
  ACTIVE: PINV.ERP_CONNECTION_ACTIVE,
  ERROR: PINV.ERP_CONNECTION_ERROR,
  UNREACHABLE: PINV.ERP_REASON_UNREACHABLE,
  AUTH_REJECTED: PINV.ERP_REASON_AUTH_REJECTED,
} as const;
