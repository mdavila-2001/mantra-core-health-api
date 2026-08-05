import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  CredentialsRepository,
  SecurityEventsRepository,
} from '../repositories';
import {
  LinkFederatedCredentialDto,
  CredentialResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Gestión de credenciales: enlace de identidad federada (UC-01-02) y revocación
 * de una credencial concreta (UC-01-09). Ambas operaciones registran su evento de
 * seguridad en la misma transacción.
 */
@Injectable()
export class IamCredentialsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamCredentialsService.name);
  }

  /** UC-01-02: enlaza una credencial federada a un usuario existente. */
  async linkFederated(
    userId: string,
    dto: LinkFederatedCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<CredentialResponseDto> {
    this.logger.info(
      {
        operation: 'iam.credential.federated-link',
        userId,
        provider: dto.identityProvider,
      },
      'Linking federated credential',
    );
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user)
        throw new ResourceNotFoundException('Usuario no encontrado', {
          userId,
        });

      const dup = await this.credentialsRepo.findFederated(
        tx,
        userId,
        dto.identityProvider,
        dto.externalSubject,
      );
      if (dup) {
        throw new ConflictException('La credencial federada ya existe', {
          identityProvider: dto.identityProvider,
          externalSubject: dto.externalSubject,
        });
      }

      const cred = this.credentialsRepo.createFederated(tx, {
        userId,
        identityProvider: dto.identityProvider,
        externalSubject: dto.externalSubject,
        actorUserId: actor.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_CRED_FEDERATED_LINK,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { identityProvider: dto.identityProvider },
      });

      return { id: cred.id, userId, method: cred.methodConceptId };
    });
  }

  /** UC-01-09: revoca una credencial que pertenece al usuario indicado. */
  async revokeCredential(
    userId: string,
    credentialId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'iam.credential.revoke', userId, credentialId },
      'Revoking credential',
    );
    return this.em.transactional(async (tx) => {
      const cred = await this.credentialsRepo.findByIdAndUser(
        tx,
        credentialId,
        userId,
      );
      if (!cred) {
        throw new ResourceNotFoundException(
          'Credencial no encontrada para el usuario',
          {
            userId,
            credentialId,
          },
        );
      }

      cred.stateConceptId = CONCEPTS.STATE_REVOKED;
      touch(cred, actor.id);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_CRED_REVOKE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { credentialId },
      });

      return { ok: true };
    });
  }
}
