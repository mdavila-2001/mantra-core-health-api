import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { GuardianLinkInvitations } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una invitación nueva. */
export interface CreateGuardianLinkInvitationData {
  /** Organización del alta. */
  tenantId?: string;
  /** Perfil del paciente. */
  patientProfileId: string;
  /** Persona relacionada (el vínculo). */
  relatedPersonId: string;
  /** Persona del tutor. */
  guardianPersonId: string;
  /** Evento que la originó. */
  domainEventId: string;
  /** Estado inicial. */
  statusConceptId: string;
  /** Quién escribe la fila. */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.guardian_link_invitations`. */
@Injectable()
export class GuardianLinkInvitationsRepository {
  /**
   * La invitación de un evento, bloqueada para emitir o reemitir su token.
   *
   * @param em - Transacción activa.
   * @param domainEventId - Evento de dominio de origen.
   * @returns La invitación, o `null` si todavía no existe.
   */
  findByDomainEventForUpdate(
    em: EntityManager,
    domainEventId: string,
  ): Promise<GuardianLinkInvitations | null> {
    return em.findOne(
      GuardianLinkInvitations,
      { domainEventId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Una invitación por id, bloqueada para asentar el resultado del envío.
   *
   * @param em - Transacción activa.
   * @param id - Invitación.
   * @returns La invitación, o `null`.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<GuardianLinkInvitations | null> {
    return em.findOne(
      GuardianLinkInvitations,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * La invitación cuyo token vigente tiene este hash, bloqueada para
   * confirmarla una sola vez.
   *
   * @param em - Transacción activa.
   * @param tokenHash - SHA-256 hex del token recibido.
   * @returns La invitación, o `null`.
   */
  findByTokenHashForUpdate(
    em: EntityManager,
    tokenHash: string,
  ): Promise<GuardianLinkInvitations | null> {
    return em.findOne(
      GuardianLinkInvitations,
      { tokenHash },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea la invitación (sin token todavía: lo pone quien la emite).
   *
   * @param em - Transacción activa.
   * @param data - Datos de la invitación.
   * @returns La entidad gestionada.
   */
  create(
    em: EntityManager,
    data: CreateGuardianLinkInvitationData,
  ): GuardianLinkInvitations {
    return em.create(
      GuardianLinkInvitations,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        relatedPersonId: data.relatedPersonId,
        guardianPersonId: data.guardianPersonId,
        domainEventId: data.domainEventId,
        statusConceptId: data.statusConceptId,
        attemptCount: 0,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
