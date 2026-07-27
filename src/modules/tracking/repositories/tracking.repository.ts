import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TrackableSubjects,
  Shipments,
  MilestoneDefinitions,
  TrackingEvents,
  ShipmentHandoffs,
  EtaEstimates,
  DeliveryProofs,
  TrackingCarriers,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateSubjectData {
  tenantId?: string;
  subjectTypeConceptId: string;
  subjectRefType: string;
  subjectRefId: string;
  trackingNumber: string;
  currentStatusConceptId: string;
  priorityConceptId: string;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateShipmentData {
  trackableSubjectId: string;
  carrierId?: string;
  tenantId?: string;
  shipmentNumber: string;
  originAddressId?: string;
  destinationAddressId?: string;
  assignedCourierUserId?: string;
  statusConceptId: string;
  temperatureControlled: boolean;
  actorUserId?: string;
}

export interface CreateMilestoneDefinitionData {
  tenantId?: string;
  subjectTypeConceptId: string;
  code: string;
  name: string;
  milestoneStatusConceptId: string;
  ordinal: number;
  isTerminal: boolean;
  slaMinutes?: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateTrackingEventData {
  trackableSubjectId: string;
  milestoneDefinitionId?: string;
  statusConceptId: string;
  description?: string;
  locationText?: string;
  latitude?: string;
  longitude?: string;
  locationPingId?: string;
  actorUserId?: string;
  sourceConceptId: string;
  occurredAt?: Date;
  recordedByUserId?: string;
}

/**
 * Acceso a `tracking.*`: sujetos rastreables, envíos, catálogo de hitos,
 * eventos, handoffs, estimaciones y pruebas de entrega. Sin reglas de negocio.
 */
@Injectable()
export class TrackingRepository {
  // --- Sujeto rastreable (UC-37-01, 10) ---

  createSubject(em: EntityManager, data: CreateSubjectData): TrackableSubjects {
    return em.create(
      TrackableSubjects,
      {
        tenantId: data.tenantId,
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectRefType: data.subjectRefType,
        subjectRefId: data.subjectRefId,
        trackingNumber: data.trackingNumber,
        currentStatusConceptId: data.currentStatusConceptId,
        priorityConceptId: data.priorityConceptId,
        openedAt: new Date(),
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findSubjectById(
    em: EntityManager,
    id: string,
  ): Promise<TrackableSubjects | null> {
    return em.findOne(TrackableSubjects, { id });
  }

  /** Toda escritura del timeline mueve el sujeto: se toma bloqueado. */
  findSubjectForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<TrackableSubjects | null> {
    return em.findOne(
      TrackableSubjects,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findSubjectByTrackingNumber(
    em: EntityManager,
    trackingNumber: string,
  ): Promise<TrackableSubjects | null> {
    return em.findOne(TrackableSubjects, { trackingNumber });
  }

  /** Sujeto ya abierto para la misma referencia: abrir dos veces lo duplicaría. */
  findOpenSubjectByRef(
    em: EntityManager,
    subjectRefType: string,
    subjectRefId: string,
    openStateConceptId: string,
  ): Promise<TrackableSubjects | null> {
    return em.findOne(TrackableSubjects, {
      subjectRefType,
      subjectRefId,
      stateConceptId: openStateConceptId,
    });
  }

  // --- Envío (UC-37-01, 03, 06, 07, 08, 09, 10) ---

  createShipment(em: EntityManager, data: CreateShipmentData): Shipments {
    return em.create(
      Shipments,
      {
        trackableSubjectId: data.trackableSubjectId,
        carrierId: data.carrierId,
        tenantId: data.tenantId,
        shipmentNumber: data.shipmentNumber,
        originAddressId: data.originAddressId,
        destinationAddressId: data.destinationAddressId,
        assignedCourierUserId: data.assignedCourierUserId,
        statusConceptId: data.statusConceptId,
        temperatureControlled: data.temperatureControlled,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findShipmentById(em: EntityManager, id: string): Promise<Shipments | null> {
    return em.findOne(Shipments, { id });
  }

  findShipmentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Shipments | null> {
    return em.findOne(
      Shipments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findShipmentByNumber(
    em: EntityManager,
    shipmentNumber: string,
  ): Promise<Shipments | null> {
    return em.findOne(Shipments, { shipmentNumber });
  }

  /** Envío del sujeto: el webhook llega por número de seguimiento, no por envío. */
  findShipmentBySubjectForUpdate(
    em: EntityManager,
    trackableSubjectId: string,
  ): Promise<Shipments | null> {
    return em.findOne(
      Shipments,
      { trackableSubjectId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  countShipments(em: EntityManager): Promise<number> {
    return em.count(Shipments, {});
  }

  // --- Catálogo de hitos (UC-37-02) ---

  createMilestoneDefinition(
    em: EntityManager,
    data: CreateMilestoneDefinitionData,
  ): MilestoneDefinitions {
    return em.create(
      MilestoneDefinitions,
      {
        tenantId: data.tenantId,
        subjectTypeConceptId: data.subjectTypeConceptId,
        code: data.code,
        name: data.name,
        milestoneStatusConceptId: data.milestoneStatusConceptId,
        ordinal: data.ordinal,
        isTerminal: data.isTerminal,
        slaMinutes: data.slaMinutes,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findMilestoneById(
    em: EntityManager,
    id: string,
  ): Promise<MilestoneDefinitions | null> {
    return em.findOne(MilestoneDefinitions, { id });
  }

  findMilestoneByCode(
    em: EntityManager,
    subjectTypeConceptId: string,
    code: string,
  ): Promise<MilestoneDefinitions | null> {
    return em.findOne(MilestoneDefinitions, { subjectTypeConceptId, code });
  }

  /** Hitos esperados del tipo de sujeto, en orden. */
  findMilestonesBySubjectType(
    em: EntityManager,
    subjectTypeConceptId: string,
    activeStateConceptId: string,
  ): Promise<MilestoneDefinitions[]> {
    return em.find(
      MilestoneDefinitions,
      { subjectTypeConceptId, stateConceptId: activeStateConceptId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  // --- Eventos (UC-37-04, y todos los demás por inclusión) ---

  /** Log append-only: el timeline se escribe, nunca se corrige. */
  createEvent(
    em: EntityManager,
    data: CreateTrackingEventData,
  ): TrackingEvents {
    return em.create(
      TrackingEvents,
      {
        trackableSubjectId: data.trackableSubjectId,
        milestoneDefinitionId: data.milestoneDefinitionId,
        statusConceptId: data.statusConceptId,
        description: data.description,
        locationText: data.locationText,
        latitude: data.latitude,
        longitude: data.longitude,
        locationPingId: data.locationPingId,
        actorUserId: data.actorUserId,
        sourceConceptId: data.sourceConceptId,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Eventos del sujeto, del más reciente al más antiguo. */
  findEventsBySubject(
    em: EntityManager,
    trackableSubjectId: string,
  ): Promise<TrackingEvents[]> {
    return em.find(
      TrackingEvents,
      { trackableSubjectId },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }

  /**
   * Evento ya registrado con la misma descripción externa. Es la deduplicación
   * del webhook: el transportista reentrega y no debe duplicar el timeline.
   */
  findEventByExternalReference(
    em: EntityManager,
    trackableSubjectId: string,
    description: string,
  ): Promise<TrackingEvents | null> {
    return em.findOne(TrackingEvents, { trackableSubjectId, description });
  }

  // --- Handoff (UC-37-06) ---

  createHandoff(
    em: EntityManager,
    data: {
      shipmentId: string;
      handoffTypeConceptId: string;
      fromPartyType?: string;
      fromPartyId?: string;
      toPartyType?: string;
      toPartyId?: string;
      locationText?: string;
      occurredAt?: Date;
      recordedByUserId?: string;
    },
  ): ShipmentHandoffs {
    return em.create(
      ShipmentHandoffs,
      {
        shipmentId: data.shipmentId,
        handoffTypeConceptId: data.handoffTypeConceptId,
        fromPartyType: data.fromPartyType,
        fromPartyId: data.fromPartyId,
        toPartyType: data.toPartyType,
        toPartyId: data.toPartyId,
        locationText: data.locationText,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  // --- ETA (UC-37-07) ---

  /** Estimación append-only: el histórico de ETA es lo que permite auditarlas. */
  createEtaEstimate(
    em: EntityManager,
    data: {
      trackableSubjectId: string;
      shipmentId?: string;
      estimatedArrivalAt: Date;
      confidencePct?: number;
      methodConceptId: string;
      recordedByUserId?: string;
    },
  ): EtaEstimates {
    return em.create(
      EtaEstimates,
      {
        trackableSubjectId: data.trackableSubjectId,
        shipmentId: data.shipmentId,
        estimatedArrivalAt: data.estimatedArrivalAt,
        confidencePct: data.confidencePct,
        methodConceptId: data.methodConceptId,
        computedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Última estimación del envío: sólo la más reciente actualiza el envío. */
  findLatestEstimate(
    em: EntityManager,
    shipmentId: string,
  ): Promise<EtaEstimates | null> {
    return em.findOne(
      EtaEstimates,
      { shipmentId },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }

  // --- Prueba de entrega (UC-37-08, 09) ---

  createDeliveryProof(
    em: EntityManager,
    data: {
      shipmentId: string;
      proofTypeConceptId: string;
      recipientName?: string;
      signatureFileId?: string;
      photoFileId?: string;
      latitude?: string;
      longitude?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): DeliveryProofs {
    return em.create(
      DeliveryProofs,
      {
        shipmentId: data.shipmentId,
        proofTypeConceptId: data.proofTypeConceptId,
        recipientName: data.recipientName,
        signatureFileId: data.signatureFileId,
        photoFileId: data.photoFileId,
        latitude: data.latitude,
        longitude: data.longitude,
        capturedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Prueba verificada del envío: entregar dos veces no tiene sentido. */
  findVerifiedProof(
    em: EntityManager,
    shipmentId: string,
    verifiedStatusConceptId: string,
  ): Promise<DeliveryProofs | null> {
    return em.findOne(DeliveryProofs, {
      shipmentId,
      statusConceptId: verifiedStatusConceptId,
    });
  }

  // --- Transportistas (UC-37-05, 06) ---

  findCarrierById(
    em: EntityManager,
    id: string,
  ): Promise<TrackingCarriers | null> {
    return em.findOne(TrackingCarriers, { id });
  }

  /** El webhook llega identificado por el código del transportista, no por id. */
  findCarrierByCode(
    em: EntityManager,
    code: string,
  ): Promise<TrackingCarriers | null> {
    return em.findOne(TrackingCarriers, { code });
  }

  // --- Barrido de SLA (UC-37-11) ---

  /**
   * Sujetos abiertos, tomados con `FOR UPDATE SKIP LOCKED`: el barrido corre por
   * lotes y no debe esperar a otra pasada.
   */
  findOpenSubjectsForScan(
    em: EntityManager,
    openStateConceptId: string,
    limit: number,
  ): Promise<TrackableSubjects[]> {
    return em.find(
      TrackableSubjects,
      { stateConceptId: openStateConceptId, closedAt: null },
      {
        limit,
        orderBy: { openedAt: 'ASC' },
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      },
    );
  }
}
