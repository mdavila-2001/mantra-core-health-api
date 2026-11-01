import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { IntegrationReadRepository } from '../../infrastructure/repositories';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import {
  EXTERNAL_PHARMACY_SYSTEM_PORT,
  type ExternalPharmacySystemPort,
} from '../ports/external-pharmacy-system.port';
import type {
  ConfigureExternalSystemDto,
  ExternalSystemProbeDto,
  ExternalSystemResponseDto,
} from '../../presentation/dto';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import {
  normalizeBaseUrl,
  type ExternalSystemConfig,
} from '../../domain/sync/external-system';
import {
  integrationHostNotAllowed,
  integrationUnavailable,
} from './integration-errors';
import type { ConnectionRef } from './sync-external-pharmacy-catalog.use-case';

/**
 * Configura, prueba y quita el sistema propio de una conexión de farmacia
 * (FAR-C9 · C9-3). Guardar prueba antes el sistema: si no responde con esa
 * clave, no se escribe nada.
 */
@Injectable()
export class ConfigureExternalSystemUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly reads: IntegrationReadRepository,
    @Inject(EXTERNAL_PHARMACY_SYSTEM_PORT)
    private readonly systems: ExternalPharmacySystemPort,
  ) {}

  async save(
    ref: ConnectionRef,
    dto: ConfigureExternalSystemDto,
    actor: AuthenticatedUser,
  ): Promise<ExternalSystemResponseDto> {
    const config: ExternalSystemConfig = {
      format: dto.format,
      baseUrl: normalizeBaseUrl(dto.baseUrl),
      externalPharmacyCode: dto.externalPharmacyCode.trim(),
    };
    // Primero el ámbito: sin una conexión del actor no se llama a nadie.
    await this.em.transactional((tx) => this.requireConnection(tx, ref, actor));
    const problem = this.systems.urlProblem(config.baseUrl);
    if (problem === 'URL_INVALID') throw urlInvalid();
    if (problem === 'HOST_NOT_ALLOWED') throw integrationHostNotAllowed();

    // Probar antes de guardar: una clave o una dirección malas no entran.
    const client = this.systems.clientFor(config, dto.apiKey);
    try {
      await client.checkHealth();
    } catch (error) {
      if (error instanceof ExternalCatalogUnavailableError) {
        throw integrationUnavailable();
      }
      throw error;
    }

    return this.em.transactional(async (tx) => {
      const { tenantId, connection } = await this.requireConnection(
        tx,
        ref,
        actor,
      );
      const providerId = await this.systems.save(tx, {
        tenantId,
        connectionId: connection.connectionId ?? null,
        config,
        apiKey: dto.apiKey,
        actorUserId: actor.id,
      });
      connection.connectionId = providerId;
      touch(connection, actor.id);
      await tx.flush();
      const summary = await this.systems.describe(tx, tenantId, [providerId]);
      const system = summary.get(providerId);
      if (!system) throw new Error('external system not readable after save');
      return { system, probe: 'OK' };
    });
  }

  /** Prueba el sistema que usa hoy la conexión (el suyo o el del servidor). */
  async probe(
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<ExternalSystemProbeDto> {
    const { system } = await this.em.transactional(async (tx) => {
      const { tenantId, connection } = await this.requireConnection(
        tx,
        ref,
        actor,
      );
      const resolved = await this.systems.resolve(
        tx,
        tenantId,
        connection.connectionId ?? null,
      );
      return { system: resolved };
    });
    if (system.status === 'NOT_CONFIGURED') {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PRECONDITION_FAILED,
        'La conexión no tiene un sistema de farmacia configurado',
        {
          reason:
            PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_NOT_CONFIGURED,
        },
        PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_NOT_CONFIGURED,
      );
    }
    if (system.status === 'HOST_NOT_ALLOWED') throw integrationHostNotAllowed();
    try {
      await system.client.checkHealth();
    } catch (error) {
      if (error instanceof ExternalCatalogUnavailableError) {
        throw integrationUnavailable();
      }
      throw error;
    }
    return { status: 'OK', source: system.source };
  }

  /** Quita el sistema propio: la conexión vuelve a usar el del servidor. */
  async remove(ref: ConnectionRef, actor: AuthenticatedUser): Promise<void> {
    await this.em.transactional(async (tx) => {
      const { tenantId, connection } = await this.requireConnection(
        tx,
        ref,
        actor,
      );
      if (connection.connectionId) {
        await this.systems.remove(tx, {
          tenantId,
          connectionId: connection.connectionId,
          actorUserId: actor.id,
        });
        // Nulo en la base: la conexión vuelve al sistema del servidor o a manual.
        (connection as { connectionId?: string | null }).connectionId = null;
        touch(connection, actor.id);
        await tx.flush();
      }
    });
  }

  private async requireConnection(
    tx: EntityManager,
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ) {
    const pharmacy = await this.scope.requireManagedPharmacy(
      tx,
      ref.pharmacyId,
      actor,
    );
    const connection = await this.reads.findConnection(
      tx,
      pharmacy.pharmacyId,
      ref.connectionId,
    );
    if (!connection) throw this.scope.notAvailable();
    return { tenantId: pharmacy.tenantId, connection };
  }
}

function urlInvalid(): DomainException {
  const reason = PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_URL_INVALID;
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    'La dirección del sistema de la farmacia no es válida',
    { reason },
    reason,
  );
}
