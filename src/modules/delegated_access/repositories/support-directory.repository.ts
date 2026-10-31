import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships, Tenants } from '../../directory/entities';
import { PROF } from '../../profiles/profiles.concepts';
import {
  HealthPractitionerProfiles,
  PersonAccountLinks,
} from '../../profiles/entities';

/** Lo que se necesita saber de una organización para abrir un vínculo. */
export interface TenantInfo {
  /** Id de la organización. */
  readonly id: string;
  /** Concepto del tipo de organización. */
  readonly tenantTypeConceptId: string;
}

/**
 * Lecturas y escrituras de `directory` y `profiles` que necesita el vínculo de
 * apoyo: la organización, la membresía de la persona y la persona detrás de la
 * cuenta.
 */
@Injectable()
export class SupportDirectoryRepository {
  /**
   * Organización por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Id de la organización.
   * @returns La organización o `null`.
   */
  async findTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<TenantInfo | null> {
    const tenant = await em.findOne(Tenants, { id: tenantId });
    return tenant
      ? { id: tenant.id, tenantTypeConceptId: tenant.tenantTypeConceptId }
      : null;
  }

  /**
   * Membresía de la persona en la organización, la que esté vigente primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @returns La membresía o `null`.
   */
  async findMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
  ): Promise<TenantMemberships | null> {
    const all = await em.find(TenantMemberships, { userId, tenantId });
    return (
      all.find((m) => m.statusConceptId === DIR.MEMBERSHIP_ACTIVE) ??
      all[0] ??
      null
    );
  }

  /**
   * Abre una membresía de personal en la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @param originConceptId - Por qué se abre (`DIR.MEMBERSHIP_ORIGIN_*`).
   * @param invitedByUserId - Quien la invitó o aprobó.
   * @param statusConceptId - Estado inicial: activa, o `MEMBERSHIP_INVITED` si
   *   queda pendiente de que la organización la apruebe.
   * @returns La membresía creada (aún sin flush).
   */
  createStaffMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
    originConceptId: string,
    invitedByUserId?: string,
    statusConceptId: string = DIR.MEMBERSHIP_ACTIVE,
  ): TenantMemberships {
    return em.create(
      TenantMemberships,
      {
        userId,
        tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        invitedByUserId,
        originConceptId,
        ...createdBy(invitedByUserId),
      },
      { partial: true },
    );
  }

  /**
   * Una membresía que ya existe no cambia de origen cuando se le concede un
   * vínculo de apoyo: el empleado normal sigue siendo empleado. Solo en el
   * sentido contrario se corrige, porque es otra razón de ser: quien existía
   * solo por un vínculo de apoyo y ahora entra por otra puerta (canjeó la
   * invitación de un doctor) ya no desaparece cuando termina ese vínculo.
   */
  private promoteOrigin(
    membership: TenantMemberships,
    originConceptId: string,
    actorUserId?: string,
  ): void {
    if (
      membership.originConceptId !== DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT ||
      originConceptId === DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT
    ) {
      return;
    }
    membership.originConceptId = originConceptId;
    membership.updatedAt = new Date();
    membership.updatedByUserId = actorUserId;
  }

  /**
   * La membresía de personal de la persona en la organización, lista para un
   * vínculo de apoyo: la activa si existe; si hay una terminada o suspendida
   * (hay un solo registro activo por persona y organización) se reactiva; y si
   * no hay ninguna, se abre.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @param originConceptId - Por qué se pide (`DIR.MEMBERSHIP_ORIGIN_*`): se
   *   guarda al abrirla y NO pisa el de una membresía que ya existe.
   * @param invitedByUserId - Quien la invitó o aprobó.
   * @returns La membresía activa (una nueva queda sin flush).
   */
  async ensureActiveStaffMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
    originConceptId: string,
    invitedByUserId?: string,
  ): Promise<TenantMemberships> {
    const existing = await this.findMembership(em, userId, tenantId);
    if (!existing) {
      return this.createStaffMembership(
        em,
        userId,
        tenantId,
        originConceptId,
        invitedByUserId,
      );
    }
    this.promoteOrigin(existing, originConceptId, invitedByUserId);
    if (existing.statusConceptId !== DIR.MEMBERSHIP_ACTIVE) {
      existing.statusConceptId = DIR.MEMBERSHIP_ACTIVE;
      existing.endDate = undefined;
      existing.updatedAt = new Date();
      existing.updatedByUserId = invitedByUserId;
    }
    return existing;
  }

  /**
   * La membresía de personal que deja un canje de código multiuso de un doctor:
   * queda PENDIENTE (`MEMBERSHIP_INVITED`, sin efecto en el token ni en las
   * lecturas de la organización) hasta que la organización la apruebe. Si la
   * persona ya es miembro activo se devuelve esa; una membresía terminada o
   * suspendida no se reactiva por un código que cualquiera puede fotografiar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @param originConceptId - Por qué se abre (`DIR.MEMBERSHIP_ORIGIN_*`).
   * @param invitedByUserId - Quien emitió el código.
   * @returns La membresía activa existente, la pendiente existente o una nueva pendiente.
   */
  async ensurePendingStaffMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
    originConceptId: string,
    invitedByUserId?: string,
  ): Promise<TenantMemberships> {
    const all = await em.find(TenantMemberships, { userId, tenantId });
    const reusable =
      all.find((m) => m.statusConceptId === DIR.MEMBERSHIP_ACTIVE) ??
      all.find((m) => m.statusConceptId === DIR.MEMBERSHIP_INVITED);
    if (reusable) {
      this.promoteOrigin(reusable, originConceptId, invitedByUserId);
      return reusable;
    }
    return this.createStaffMembership(
      em,
      userId,
      tenantId,
      originConceptId,
      invitedByUserId,
      DIR.MEMBERSHIP_INVITED,
    );
  }

  /**
   * Persona (`profiles.persons`) detrás de una cuenta, por su vínculo activo
   * (`PROF.ACCOUNT_LINK_ACTIVE`, el mismo estado que escribe `profiles`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta.
   * @returns El id de persona o `null`.
   */
  async findPersonIdOfUser(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const link = await em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return link?.personId ?? null;
  }

  /**
   * Perfil profesional de la persona detrás de una cuenta
   * (`health_practitioner_profiles.profile_id` ES `persons.id`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta.
   * @returns El id del perfil profesional o `null` si la cuenta no es de un profesional.
   */
  async findPractitionerProfileIdOfUser(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const personId = await this.findPersonIdOfUser(em, userId);
    if (!personId) return null;
    const profile = await em.findOne(HealthPractitionerProfiles, {
      profileId: personId,
    });
    return profile?.profileId ?? null;
  }
}
