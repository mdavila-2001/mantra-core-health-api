import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  PharmacovigilanceActions,
  PharmacovigilanceReports,
} from '../entities';

/** Acceso a datos de farmacovigilancia. */
@Injectable()
export class PharmacovigilanceRepository {
  /**
   * Obtiene un reporte.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del reporte.
   * @returns El reporte, o `null` si no existe.
   */
  findReport(
    em: EntityManager,
    id: string,
  ): Promise<PharmacovigilanceReports | null> {
    return em.findOne(PharmacovigilanceReports, { id });
  }

  /**
   * Obtiene un reporte por código de caso dentro de su laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param caseCode - Código de caso.
   * @returns El reporte, o `null` si el código está libre.
   */
  findReportByCaseCode(
    em: EntityManager,
    pharmaLabId: string,
    caseCode: string,
  ): Promise<PharmacovigilanceReports | null> {
    return em.findOne(PharmacovigilanceReports, { pharmaLabId, caseCode });
  }

  /**
   * Cuenta los reportes de un laboratorio, para derivar el correlativo del caso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Número de reportes registrados.
   */
  countReports(em: EntityManager, pharmaLabId: string): Promise<number> {
    return em.count(PharmacovigilanceReports, { pharmaLabId });
  }

  /**
   * Lista los reportes de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Reportes del más reciente al más antiguo.
   */
  listReports(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<PharmacovigilanceReports[]> {
    return em.find(
      PharmacovigilanceReports,
      { pharmaLabId },
      { orderBy: { receivedAt: 'desc' }, limit: 500 },
    );
  }

  /**
   * Crea un reporte.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createReport(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmacovigilanceReports {
    return em.create(
      PharmacovigilanceReports,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Sella una acción de seguimiento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la acción.
   * @returns La entidad creada, aún sin `flush`.
   */
  appendAction(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmacovigilanceActions {
    const now = new Date();
    return em.create(
      PharmacovigilanceActions,
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
   * Lista la trazabilidad de un reporte.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmacovigilanceReportId - Reporte.
   * @returns Acciones en orden cronológico.
   */
  listActions(
    em: EntityManager,
    pharmacovigilanceReportId: string,
  ): Promise<PharmacovigilanceActions[]> {
    return em.find(
      PharmacovigilanceActions,
      { pharmacovigilanceReportId },
      { orderBy: { occurredAt: 'asc' } },
    );
  }
}
