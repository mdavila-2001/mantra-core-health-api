import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerRoleAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para asignar un rol de profesional a sitio/unidad/servicio. */
export interface CreateRoleAssignmentData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a healthcare service.
   */
  healthcareServiceId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a supervisor practitioner profile.
   */
  supervisorPractitionerProfileId?: string;
  /**
   * Valor de revenue share percent mantenido por la instancia.
   */
  revenueSharePercent?: string;
  /**
   * Valor de is primary mantenido por la instancia.
   */
  isPrimary?: boolean;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.practitioner_role_assignments` (stateless). */
@Injectable()
export class PractitionerRoleAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PractitionerRoleAssignments | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerRoleAssignments | null> {
    return em.findOne(PractitionerRoleAssignments, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<PractitionerRoleAssignments[]>`.
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    return em.find(PractitionerRoleAssignments, { practiceSiteId });
  }

  /**
   * Asignaciones vigentes de varios profesionales, con sede declarada.
   *
   * «Vigente» es `valid_to IS NULL` **y** el estado activo: una asignación que
   * alguien dio de baja sigue teniendo la fecha abierta hasta que se cierra, y
   * ofrecerla como «dónde atiende» mandaría pacientes a un consultorio del que
   * el profesional ya se fue.
   *
   * Se pide por lote y no de a uno porque quien la usa —la agenda— resuelve la
   * ubicación de todos sus recursos en la misma pantalla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Profesionales consultados.
   * @param activeStatusConceptId - Concepto de asignación activa.
   * @returns Sus asignaciones vigentes que declaran sede.
   */
  async findCurrentWithSite(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    activeStatusConceptId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    if (practitionerProfileIds.length === 0) return [];
    const rows = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId: { $in: [...practitionerProfileIds] },
      practiceSiteId: { $ne: null },
      validTo: null,
      statusConceptId: activeStatusConceptId,
    });
    // La principal primero: un profesional puede atender en varias sedes, y la
    // que marcó como principal es la respuesta a «¿dónde lo encuentro?».
    return rows.sort(
      (a, b) => Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false),
    );
  }

  /**
   * Todas las vinculaciones de un profesional, en cualquier organización y
   * cualquier estado (pendiente, activa, suspendida, rechazada o finalizada).
   *
   * A diferencia de {@link findCurrentWithSite}, que resuelve "dónde atiende
   * hoy" para la agenda, esta lectura es la del propio profesional revisando
   * "en qué organizaciones estoy y cómo estoy en cada una" (Carril 18, spec
   * líneas 1619-1664): incluye lo pendiente de aprobación y lo histórico.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @returns Sus vinculaciones, de la más reciente a la más antigua.
   */
  findByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    return em.find(
      PractitionerRoleAssignments,
      { practitionerProfileId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Vinculaciones ACTIVE y vigentes (`valid_to IS NULL`) de un profesional,
   * en cualquier organización y con o sin sede declarada.
   *
   * A diferencia de {@link findCurrentWithSite} (que exige sede, porque lo
   * usa la agenda para resolver "dónde"), esta lectura la usa `accounting`
   * (Carril 18) sólo para comprobar pertenencia — un profesional puede tener
   * una vinculación válida sin sede asignada todavía.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @param activeStatusConceptId - Concepto de vinculación activa.
   * @returns Sus vinculaciones activas vigentes.
   */
  findActiveByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
    activeStatusConceptId: string,
  ): Promise<PractitionerRoleAssignments[]> {
    return em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
      statusConceptId: activeStatusConceptId,
      validTo: null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerRoleAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateRoleAssignmentData,
  ): PractitionerRoleAssignments {
    return em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId: data.practitionerProfileId,
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        healthcareServiceId: data.healthcareServiceId,
        roleConceptId: data.roleConceptId,
        specialtyConceptId: data.specialtyConceptId,
        supervisorPractitionerProfileId: data.supervisorPractitionerProfileId,
        revenueSharePercent: data.revenueSharePercent,
        isPrimary: data.isPrimary,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
