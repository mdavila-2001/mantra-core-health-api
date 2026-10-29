import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { SpaceRoleScopeService } from '../../delegated_access/services/space-role-scope.service';
import { CareSpaces, PracticeSites } from '../../practice/entities';
import { StructureAccessService } from '../../practice/services/structure-access.service';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';
import {
  INFRA_ACTION_NOT_ALLOWED,
  INFRA_F4_POLICY,
  delegatedRoleConceptId,
  type InfraF4Action,
} from './infra-f4.policy';

/** Un quirófano y su sede, ya acotados al tenant. */
export interface OperatingRoomRef {
  /** El espacio. */
  readonly space: CareSpaces;
  /** Su sede. */
  readonly site: PracticeSites;
}

/** Sobre qué se pregunta. */
export interface OperatingRoomTarget {
  /** Sede del recurso. */
  readonly site: PracticeSites;
  /** Espacio concreto, si la acción es sobre uno. */
  readonly space?: CareSpaces;
}

/** El 404 uniforme del quirófano: inexistente, de otro tenant o fuera del alcance. */
export function operatingRoomNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Quirófano no encontrado',
    undefined,
    ProceduresPerioperativeErrorReason.OPERATING_ROOM_NOT_FOUND,
  );
}

/**
 * Evalúa la política de F4 (`infra-f4.policy.ts`) para un actor y un quirófano.
 *
 * Respuestas (S5 ≠ S6): un espacio o una sede que no están en el tenant del contexto, o
 * que el actor no ve por su sucursal, responden **404** sin distinguirse de un inexistente;
 * uno que ve pero sobre el que no puede la acción responde **403**
 * `INFRA_ACTION_NOT_ALLOWED` con `details.requiredRoles`. La interfaz sólo refleja: esta
 * clase es la autoridad.
 */
@Injectable()
export class OperatingRoomAccessService {
  /**
   * @param structure - Nivel del actor en el tenant (F1).
   * @param scope - Alcance de las asignaciones delegadas.
   */
  constructor(
    private readonly structure: StructureAccessService,
    private readonly scope: SpaceRoleScopeService,
  ) {}

  /**
   * Carga un espacio y su sede **del tenant del contexto**.
   *
   * @param tx - Transacción activa.
   * @param careSpaceId - Espacio pedido por el cliente.
   * @returns El espacio con su sede, o `null` si no existe en el tenant.
   */
  async loadRoom(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<OperatingRoomRef | null> {
    const tenantId = requireTenantId();
    const space = await tx.findOne(CareSpaces, { id: careSpaceId, tenantId });
    if (!space || space.tenantId !== tenantId) return null;
    const site = await tx.findOne(PracticeSites, {
      id: space.practiceSiteId,
      tenantId,
    });
    return site ? { space, site } : null;
  }

  /**
   * Carga una sede del tenant del contexto.
   *
   * @param tx - Transacción activa.
   * @param siteId - Sede pedida por el cliente.
   * @returns La sede, o `null` si no existe en el tenant.
   */
  async loadSite(
    tx: EntityManager,
    siteId: string,
  ): Promise<PracticeSites | null> {
    const tenantId = requireTenantId();
    const site = await tx.findOne(PracticeSites, { id: siteId, tenantId });
    return site && site.tenantId === tenantId ? site : null;
  }

  /**
   * ¿Puede el actor la acción sobre el objetivo? No lanza.
   *
   * @param tx - Transacción activa.
   * @param actor - Quien pide.
   * @param action - Acción de la política.
   * @param target - Sede y, si corresponde, espacio.
   * @returns `true` si la política lo concede.
   */
  async can(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: InfraF4Action,
    target: OperatingRoomTarget,
  ): Promise<boolean> {
    if (await this.grantedBroadly(tx, actor, action, target.site)) return true;
    return this.holdsDelegated(tx, actor, action, target);
  }

  /**
   * Los quirófanos de una lista que el actor puede ver con la acción. Una asignación
   * delegada acotada a un espacio o a una unidad abre la lectura **de la sede** (para
   * poder entrar), pero no la de los demás quirófanos: el listado se recorta a lo que su
   * alcance contiene. Quien lo tiene por estructura o por un rol global ve todos.
   *
   * @param tx - Transacción activa.
   * @param actor - Quien lee.
   * @param action - Acción de lectura de la política.
   * @param site - Sede de la lista.
   * @param rooms - Quirófanos candidatos (de la sede y del tenant).
   * @returns Los que el actor ve, en el mismo orden.
   */
  async visibleRooms(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: InfraF4Action,
    site: PracticeSites,
    rooms: readonly CareSpaces[],
  ): Promise<CareSpaces[]> {
    if (await this.grantedBroadly(tx, actor, action, site)) return [...rooms];
    const visible: CareSpaces[] = [];
    for (const space of rooms) {
      if (await this.holdsDelegated(tx, actor, action, { site, space })) {
        visible.push(space);
      }
    }
    return visible;
  }

  /** Concedida por estructura (plataforma, organización, sucursal) o por un rol global. */
  private async grantedBroadly(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: InfraF4Action,
    site: PracticeSites,
  ): Promise<boolean> {
    const tenantId = requireTenantId();
    const rule = INFRA_F4_POLICY[action];
    const access = await this.structure.resolve(tx, tenantId, actor);

    if (
      rule.structureAdmin &&
      this.structure.canSee(access, site) &&
      (access.level === 'PLATFORM' ||
        access.level === 'ORG' ||
        access.level === 'BRANCH_ADMIN')
    ) {
      return true;
    }
    if (
      rule.roles.some((role) => roleAuthorizesInTenant(actor, role, tenantId))
    ) {
      // Un rol global concede la acción dentro del tenant; la sucursal no lo acota
      // (el jefe de quirófano de un tenant opera todos sus bloques quirúrgicos).
      return access.level !== 'NONE' || actor.roles.includes('SUPERADMIN');
    }
    return false;
  }

  /** Concedida por una asignación delegada vigente cuyo alcance contiene el objetivo. */
  private holdsDelegated(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: InfraF4Action,
    target: OperatingRoomTarget,
  ): Promise<boolean> {
    return this.holdsAnyDelegated(tx, actor, requireTenantId(), action, target);
  }

  /**
   * Exige la acción: 404 si el actor no ve la sede, 403 si la ve y no puede.
   *
   * @param tx - Transacción activa.
   * @param actor - Quien pide.
   * @param action - Acción de la política.
   * @param target - Sede y, si corresponde, espacio.
   * @throws ResourceNotFoundException (`OPERATING_ROOM_NOT_FOUND`) fuera de su alcance.
   * @throws InsufficientRoleException (`INFRA_ACTION_NOT_ALLOWED`) sin permiso.
   */
  async assertCan(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: InfraF4Action,
    target: OperatingRoomTarget,
  ): Promise<void> {
    const tenantId = requireTenantId();
    const access = await this.structure.resolve(tx, tenantId, actor);
    const globallyRoled = INFRA_F4_POLICY[action].roles.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    // Quien sólo tiene una asignación delegada ve la sede a través de ella: la sucursal
    // de su membresía no lo oculta. Quien no tiene nada que lo vincule, no la ve.
    if (
      !this.structure.canSee(access, target.site) &&
      !globallyRoled &&
      !(await this.holdsAnyDelegated(tx, actor, tenantId, action, target))
    ) {
      throw operatingRoomNotFound();
    }
    if (!(await this.can(tx, actor, action, target))) {
      throw new InsufficientRoleException(
        'No tiene permiso para esta acción sobre el quirófano',
        {
          action,
          requiredRoles: [
            ...INFRA_F4_POLICY[action].roles,
            ...INFRA_F4_POLICY[action].delegatedRoleKeys,
          ],
        },
        INFRA_ACTION_NOT_ALLOWED,
      );
    }
  }

  private async holdsAnyDelegated(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    action: InfraF4Action,
    target: OperatingRoomTarget,
  ): Promise<boolean> {
    for (const key of INFRA_F4_POLICY[action].delegatedRoleKeys) {
      const roleConceptId = delegatedRoleConceptId(key);
      const held = target.space
        ? await this.scope.holdsRoleOverSpace(tx, {
            userId: actor.id,
            tenantId,
            roleConceptId,
            careSpaceId: target.space.id,
          })
        : await this.scope.holdsRoleInSite(tx, {
            userId: actor.id,
            tenantId,
            roleConceptId,
            siteId: target.site.id,
          });
      if (held) return true;
    }
    return false;
  }
}
