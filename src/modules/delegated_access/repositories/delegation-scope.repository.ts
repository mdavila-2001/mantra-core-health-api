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

/** Nodos de alcance de una asignación de usuario de organización. */
export type ScopeNodeKind =
  | 'practice'
  | 'practice_site'
  | 'clinical_unit'
  | 'care_space'
  | 'diagnostic_unit'
  | 'pharmacy';

/** Consulta que devuelve el tenant de cada tipo de nodo (siempre un único parámetro: el id). */
const NODE_TENANT_SQL: Readonly<Record<ScopeNodeKind, string>> = {
  practice: 'select tenant_id from practice.practices where id = ? limit 1',
  practice_site: `select p.tenant_id from practice.practice_sites s
      join practice.practices p on p.id = s.practice_id where s.id = ? limit 1`,
  clinical_unit: `select p.tenant_id from practice.clinical_units u
      join practice.practice_sites s on s.id = u.practice_site_id
      join practice.practices p on p.id = s.practice_id where u.id = ? limit 1`,
  care_space: `select p.tenant_id from practice.care_spaces c
      join practice.practice_sites s on s.id = c.practice_site_id
      join practice.practices p on p.id = s.practice_id where c.id = ? limit 1`,
  diagnostic_unit:
    'select tenant_id from diagnostic_units.diagnostic_units where id = ? limit 1',
  pharmacy: 'select tenant_id from pharmacy.pharmacies where id = ? limit 1',
};

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
   * Organización dueña de un nodo de alcance (práctica, sede, unidad, espacio,
   * unidad de diagnóstico o farmacia). Estas tablas no llevan `tenant_id`
   * propio (salvo práctica, diagnóstico y farmacia): el de una sede, unidad o
   * espacio es el de su práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param kind - Tipo de nodo.
   * @param id - Identificador del nodo.
   * @returns El tenant, o `null` si el nodo no existe.
   */
  async scopeNodeTenant(
    em: EntityManager,
    kind: ScopeNodeKind,
    id: string,
  ): Promise<string | null> {
    const rows = await em.execute<{ tenant_id: string }[]>(
      NODE_TENANT_SQL[kind],
      [id],
    );
    return rows[0]?.tenant_id ?? null;
  }

  /**
   * ¿La persona tiene membresía (en cualquier estado) en la organización?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @returns `true` si existe la membresía.
   */
  async userHasMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const rows = await em.execute<{ ok: number }[]>(
      'select 1 as ok from directory.tenant_memberships where user_id = ? and tenant_id = ? limit 1',
      [userId, tenantId],
    );
    return rows.length > 0;
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
   * Perfil profesional titular de una asignación de rol.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param roleAssignmentId - Identificador de la asignación de rol.
   * @returns El perfil del doctor, o `null` si la asignación no existe.
   */
  async roleAssignmentPractitioner(
    em: EntityManager,
    roleAssignmentId: string,
  ): Promise<string | null> {
    const assignment = await em.findOne(PractitionerRoleAssignments, {
      id: roleAssignmentId,
    });
    return assignment?.practitionerProfileId ?? null;
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
