import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';
import { PersonAccountLinks } from '../../modules/profiles/entities';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { IdentityAssertions } from '../../modules/identity_assurance/entities';
import { IDA } from '../../modules/identity_assurance/identity_assurance.concepts';
import { REQUIRES_VERIFIED_IDENTITY_KEY } from './requires-verified-identity.decorator';
import type { AuthenticatedUser } from './authenticated-user.interface';

/** Sujetos cuya aserción prueba la identidad de una persona. */
const PERSON_SUBJECT_TYPES = [
  IDA.SUBJECT_PATIENT_IDENTITY,
  IDA.SUBJECT_PRACTITIONER_IDENTITY,
];

/**
 * Exige una aserción de identidad vigente para los handlers marcados con
 * `@RequiresVerifiedIdentity()`. Corre después de `JwtAuthGuard`/`RolesGuard`,
 * así que puede asumir que `request.user` existe.
 *
 * La verdad se consulta en cada petición y no se cachea en el JWT: una aserción
 * revocada por fraude debe cerrar el acceso de inmediato, no cuando caduque el
 * token que el usuario ya tiene en la mano.
 */
@Injectable()
export class VerifiedIdentityGuard implements CanActivate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Valor de reflector requerido por la operación.
   * @param em - Contexto de persistencia o transacción activa.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly em: EntityManager,
  ) {}

  /**
   * Obtiene can activate.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Si el handler puede ejecutarse.
   * @throws ForbiddenException si el titular no tiene la identidad verificada.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_VERIFIED_IDENTITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<
      Request & {
        /**
         * Valor de user mantenido por la instancia.
         */
        user?: AuthenticatedUser;
      }
    >();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('Se requiere una identidad verificada');
    }

    const em = this.em.fork();
    const link = await em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) {
      throw new ForbiddenException(
        'La cuenta no tiene una persona vinculada que verificar',
      );
    }

    const now = new Date();
    const assertion = await em.findOne(IdentityAssertions, {
      subjectTypeConceptId: { $in: PERSON_SUBJECT_TYPES },
      subjectEntityId: link.personId,
      revokedAt: null,
      // Una aserción sin caducidad no expira; con caducidad, debe estar vigente.
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
    if (!assertion) {
      throw new ForbiddenException(
        'Verifique su identidad para acceder a esta función',
      );
    }

    return true;
  }
}
