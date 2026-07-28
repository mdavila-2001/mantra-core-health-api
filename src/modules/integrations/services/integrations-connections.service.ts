import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ExternalProvidersRepository,
  ProviderConnectionsRepository,
  ProviderCredentialsRepository,
  OutboundMessagesRepository,
} from '../repositories';
import {
  ProvisionConnectionDto,
  RotateCredentialDto,
  ConnectionResponseDto,
  CredentialRotationResponseDto,
  PauseConnectionResultDto,
} from '../dto';
import {
  INTEG,
  ENVIRONMENT_CONCEPT_BY_CODE,
  SECRET_TYPE_CONCEPT_BY_CODE,
} from '../integrations.concepts';

/**
 * Casos de uso sobre conexiones de proveedor: aprovisionamiento con credencial
 * (UC-12-02), rotación de credencial (UC-12-03) y pausa por circuit breaker
 * (UC-12-12).
 *
 * Nota de diseño: el módulo no incluye un caso de uso de "activación" de
 * conexión; como la credencial inicial se crea ACTIVE en la misma transacción,
 * la conexión queda directamente en estado ACTIVE (usable). Las operaciones que
 * exigen "conexión ACTIVE" validan contra ese estado.
 */
@Injectable()
export class IntegrationsConnectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providersRepo - Valor de providers repo requerido por la operación.
   * @param connectionsRepo - Valor de connections repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param outboundRepo - Valor de outbound repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly providersRepo: ExternalProvidersRepository,
    private readonly connectionsRepo: ProviderConnectionsRepository,
    private readonly credentialsRepo: ProviderCredentialsRepository,
    private readonly outboundRepo: OutboundMessagesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationsConnectionsService.name);
  }

  /** UC-12-02: aprovisiona la conexión del tenant y su credencial inicial. */
  async provisionConnection(
    providerId: string,
    dto: ProvisionConnectionDto,
    actor: AuthenticatedUser,
  ): Promise<ConnectionResponseDto> {
    this.logger.info(
      {
        operation: 'integrations.connection.provision',
        providerId,
        tenantId: dto.tenantId,
      },
      'Provisioning connection',
    );
    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findById(tx, providerId);
      if (!provider)
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      if (provider.stateConceptId !== INTEG.PROVIDER_ACTIVE) {
        throw new PreconditionFailedException('El proveedor no está activo', {
          providerId,
        });
      }

      const connection = this.connectionsRepo.create(tx, {
        providerId,
        tenantId: dto.tenantId,
        stateConceptId: INTEG.CONN_ACTIVE,
        environmentConceptId: dto.environment
          ? ENVIRONMENT_CONCEPT_BY_CODE[dto.environment]
          : undefined,
        configJson: dto.configJson,
        validFrom: new Date(),
        actorUserId: actor.id,
      });
      // La credencial referencia la conexión por FK: persistir el padre primero.
      await tx.flush();

      const credential = this.credentialsRepo.create(tx, {
        connectionId: connection.id,
        secretTypeConceptId: SECRET_TYPE_CONCEPT_BY_CODE[dto.secretType],
        stateConceptId: INTEG.CRED_ACTIVE,
        secretRef: dto.secretRef,
        encrypted: true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      connection.credentialId = credential.id;
      touch(connection, actor.id);

      this.logger.info(
        {
          operation: 'integrations.connection.provision',
          connectionId: connection.id,
        },
        'Connection provisioned',
      );
      return {
        id: connection.id,
        providerId,
        tenantId: connection.tenantId,
        state: connection.stateConceptId,
        credentialId: credential.id,
      };
    });
  }

  /** UC-12-03: rota la credencial ACTIVE de la conexión (previa -> RETIRED). */
  async rotateCredential(
    connectionId: string,
    dto: RotateCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<CredentialRotationResponseDto> {
    this.logger.info(
      { operation: 'integrations.credential.rotate', connectionId },
      'Rotating credential',
    );
    return this.em.transactional(async (tx) => {
      const connection = await this.connectionsRepo.findById(tx, connectionId);
      if (!connection)
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionId,
        });
      if (connection.stateConceptId !== INTEG.CONN_ACTIVE) {
        throw new PreconditionFailedException('La conexión no está activa', {
          connectionId,
        });
      }

      const current = await this.credentialsRepo.findActiveByConnection(
        tx,
        connectionId,
        INTEG.CRED_ACTIVE,
      );
      const secretTypeConceptId = dto.secretType
        ? SECRET_TYPE_CONCEPT_BY_CODE[dto.secretType]
        : (current?.secretTypeConceptId ?? INTEG.SECRET_API_KEY);

      const now = new Date();
      const credential = this.credentialsRepo.create(tx, {
        connectionId,
        secretTypeConceptId,
        stateConceptId: INTEG.CRED_ACTIVE,
        secretRef: dto.secretRef,
        encrypted: true,
        rotatedAt: now,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        actorUserId: actor.id,
      });

      if (current) {
        current.stateConceptId = INTEG.CRED_RETIRED;
        touch(current, actor.id);
      }
      await tx.flush();

      connection.credentialId = credential.id;
      touch(connection, actor.id);

      return { connectionId, credentialId: credential.id, rotatedAt: now };
    });
  }

  /** UC-12-12: pausa la conexión (circuit open) y retiene sus mensajes QUEUED. */
  async pauseConnection(
    connectionId: string,
    actor: AuthenticatedUser,
  ): Promise<PauseConnectionResultDto> {
    this.logger.info(
      { operation: 'integrations.connection.pause', connectionId },
      'Pausing connection',
    );
    return this.em.transactional(async (tx) => {
      const connection = await this.connectionsRepo.findById(tx, connectionId);
      if (!connection)
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionId,
        });

      // Transición idempotente: si ya está pausada, no-op.
      if (connection.stateConceptId === INTEG.CONN_PAUSED) {
        return {
          connectionId,
          state: connection.stateConceptId,
          heldMessages: 0,
        };
      }
      if (connection.stateConceptId !== INTEG.CONN_ACTIVE) {
        throw new PreconditionFailedException('La conexión no está activa', {
          connectionId,
        });
      }

      connection.stateConceptId = INTEG.CONN_PAUSED;
      touch(connection, actor.id);

      const held = await this.outboundRepo.holdQueuedForConnection(
        tx,
        connectionId,
        INTEG.MSG_QUEUED,
        INTEG.MSG_HELD,
      );

      this.logger.warn(
        {
          operation: 'integrations.connection.pause',
          connectionId,
          heldMessages: held,
        },
        'Connection circuit opened',
      );
      return {
        connectionId,
        state: connection.stateConceptId,
        heldMessages: held,
      };
    });
  }
}
