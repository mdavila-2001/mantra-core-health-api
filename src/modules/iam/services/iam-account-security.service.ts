import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CredentialsRepository,
  RefreshTokensRepository,
  SecurityEventsRepository,
  SessionsRepository,
} from '../repositories';
import type {
  ChangePasswordDto,
  ChangePasswordResultDto,
  MySessionDto,
  RevokeMySessionResultDto,
} from '../dto';

/**
 * Seguridad de la propia cuenta (ID-24): cambiar la contraseña y ver o cerrar
 * las sesiones abiertas. Todo se resuelve por el `id` del token, nunca por un
 * identificador del cuerpo: nadie puede tocar la cuenta de otro.
 */
@Injectable()
export class IamAccountSecurityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param credentialsRepo - Credenciales.
   * @param sessionsRepo - Sesiones.
   * @param refreshRepo - Refresh tokens.
   * @param eventsRepo - Eventos de seguridad.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly sessionsRepo: SessionsRepository,
    private readonly refreshRepo: RefreshTokensRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamAccountSecurityService.name);
  }

  /**
   * Cambia la contraseña del titular y cierra las **otras** sesiones.
   *
   * La sesión desde la que se cambia sigue viva: la persona acaba de probar que
   * es ella. Un caso de uso, una transacción: credencial nueva y revocación
   * salen juntas o no salen.
   *
   * @param actor - Sujeto autenticado.
   * @param dto - Contraseña actual y nueva.
   * @param ip - Origen, para el evento de seguridad.
   * @returns Cuántas sesiones ajenas se cerraron.
   * @throws PreconditionFailedException (422) si la actual no coincide, si la
   *   nueva es igual o si la cuenta no tiene contraseña. No es 401 a propósito:
   *   el cliente cierra la sesión ante un 401 y aquí la sesión es válida.
   */
  async changePassword(
    actor: AuthenticatedUser,
    dto: ChangePasswordDto,
    ip?: string,
  ): Promise<ChangePasswordResultDto> {
    const readEm = this.em.fork();
    const current = await this.credentialsRepo.findActivePasswordByUser(
      readEm,
      actor.id,
    );
    if (!current?.secretHash) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una contraseña que cambiar',
        { reason: 'NO_PASSWORD_CREDENTIAL' },
      );
    }
    const matches = await argon2
      .verify(current.secretHash, dto.currentPassword)
      .catch(() => false);
    if (!matches) {
      throw new PreconditionFailedException(
        'La contraseña actual no coincide',
        {
          reason: 'CURRENT_PASSWORD_INVALID',
        },
      );
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new PreconditionFailedException(
        'La contraseña nueva tiene que ser distinta de la actual',
        { reason: 'PASSWORD_UNCHANGED' },
      );
    }
    // argon2 tarda a propósito: se calcula antes de abrir la transacción.
    const secretHash = await argon2.hash(dto.newPassword);

    return this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findActivePasswordByUser(
        tx,
        actor.id,
      );
      if (!credential) {
        throw new PreconditionFailedException(
          'La cuenta no tiene una contraseña que cambiar',
          { reason: 'NO_PASSWORD_CREDENTIAL' },
        );
      }
      credential.secretHash = secretHash;
      credential.hashAlgorithmConceptId = CONCEPTS.HASH_ARGON2ID;
      touch(credential, actor.id);

      const others = (
        await this.sessionsRepo.findActiveByUser(tx, actor.id)
      ).filter((session) => session.tokenId !== actor.sessionId);
      const ids = others.map((session) => session.id);
      const revokedSessions = await this.sessionsRepo.revokeByIds(tx, ids);
      await this.refreshRepo.revokeActiveBySessionIds(tx, ids);

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_CRED_REVOKE,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        ip,
        detailJson: { flow: 'password-changed', revokedSessions },
      });
      this.logger.info(
        { operation: 'iam.account.change-password', userId: actor.id },
        'Contraseña cambiada',
      );
      return { revokedSessions };
    });
  }

  /**
   * Sesiones abiertas del titular, marcando la actual.
   *
   * @param actor - Sujeto autenticado.
   * @returns Sesiones ACTIVAS y vigentes, de la más reciente a la más antigua.
   */
  async listSessions(actor: AuthenticatedUser): Promise<MySessionDto[]> {
    const rows = await this.sessionsRepo.findActiveByUser(
      this.em.fork(),
      actor.id,
    );
    return rows.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ip: session.ip ?? undefined,
      current: session.tokenId === actor.sessionId,
    }));
  }

  /**
   * Revoca una sesión propia y su refresh token.
   *
   * @param actor - Sujeto autenticado.
   * @param sessionId - `id` de la sesión (el que devuelve `listSessions`).
   * @returns Si quedó revocada en esta llamada.
   * @throws ResourceNotFoundException (404) si no existe o es de otro usuario:
   *   no se revela cuál de las dos cosas.
   */
  async revokeSession(
    actor: AuthenticatedUser,
    sessionId: string,
  ): Promise<RevokeMySessionResultDto> {
    return this.em.transactional(async (tx) => {
      const session = await this.sessionsRepo.findById(tx, sessionId);
      if (!session || session.userId !== actor.id) {
        throw new ResourceNotFoundException('Sesión no encontrada', {
          sessionId,
        });
      }
      if (session.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        return { revoked: false };
      }
      await this.sessionsRepo.revokeById(tx, session.id);
      await this.refreshRepo.revokeBySessionId(tx, session.id);
      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: actor.id,
        recordedByUserId: actor.id,
        detailJson: { scope: 'single-session', by: 'owner' },
      });
      return { revoked: true };
    });
  }
}
