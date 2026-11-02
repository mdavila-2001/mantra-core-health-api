import {
  externalSystemLastCheck,
  type ExternalSystemCheckResult,
} from '../../domain/sync/external-catalog';
import type { ExternalSystemCheckToken } from '../../application/ports/external-pharmacy-system.port';
import { INTEG } from '../../../integrations/integrations.concepts';
import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { decryptSecret, encryptSecret, touch } from '../../../../common';
import {
  EXTERNAL_PHARMACY_CATALOG_PORT,
  type ExternalPharmacyCatalogPort,
} from '../../application/ports/external-pharmacy-catalog.port';
import {
  type ExternalPharmacySystemPort,
  type ExternalSystemSummary,
  type ResolvedExternalSystem,
} from '../../application/ports/external-pharmacy-system.port';
import {
  externalSystemConfigJson,
  externalSystemUrlProblem,
  loadExternalSystemHostPolicy,
  parseExternalSystemConfig,
  type ExternalSystemConfig,
} from '../../domain/sync/external-system';
import { loadPharmacyErpEnv } from './pharmacy-erp.env';
import { createExternalSystemClient } from './external-system-clients';
import { ExternalSystemRepository } from '../repositories/external-system.repository';

/**
 * El sistema propio de cada farmacia (FAR-C9 · C9-3), sobre las tablas de
 * integraciones. Ver `domain/sync/external-system.ts` para el formato y la
 * política de hosts.
 *
 * La clave se guarda cifrada (`encryptSecret`) en la credencial activa y se
 * descifra solo para llamar al sistema. Nunca sale en una respuesta ni en un
 * log: la salida de `describe` solo dice si hay una.
 */
@Injectable()
export class PharmacyExternalSystemAdapter implements ExternalPharmacySystemPort {
  constructor(
    private readonly repo: ExternalSystemRepository,
    @Inject(EXTERNAL_PHARMACY_CATALOG_PORT)
    private readonly server: ExternalPharmacyCatalogPort,
  ) {}

  serverConfigured(): boolean {
    return this.server.isConfigured();
  }

  async resolve(
    em: EntityManager,
    tenantId: string,
    connectionId: string | null,
  ): Promise<ResolvedExternalSystem> {
    if (connectionId === null) {
      return this.server.isConfigured()
        ? { status: 'READY', source: 'SERVER', client: this.server }
        : { status: 'NOT_CONFIGURED' };
    }
    const row = await this.repo.find(em, connectionId, tenantId);
    const config = row
      ? parseExternalSystemConfig(row.connection.configJson)
      : null;
    if (
      !row ||
      row.connection.stateConceptId !== INTEG.CONN_ACTIVE ||
      !config ||
      !row.credential?.secretRef
    ) {
      return { status: 'NOT_CONFIGURED' };
    }
    if (
      externalSystemUrlProblem(config.baseUrl, loadExternalSystemHostPolicy())
    ) {
      return { status: 'HOST_NOT_ALLOWED' };
    }
    const check: ExternalSystemCheckToken = {
      connectionId,
      credentialId: row.credential.id,
      configJson: row.connection.configJson,
    };
    try {
      const apiKey = decryptSecret(row.credential.secretRef);
      return {
        status: 'READY',
        source: 'PHARMACY',
        client: this.clientFor(config, apiKey),
        check,
      };
    } catch {
      return { status: 'UNAVAILABLE', errorReason: 'UNREACHABLE', check };
    }
  }

  async describe(
    em: EntityManager,
    tenantId: string,
    connectionIds: readonly string[],
  ): Promise<Map<string, ExternalSystemSummary>> {
    const rows = await this.repo.findMany(em, connectionIds, tenantId);
    const summaries = new Map<string, ExternalSystemSummary>();
    for (const [id, row] of rows) {
      const config = parseExternalSystemConfig(row.connection.configJson);
      if (!config) continue;
      summaries.set(id, {
        format: config.format,
        baseUrl: config.baseUrl,
        externalPharmacyCode: config.externalPharmacyCode,
        apiKeyConfigured: row.credential !== null,
        configuredAt:
          this.configuredAt(row.connection.configJson) ??
          row.connection.updatedAt.toISOString(),
        ...this.checkSummary(row.connection.configJson),
      });
    }
    return summaries;
  }

  async recordCheck(
    em: EntityManager,
    data: {
      tenantId: string;
      check: ExternalSystemCheckToken;
      result: ExternalSystemCheckResult;
      actorUserId: string;
    },
  ): Promise<void> {
    await this.repo.recordCheck(em, {
      ...data,
      lastCheck: externalSystemLastCheck(data.result),
    });
  }

  private configuredAt(json: unknown): string | undefined {
    if (!json || typeof json !== 'object') return undefined;
    const value = (json as Record<string, unknown>).configuredAt;
    return typeof value === 'string' ? value : undefined;
  }

  private checkSummary(
    json: unknown,
  ): Pick<ExternalSystemSummary, 'lastCheck'> {
    if (!json || typeof json !== 'object') return {};
    const check = (json as Record<string, unknown>).lastCheck;
    if (!check || typeof check !== 'object') return {};
    const value = check as Record<string, unknown>;
    if (
      typeof value.checkedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.checkedAt))
    )
      return {};
    if (value.status === 'ACTIVE' && value.errorReason === null)
      return {
        lastCheck: {
          status: 'ACTIVE',
          errorReason: null,
          checkedAt: value.checkedAt,
        },
      };
    if (
      value.status === 'ERROR' &&
      (value.errorReason === 'AUTH_REJECTED' ||
        value.errorReason === 'UNREACHABLE')
    )
      return {
        lastCheck: {
          status: 'ERROR',
          errorReason: value.errorReason,
          checkedAt: value.checkedAt,
        },
      };
    return {};
  }

  urlProblem(baseUrl: string) {
    return externalSystemUrlProblem(baseUrl, loadExternalSystemHostPolicy());
  }

  clientFor(
    config: ExternalSystemConfig,
    apiKey: string,
  ): ExternalPharmacyCatalogPort {
    return createExternalSystemClient(
      config,
      apiKey,
      loadPharmacyErpEnv().timeoutMs,
    );
  }

  async save(
    em: EntityManager,
    data: {
      tenantId: string;
      connectionId: string | null;
      config: ExternalSystemConfig;
      apiKey: string;
      actorUserId: string;
    },
  ): Promise<string> {
    const configJson = {
      ...externalSystemConfigJson(data.config),
      configuredAt: new Date().toISOString(),
      lastCheck: externalSystemLastCheck('OK'),
    };
    let connectionRowId: string;
    if (data.connectionId === null) {
      const provider = await this.repo.ensureProvider(
        em,
        data.config.format,
        data.actorUserId,
      );
      await em.flush();
      const connection = this.repo.createConnection(em, {
        providerId: provider.id,
        tenantId: data.tenantId,
        configJson,
        actorUserId: data.actorUserId,
      });
      await em.flush();
      connectionRowId = connection.id;
    } else {
      const row = await this.repo.find(em, data.connectionId, data.tenantId);
      if (!row) throw new Error('external system connection not in tenant');
      // Otro formato es otro proveedor: la conexión pasa al suyo.
      const provider = await this.repo.ensureProvider(
        em,
        data.config.format,
        data.actorUserId,
      );
      await em.flush();
      row.connection.providerId = provider.id;
      row.connection.configJson = configJson;
      touch(row.connection, data.actorUserId);
      connectionRowId = row.connection.id;
      if (row.credential) {
        this.repo.retireCredential(row.credential, data.actorUserId);
      }
    }
    this.repo.createCredential(em, {
      connectionId: connectionRowId,
      encryptedKeyRef: encryptSecret(data.apiKey),
      actorUserId: data.actorUserId,
    });
    await em.flush();
    return connectionRowId;
  }

  async remove(
    em: EntityManager,
    data: { tenantId: string; connectionId: string; actorUserId: string },
  ): Promise<void> {
    const row = await this.repo.find(em, data.connectionId, data.tenantId);
    if (!row) return;
    this.repo.pauseConnection(row.connection, data.actorUserId);
    if (row.credential) {
      this.repo.retireCredential(row.credential, data.actorUserId);
    }
    await em.flush();
  }
}
