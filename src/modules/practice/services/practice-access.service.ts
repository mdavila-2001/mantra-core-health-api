import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common';
import { PracticeTenantLookupService } from './practice-tenant-lookup.service';

/**
 * Cómo se acota el acceso de un actor a las prácticas del tenant activo.
 *
 * - `ALL`: ve todas (administración de seguridad y aprobación contable).
 * - `UNSCOPED`: no es profesional; la regla no lo filtra y manda lo que diga
 *   el `@Roles` de la ruta y el aislamiento por tenant.
 * - `ACTIVE_ASSIGNMENTS`: es `PRACTITIONER`; sólo las prácticas donde tiene
 *   una vinculación ACTIVE vigente.
 */
export type PracticeAccessScope = 'ALL' | 'UNSCOPED' | 'ACTIVE_ASSIGNMENTS';

/**
 * El único dueño de la regla «qué prácticas puede ver este actor».
 *
 * Es la regla que nació en contabilidad (`assertPractitionerOwnsPractice`):
 * `SECURITY_ADMIN` o `ACCOUNTING_APPROVER` ven todo; quien no es
 * `PRACTITIONER` no se filtra; un `PRACTITIONER` sólo ve las prácticas con
 * vinculación ACTIVE. Contabilidad la consume desde acá y conserva su propia
 * traducción a error (422); `practice` la usa para sus lecturas.
 *
 * Existe porque todos los médicos auto-registrados viven en el tenant
 * compartido `DEFAULT`: el aislamiento por tenant no separa a un médico de
 * las prácticas de otro.
 *
 * @param roles - Roles del actor.
 * @returns El alcance que le corresponde.
 */
export function practiceAccessScope(
  roles: readonly string[],
): PracticeAccessScope {
  if (
    roles.includes('SECURITY_ADMIN') ||
    roles.includes('ACCOUNTING_APPROVER')
  ) {
    return 'ALL';
  }
  if (!roles.includes('PRACTITIONER')) {
    return 'UNSCOPED';
  }
  return 'ACTIVE_ASSIGNMENTS';
}

/**
 * Aplica `practiceAccessScope` a las lecturas de `practice`, resolviendo las
 * vinculaciones ACTIVE del profesional.
 */
@Injectable()
export class PracticeAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param lookup - Vinculaciones ACTIVE del profesional.
   */
  constructor(private readonly lookup: PracticeTenantLookupService) {}

  /**
   * Las prácticas que el actor puede ver, o `null` si no se le filtra.
   *
   * Un `PRACTITIONER` sin perfil profesional en el token no tiene forma de
   * probar ninguna vinculación: recibe el conjunto vacío, no «todas».
   *
   * @param actor - Actor autenticado.
   * @returns Ids de práctica permitidos, o `null` para «sin filtro».
   */
  async allowedPracticeIds(
    actor: AuthenticatedUser,
  ): Promise<ReadonlySet<string> | null> {
    if (practiceAccessScope(actor.roles) !== 'ACTIVE_ASSIGNMENTS') {
      return null;
    }
    if (!actor.practitionerProfileId) {
      return new Set();
    }
    return new Set(
      await this.lookup.findActivePracticeIdsForPractitioner(
        actor.practitionerProfileId,
      ),
    );
  }

  /**
   * ¿Puede el actor ver esta práctica?
   *
   * @param actor - Actor autenticado.
   * @param practiceId - Práctica consultada.
   * @returns `true` si la regla se lo permite.
   */
  async canAccess(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<boolean> {
    const allowed = await this.allowedPracticeIds(actor);
    return allowed === null || allowed.has(practiceId);
  }
}
