import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantMemberships } from '../../directory/entities';
import {
  PractitionerRoleAssignments,
  Practices,
} from '../../practice/entities';
import { PatientProfiles } from '../../profiles/entities';
import { Encounters } from '../../clinical/entities';

/** Pertenencia de un usuario a un tenant, tal como la declara `directory`. */
export interface MembershipScope {
  /** Tenant de la membresía. */
  tenantId: string;
  /** Usuario titular de la membresía. */
  userId: string;
}

/** Tenant y paciente de un encuentro clínico. */
export interface EncounterScope {
  /** Tenant custodio del encuentro. */
  tenantId: string;
  /** Paciente del encuentro. */
  patientProfileId: string;
}

/**
 * Lecturas de alcance que `delegated_access` necesita de otros módulos para
 * probar que la cadena actor → membresía → asignación → set → delegación →
 * paciente/encuentro es del mismo tenant. Sólo lee; son las tablas que ya
 * declaran su FK desde las del módulo.
 */
@Injectable()
export class DelegationScopeRepository {
  /**
   * Tenant y usuario de una membresía.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param membershipId - Identificador de la membresía.
   * @returns La pertenencia, o `null` si no existe.
   */
  async membershipOf(
    em: EntityManager,
    membershipId: string,
  ): Promise<MembershipScope | null> {
    const membership = await em.findOne(TenantMemberships, {
      id: membershipId,
    });
    return membership
      ? { tenantId: membership.tenantId, userId: membership.userId }
      : null;
  }

  /**
   * Tenant de una asignación de rol del profesional (el de su práctica).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param roleAssignmentId - Identificador de la asignación de rol.
   * @returns El tenant, o `null` si la asignación o su práctica no existen.
   */
  async roleAssignmentTenant(
    em: EntityManager,
    roleAssignmentId: string,
  ): Promise<string | null> {
    const assignment = await em.findOne(PractitionerRoleAssignments, {
      id: roleAssignmentId,
    });
    if (!assignment) return null;
    const practice = await em.findOne(Practices, { id: assignment.practiceId });
    return practice?.tenantId ?? null;
  }

  /**
   * Tenant y paciente de un encuentro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Identificador del encuentro.
   * @returns El alcance del encuentro, o `null` si no existe.
   */
  async encounterScope(
    em: EntityManager,
    encounterId: string,
  ): Promise<EncounterScope | null> {
    const encounter = await em.findOne(Encounters, { id: encounterId });
    return encounter
      ? {
          tenantId: encounter.tenantId,
          patientProfileId: encounter.patientProfileId,
        }
      : null;
  }

  /**
   * ¿Existe el perfil de paciente?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil.
   * @returns `true` si existe.
   */
  async patientExists(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<boolean> {
    const patient = await em.findOne(PatientProfiles, {
      profileId: patientProfileId,
    });
    return patient !== null;
  }
}
