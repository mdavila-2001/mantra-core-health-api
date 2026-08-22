import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  VisitRatings,
  VisitRecordMaterials,
  VisitRecords,
  VisitRequestEvents,
  VisitRequestTopics,
  VisitRequests,
} from '../entities';
import { PHL } from '../pharma_lab.concepts';

/** Estados en los que una solicitud todavía ocupa un hueco en la agenda. */
const OCCUPYING_STATUSES = [
  PHL.VISIT_REQUESTED,
  PHL.VISIT_PENDING_CONFIRMATION,
  PHL.VISIT_CONFIRMED,
  PHL.VISIT_IN_PROGRESS,
];

/** Acceso a datos de solicitudes, registros y calificaciones de visita. */
@Injectable()
export class VisitsRepository {
  /**
   * Obtiene una solicitud de visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la solicitud.
   * @returns La solicitud, o `null` si no existe.
   */
  findRequest(em: EntityManager, id: string): Promise<VisitRequests | null> {
    return em.findOne(VisitRequests, { id });
  }

  /**
   * Crea una solicitud de visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createRequest(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitRequests {
    return em.create(
      VisitRequests,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Lista las solicitudes de un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @returns Solicitudes de la más reciente a la más antigua.
   */
  listRequestsByVisitor(
    em: EntityManager,
    medicalVisitorId: string,
  ): Promise<VisitRequests[]> {
    return em.find(
      VisitRequests,
      { medicalVisitorId },
      { orderBy: { requestedStartAt: 'desc' }, limit: 200 },
    );
  }

  /**
   * Lista las solicitudes dirigidas a un doctor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @param statusConceptIds - Estados por los que filtrar, o `undefined` para todos.
   * @returns Solicitudes de la más reciente a la más antigua.
   */
  listRequestsByDoctor(
    em: EntityManager,
    doctorUserId: string,
    statusConceptIds?: readonly string[],
  ): Promise<VisitRequests[]> {
    return em.find(
      VisitRequests,
      {
        doctorUserId,
        ...(statusConceptIds
          ? { statusConceptId: { $in: [...statusConceptIds] } }
          : {}),
      },
      { orderBy: { requestedStartAt: 'desc' }, limit: 200 },
    );
  }

  /**
   * Lista las solicitudes que ocupan la agenda del doctor dentro de un rango.
   *
   * Es la consulta que impide superponer una visita con otra ya aceptada
   * (spec 5412).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @param from - Inicio del rango, inclusive.
   * @param to - Fin del rango, exclusive.
   * @returns Solicitudes vivas que empiezan dentro del rango.
   */
  listOccupyingRequests(
    em: EntityManager,
    doctorUserId: string,
    from: Date,
    to: Date,
  ): Promise<VisitRequests[]> {
    return em.find(VisitRequests, {
      doctorUserId,
      statusConceptId: { $in: OCCUPYING_STATUSES },
      requestedStartAt: { $gte: from, $lt: to },
    });
  }

  /**
   * Lista las solicitudes vivas de un visitador, para cancelarlas al desvincularlo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @returns Solicitudes en estado vivo.
   */
  listOpenRequestsOfVisitor(
    em: EntityManager,
    medicalVisitorId: string,
  ): Promise<VisitRequests[]> {
    return em.find(VisitRequests, {
      medicalVisitorId,
      statusConceptId: { $in: OCCUPYING_STATUSES },
    });
  }

  /**
   * Añade un tema a una solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createTopic(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitRequestTopics {
    return em.create(
      VisitRequestTopics,
      {
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista los temas declarados en una solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRequestId - Solicitud.
   * @returns Temas de la solicitud.
   */
  listTopics(
    em: EntityManager,
    visitRequestId: string,
  ): Promise<VisitRequestTopics[]> {
    return em.find(VisitRequestTopics, { visitRequestId });
  }

  /**
   * Sella una transición en la bitácora de la solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del evento.
   * @returns La entidad creada, aún sin `flush`.
   */
  appendRequestEvent(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitRequestEvents {
    const now = new Date();
    return em.create(
      VisitRequestEvents,
      { occurredAt: now, createdAt: now, ...data },
      { partial: true },
    );
  }

  /**
   * Lista la bitácora de una solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRequestId - Solicitud.
   * @returns Eventos en orden cronológico.
   */
  listRequestEvents(
    em: EntityManager,
    visitRequestId: string,
  ): Promise<VisitRequestEvents[]> {
    return em.find(
      VisitRequestEvents,
      { visitRequestId },
      { orderBy: { occurredAt: 'asc' } },
    );
  }

  /**
   * Obtiene un registro de visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del registro.
   * @returns El registro, o `null` si no existe.
   */
  findRecord(em: EntityManager, id: string): Promise<VisitRecords | null> {
    return em.findOne(VisitRecords, { id });
  }

  /**
   * Obtiene el registro asociado a una solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRequestId - Solicitud.
   * @returns El registro, o `null` si la visita no se registró todavía.
   */
  findRecordByRequest(
    em: EntityManager,
    visitRequestId: string,
  ): Promise<VisitRecords | null> {
    return em.findOne(VisitRecords, { visitRequestId });
  }

  /**
   * Crea el registro de una visita realizada.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createRecord(em: EntityManager, data: Record<string, unknown>): VisitRecords {
    return em.create(
      VisitRecords,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Lista el historial de visitas de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Registros del más reciente al más antiguo.
   */
  listRecordsByLab(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<VisitRecords[]> {
    return em.find(
      VisitRecords,
      { pharmaLabId },
      { orderBy: { occurredAt: 'desc' }, limit: 200 },
    );
  }

  /**
   * Lista el historial de visitas recibidas por un doctor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @returns Registros del más reciente al más antiguo.
   */
  listRecordsByDoctor(
    em: EntityManager,
    doctorUserId: string,
  ): Promise<VisitRecords[]> {
    return em.find(
      VisitRecords,
      { doctorUserId },
      { orderBy: { occurredAt: 'desc' }, limit: 200 },
    );
  }

  /**
   * Registra material presentado en una visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createRecordMaterial(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitRecordMaterials {
    return em.create(
      VisitRecordMaterials,
      {
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
        ...data,
      },
      { partial: true },
    );
  }

  /**
   * Lista el material presentado en una visita.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRecordId - Registro de visita.
   * @returns Materiales presentados.
   */
  listRecordMaterials(
    em: EntityManager,
    visitRecordId: string,
  ): Promise<VisitRecordMaterials[]> {
    return em.find(VisitRecordMaterials, { visitRecordId });
  }

  /**
   * Obtiene la calificación de una visita para una naturaleza concreta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRecordId - Registro de visita.
   * @param kindConceptId - Naturaleza del registro.
   * @returns La calificación, o `null` si el doctor no la emitió.
   */
  findRating(
    em: EntityManager,
    visitRecordId: string,
    kindConceptId: string,
  ): Promise<VisitRatings | null> {
    return em.findOne(VisitRatings, { visitRecordId, kindConceptId });
  }

  /**
   * Crea una calificación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createRating(em: EntityManager, data: Record<string, unknown>): VisitRatings {
    return em.create(
      VisitRatings,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Lista las calificaciones internas de las visitas de un laboratorio, para
   * calcular los agregados que la organización sí puede consultar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visitRecordIds - Registros de visita del laboratorio.
   * @returns Calificaciones internas de esos registros.
   */
  listInternalRatings(
    em: EntityManager,
    visitRecordIds: readonly string[],
  ): Promise<VisitRatings[]> {
    if (visitRecordIds.length === 0) return Promise.resolve([]);
    return em.find(VisitRatings, {
      visitRecordId: { $in: [...visitRecordIds] },
      kindConceptId: PHL.RATING_INTERNAL,
    });
  }
}
