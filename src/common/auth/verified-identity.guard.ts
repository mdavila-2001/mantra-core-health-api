import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PersonAccountLinks } from '../../modules/profiles/entities';
import { PROF } from '../../modules/profiles/profiles.concepts';
// Del archivo concreto y no del barril `repositories/`: ese barril arrastra
// repositorios que importan el barril `common`, que re-exporta este mismo guard
// — el ciclo deja la clase sin inicializar al cargar el módulo.
import { findCurrentIdentityAssertionForPerson } from '../../modules/identity_assurance/repositories/identity-assertions.repository';
import { IdentityVerificationRequiredException } from '../errors/domain.exception';
import { REQUIRES_VERIFIED_IDENTITY_KEY } from './requires-verified-identity.decorator';
import type { AuthenticatedRequest } from './authenticated-user.interface';

/**
 * Exige una aserción de identidad vigente para los handlers marcados con
 * `@RequiresVerifiedIdentity()`. Corre después de `JwtAuthGuard`/`RolesGuard`,
 * así que puede asumir que `request.user` existe.
 *
 * La verdad se consulta en cada petición y no se cachea en el JWT: una aserción
 * revocada por fraude debe cerrar el acceso de inmediato, no cuando caduque el
 * token que el usuario ya tiene en la mano.
 *
 * Rechaza con `IDENTITY_VERIFICATION_REQUIRED` y no con el `FORBIDDEN` genérico
 * de `RolesGuard`. Los dos son 403, pero para la persona son estados opuestos:
 * rol insuficiente es un muro sin salida, e identidad sin verificar es una
 * puerta —hay algo que puede hacer—. El cliente tiene que poder ofrecer el flujo
 * de verificación en un caso y no en el otro, y antes sólo podía separarlos
 * comparando el texto del mensaje. `details.reason` distingue además los tres
 * subcasos sin que nadie tenga que leer la redacción.
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

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId) {
      throw new IdentityVerificationRequiredException(
        'Se requiere una identidad verificada',
        { reason: 'no-authenticated-user' },
      );
    }

    const em = this.em.fork();
    const link = await em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) {
      throw new IdentityVerificationRequiredException(
        'La cuenta no tiene una persona vinculada que verificar',
        { reason: 'no-person-linked' },
      );
    }

    // El predicado de «identidad vigente» vive en `identity_assurance`, que es
    // su dueño; aquí sólo se decide qué hacer con la respuesta.
    const assertion = await findCurrentIdentityAssertionForPerson(
      em,
      link.personId,
    );
    if (!assertion) {
      throw new IdentityVerificationRequiredException(
        'Verifique su identidad para acceder a esta función',
        { reason: 'identity-not-verified' },
      );
    }

    return true;
  }
}
