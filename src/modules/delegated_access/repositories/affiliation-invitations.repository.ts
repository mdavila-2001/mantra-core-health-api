import { Injectable } from '@nestjs/common';
import { LockMode, type EntityManager } from '@mikro-orm/postgresql';
import {
  AffiliationInvitations,
  AffiliationInvitationUses,
} from '../../directory/entities';

/** Datos para crear una invitación de afiliación. */
export interface CreateInvitationData {
  /** Organización que invita. */
  readonly tenantId: string;
  /** Concepto del tipo (doctor o personal de apoyo). */
  readonly kindConceptId: string;
  /** Persona específica a la que va dirigida, si la hay. */
  readonly targetPersonId?: string;
  /** Hash del código (nunca el código). */
  readonly tokenHash: string;
  /** Cantidad máxima de canjes. */
  readonly maxUses: number;
  /** Vencimiento. */
  readonly expiresAt: Date;
  /** Plantilla de rol, para personal de apoyo. */
  readonly roleTemplateId?: string;
  /** Concepto de estado. */
  readonly statusConceptId: string;
  /** Quien la crea. */
  readonly createdByUserId: string;
}

/** Acceso a datos de `directory.affiliation_invitations` y sus usos. */
@Injectable()
export class AffiliationInvitationsRepository {
  /**
   * Invitación por hash de código.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenHash - Hash del código.
   * @returns La invitación o `null`.
   */
  findByTokenHash(
    em: EntityManager,
    tokenHash: string,
    options: { lock?: boolean } = {},
  ): Promise<AffiliationInvitations | null> {
    return em.findOne(
      AffiliationInvitations,
      { tokenHash },
      options.lock ? { lockMode: LockMode.PESSIMISTIC_WRITE } : {},
    );
  }

  /**
   * Invitación por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la invitación.
   * @returns La invitación o `null`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<AffiliationInvitations | null> {
    return em.findOne(AffiliationInvitations, { id });
  }

  /**
   * Invitaciones de una organización, de la más reciente a la más antigua.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Sus invitaciones (sin el código, que solo existe como hash).
   */
  listByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<AffiliationInvitations[]> {
    return em.find(
      AffiliationInvitations,
      { tenantId },
      { orderBy: { createdAt: 'DESC' }, limit: 200 },
    );
  }

  /**
   * Un canje previo de la misma persona sobre la misma invitación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invitationId - Invitación.
   * @param userId - Persona.
   * @returns El canje o `null`.
   */
  findUseBy(
    em: EntityManager,
    invitationId: string,
    userId: string,
  ): Promise<AffiliationInvitationUses | null> {
    return em.findOne(AffiliationInvitationUses, {
      affiliationInvitationId: invitationId,
      usedByUserId: userId,
    });
  }

  /**
   * Crea una invitación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la invitación.
   * @returns La invitación creada (aún sin flush).
   */
  create(
    em: EntityManager,
    data: CreateInvitationData,
  ): AffiliationInvitations {
    const now = new Date();
    return em.create(
      AffiliationInvitations,
      {
        tenantId: data.tenantId,
        kindConceptId: data.kindConceptId,
        targetPersonId: data.targetPersonId,
        tokenHash: data.tokenHash,
        maxUses: data.maxUses,
        usesCount: 0,
        expiresAt: data.expiresAt,
        roleTemplateId: data.roleTemplateId,
        statusConceptId: data.statusConceptId,
        createdByUserId: data.createdByUserId,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  /**
   * Registra un canje.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización de la invitación.
   * @param invitationId - Invitación canjeada.
   * @param userId - Persona que canjea.
   * @param outcomeConceptId - Resultado del canje.
   */
  recordUse(
    em: EntityManager,
    tenantId: string,
    invitationId: string,
    userId: string,
    outcomeConceptId: string,
  ): void {
    em.create(
      AffiliationInvitationUses,
      {
        tenantId,
        affiliationInvitationId: invitationId,
        usedByUserId: userId,
        occurredAt: new Date(),
        outcomeConceptId,
      },
      { partial: true },
    );
  }
}
