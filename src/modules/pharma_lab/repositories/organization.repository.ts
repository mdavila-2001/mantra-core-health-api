import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { PharmaLabLinkEvents, PharmaLabStaff, PharmaLabs } from '../entities';

/**
 * Acceso a datos del laboratorio y su personal. Stateless: cada método recibe el
 * `EntityManager` de la transacción activa, igual que el resto de repositorios
 * del sistema.
 */
@Injectable()
export class OrganizationRepository {
  /**
   * Obtiene el laboratorio por identificador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del laboratorio.
   * @returns El laboratorio, o `null` si no existe.
   */
  findLab(em: EntityManager, id: string): Promise<PharmaLabs | null> {
    return em.findOne(PharmaLabs, { id });
  }

  /**
   * Obtiene el laboratorio asociado a una organización del directorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador del tenant.
   * @returns El laboratorio, o `null` si esa organización no es un laboratorio.
   */
  findLabByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<PharmaLabs | null> {
    return em.findOne(PharmaLabs, { tenantId });
  }

  /**
   * Lista los laboratorios registrados.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones a las que se acota el listado; `null`
   *   sólo para quien administra la plataforma entera y ve todas.
   * @returns Laboratorios ordenados por razón social.
   */
  listLabs(
    em: EntityManager,
    tenantIds: readonly string[] | null,
  ): Promise<PharmaLabs[]> {
    const where =
      tenantIds === null ? {} : { tenantId: { $in: [...tenantIds] } };
    return em.find(PharmaLabs, where, { orderBy: { legalName: 'asc' } });
  }

  /**
   * Crea el laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createLab(em: EntityManager, data: Record<string, unknown>): PharmaLabs {
    return em.create(
      PharmaLabs,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene una ficha de personal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la ficha.
   * @returns La ficha, o `null` si no existe.
   */
  findStaff(em: EntityManager, id: string): Promise<PharmaLabStaff | null> {
    return em.findOne(PharmaLabStaff, { id });
  }

  /**
   * Obtiene la ficha de personal de una cuenta dentro de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param userId - Cuenta.
   * @returns La ficha, o `null` si esa cuenta no es personal del laboratorio.
   */
  findStaffByUser(
    em: EntityManager,
    pharmaLabId: string,
    userId: string,
  ): Promise<PharmaLabStaff | null> {
    return em.findOne(PharmaLabStaff, { pharmaLabId, userId });
  }

  /**
   * Lista el personal de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Personal ordenado por fecha de ingreso descendente.
   */
  listStaff(em: EntityManager, pharmaLabId: string): Promise<PharmaLabStaff[]> {
    return em.find(
      PharmaLabStaff,
      { pharmaLabId },
      { orderBy: { hiredOn: 'desc' } },
    );
  }

  /**
   * Crea una ficha de personal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createStaff(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmaLabStaff {
    return em.create(
      PharmaLabStaff,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Sella un evento de vinculación en la bitácora del laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del evento.
   * @returns El evento creado, aún sin `flush`.
   */
  appendLinkEvent(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmaLabLinkEvents {
    const now = new Date();
    return em.create(
      PharmaLabLinkEvents,
      {
        occurredAt: now,
        createdAt: now,
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista la bitácora de vinculaciones de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Eventos del más reciente al más antiguo.
   */
  listLinkEvents(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<PharmaLabLinkEvents[]> {
    return em.find(
      PharmaLabLinkEvents,
      { pharmaLabId },
      { orderBy: { occurredAt: 'desc' }, limit: 500 },
    );
  }
}
