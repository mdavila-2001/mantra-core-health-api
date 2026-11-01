import { Injectable } from '@nestjs/common';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { PracticeTenantLookupService } from './practice-tenant-lookup.service';

/**
 * Cómo se acota el acceso de un actor a las prácticas del tenant activo.
 *
 * - `ALL`: ve todas las del tenant medido (administración de seguridad y
 *   aprobación contable que autoriza en ese tenant).
 * - `UNSCOPED`: no es profesional; la regla no lo filtra y manda lo que diga
 *   el `@Roles` de la ruta y el aislamiento por tenant.
 * - `ACTIVE_ASSIGNMENTS`: es `PRACTITIONER`; sólo las prácticas donde tiene
 *   una vinculación ACTIVE vigente.
 */
export type PracticeAccessScope = 'ALL' | 'UNSCOPED' | 'ACTIVE_ASSIGNMENTS';

/** Roles que ven todas las prácticas del tenant donde autorizan. */
const PRACTICE_ADMIN_ROLES = ['SECURITY_ADMIN', 'ACCOUNTING_APPROVER'] as const;

/**
 * El único dueño de la regla «qué prácticas puede ver este actor».
 *
 * Es la regla que nació en contabilidad (`assertPractitionerOwnsPractice`):
 * `SECURITY_ADMIN` o `ACCOUNTING_APPROVER` ven todo; quien no es
 * `PRACTITIONER` no se filtra; un `PRACTITIONER` sólo ve las prácticas con
 * vinculación ACTIVE. Contabilidad la consume desde acá y conserva su propia
 * traducción a error (422); `practice` la usa para sus lecturas.
 *
 * El rol administrativo se mide en el tenant de la práctica
 * (`practices.tenant_id`) con `roleAuthorizesInTenant` (MCH-001, #1241): el
 * concedido sin ámbito ve las prácticas de cualquier tenant; el acotado en
 * `scopedRoles` sólo las de sus tenants, y fuera de ellos no cuenta —el actor
 * queda con el alcance que le dan sus otros roles—. Sin tenant (`undefined`)
 * sólo vale el global.
 *
 * Existe porque todos los médicos auto-registrados viven en el tenant
 * compartido `DEFAULT`: el aislamiento por tenant no separa a un médico de
 * las prácticas de otro.
 *
 * @param actor - Actor autenticado (`roles` y `scopedRoles`).
 * @param tenantId - Tenant de las prácticas consultadas.
 * @returns El alcance que le corresponde.
 */
export function practiceAccessScope(
  actor: AuthenticatedUser,
  tenantId: string | undefined,
): PracticeAccessScope {
  if (
    PRACTICE_ADMIN_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    )
  ) {
    return 'ALL';
  }
  if (!actor.roles.includes('PRACTITIONER')) {
    return 'UNSCOPED';
  }
  return 'ACTIVE_ASSIGNMENTS';
}

/**
 * `practiceAccessScope` medido en el tenant de una práctica concreta.
 *
 * Sólo consulta el tenant de la práctica cuando hace falta: un rol
 * administrativo global decide sin leer nada, y quien no tiene ninguno
 * tampoco depende del tenant. Una práctica inexistente (o un servicio sin
 * `lookup`) se mide sin tenant: sólo vale el rol global.
 *
 * @param actor - Actor autenticado.
 * @param practiceId - Práctica sobre la que decide.
 * @param lookup - Puerto de lectura del tenant de la práctica.
 * @returns El alcance del actor sobre esa práctica.
 */
export async function practiceAccessScopeFor(
  actor: AuthenticatedUser,
  practiceId: string,
  lookup: Pick<PracticeTenantLookupService, 'findTenantOfPractice'> | undefined,
): Promise<PracticeAccessScope> {
  const unmeasured = practiceAccessScope(actor, undefined);
  const holdsAdminRole = PRACTICE_ADMIN_ROLES.some((role) =>
    actor.roles.includes(role),
  );
  if (unmeasured === 'ALL' || !holdsAdminRole || !lookup) {
    return unmeasured;
  }
  const tenantId = await lookup.findTenantOfPractice(practiceId);
  return practiceAccessScope(actor, tenantId ?? undefined);
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
   * @param tenantId - Tenant dueño de las prácticas que se filtran.
   * @returns Ids de práctica permitidos, o `null` para «sin filtro».
   */
  async allowedPracticeIds(
    actor: AuthenticatedUser,
    tenantId: string | undefined,
  ): Promise<ReadonlySet<string> | null> {
    if (practiceAccessScope(actor, tenantId) !== 'ACTIVE_ASSIGNMENTS') {
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
   * @param tenantId - Tenant dueño de esa práctica (`practices.tenant_id`).
   * @returns `true` si la regla se lo permite.
   */
  async canAccess(
    actor: AuthenticatedUser,
    practiceId: string,
    tenantId: string | undefined,
  ): Promise<boolean> {
    const allowed = await this.allowedPracticeIds(actor, tenantId);
    return allowed === null || allowed.has(practiceId);
  }
}
