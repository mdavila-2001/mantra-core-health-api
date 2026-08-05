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

/**
 * Describe el contrato estructural de create subject data.
 */
export interface CreateSubjectData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Valor de subject ref type mantenido por la instancia.
   */
  subjectRefType: string;
  /**
   * Identificador asociado a subject ref.
   */
  subjectRefId: string;
  /**
   * Valor de tracking number mantenido por la instancia.
   */
  trackingNumber: string;
  /**
   * Identificador asociado a current status concept.
   */
  currentStatusConceptId: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create shipment data.
 */
export interface CreateShipmentData {
  /**
   * Identificador asociado a trackable subject.
   */
  trackableSubjectId: string;
  /**
   * Identificador asociado a carrier.
   */
  carrierId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de shipment number mantenido por la instancia.
   */
  shipmentNumber: string;
  /**
   * Identificador asociado a origin address.
   */
  originAddressId?: string;
  /**
   * Identificador asociado a destination address.
   */
  destinationAddressId?: string;
  /**
   * Identificador asociado a assigned courier user.
   */
  assignedCourierUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de temperature controlled mantenido por la instancia.
   */
  temperatureControlled: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create milestone definition data.
 */
export interface CreateMilestoneDefinitionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a milestone status concept.
   */
  milestoneStatusConceptId: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Valor de is terminal mantenido por la instancia.
   */
  isTerminal: boolean;
  /**
   * Valor de sla minutes mantenido por la instancia.
   */
  slaMinutes?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create tracking event data.
 */
export interface CreateTrackingEventData {
  /**
   * Identificador asociado a trackable subject.
   */
  trackableSubjectId: string;
  /**
   * Identificador asociado a milestone definition.
   */
  milestoneDefinitionId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de location text mantenido por la instancia.
   */
  locationText?: string;
  /**
   * Valor de latitude mantenido por la instancia.
   */
  latitude?: string;
  /**
   * Valor de longitude mantenido por la instancia.
   */
  longitude?: string;
  /**
   * Identificador asociado a location ping.
   */
  locationPingId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a `tracking.*`: sujetos rastreables, envíos, catálogo de hitos,
 * eventos, handoffs, estimaciones y pruebas de entrega. Sin reglas de negocio.
 */
@Injectable()
export class TrackingRepository {
  // --- Sujeto rastreable (UC-37-01, 10) ---

  /**
   * Crea create subject.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create subject conforme al contrato `TrackableSubjects`.
   */
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

  /**
   * Obtiene find subject by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find subject by id conforme al contrato `Promise<TrackableSubjects | null>`.
   */
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

  /**
   * Obtiene find subject by tracking number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param trackingNumber - Valor de tracking number requerido por la operación.
   * @returns Resultado de find subject by tracking number conforme al contrato `Promise<TrackableSubjects | null>`.
   */
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

  /**
   * Crea create shipment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create shipment conforme al contrato `Shipments`.
   */
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

  /**
   * Obtiene find shipment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find shipment by id conforme al contrato `Promise<Shipments | null>`.
   */
  findShipmentById(em: EntityManager, id: string): Promise<Shipments | null> {
    return em.findOne(Shipments, { id });
  }

  /**
   * Obtiene find shipment for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find shipment for update conforme al contrato `Promise<Shipments | null>`.
   */
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

  /**
   * Obtiene find shipment by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param shipmentNumber - Valor de shipment number requerido por la operación.
   * @returns Resultado de find shipment by number conforme al contrato `Promise<Shipments | null>`.
   */
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

  /**
   * Ejecuta la operación count shipments.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @returns Resultado de count shipments conforme al contrato `Promise<number>`.
   */
  countShipments(em: EntityManager): Promise<number> {
    return em.count(Shipments, {});
  }

  // --- Catálogo de hitos (UC-37-02) ---

  /**
   * Crea create milestone definition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create milestone definition conforme al contrato `MilestoneDefinitions`.
   */
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

  /**
   * Obtiene find milestone by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find milestone by id conforme al contrato `Promise<MilestoneDefinitions | null>`.
   */
  findMilestoneById(
    em: EntityManager,
    id: string,
  ): Promise<MilestoneDefinitions | null> {
    return em.findOne(MilestoneDefinitions, { id });
  }

  /**
   * Obtiene find milestone by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectTypeConceptId - Identificador de subject type concept.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find milestone by code conforme al contrato `Promise<MilestoneDefinitions | null>`.
   */
  /**
   * `tenant_id` es nullable en `milestone_definitions`: sin filtro, un código
   * definido por el tenant A "existía" para el tenant B (bloqueaba su alta) y,
   * peor, al cerrar un envío el hito terminal elegido podía ser el de OTRO
   * tenant, dejando `subject.currentMilestoneId` apuntando a una fila ajena.
   */
  findMilestoneByCode(
    em: EntityManager,
    subjectTypeConceptId: string,
    code: string,
    tenantId: string | undefined,
  ): Promise<MilestoneDefinitions | null> {
    return em.findOne(MilestoneDefinitions, {
      subjectTypeConceptId,
      code,
      $or: [{ tenantId: null }, { tenantId: tenantId ?? null }],
    });
  }

  /** Hitos esperados del tipo de sujeto, en orden (catálogo global + override del tenant). */
  findMilestonesBySubjectType(
    em: EntityManager,
    subjectTypeConceptId: string,
    activeStateConceptId: string,
    tenantId: string | undefined,
  ): Promise<MilestoneDefinitions[]> {
    return em.find(
      MilestoneDefinitions,
      {
        subjectTypeConceptId,
        stateConceptId: activeStateConceptId,
        $or: [{ tenantId: null }, { tenantId: tenantId ?? null }],
      },
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

  /**
   * Crea create handoff.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create handoff conforme al contrato `ShipmentHandoffs`.
   */
  createHandoff(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a shipment.
       */
      shipmentId: string;
      /**
       * Identificador asociado a handoff type concept.
       */
      handoffTypeConceptId: string;
      /**
       * Valor de from party type mantenido por la instancia.
       */
      fromPartyType?: string;
      /**
       * Identificador asociado a from party.
       */
      fromPartyId?: string;
      /**
       * Valor de to party type mantenido por la instancia.
       */
      toPartyType?: string;
      /**
       * Identificador asociado a to party.
       */
      toPartyId?: string;
      /**
       * Valor de location text mantenido por la instancia.
       */
      locationText?: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt?: Date;
      /**
       * Identificador asociado a recorded by user.
       */
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
      /**
       * Identificador asociado a trackable subject.
       */
      trackableSubjectId: string;
      /**
       * Identificador asociado a shipment.
       */
      shipmentId?: string;
      /**
       * Valor de estimated arrival at mantenido por la instancia.
       */
      estimatedArrivalAt: Date;
      /**
       * Valor de confidence pct mantenido por la instancia.
       */
      confidencePct?: number;
      /**
       * Identificador asociado a method concept.
       */
      methodConceptId: string;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create delivery proof.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create delivery proof conforme al contrato `DeliveryProofs`.
   */
  createDeliveryProof(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a shipment.
       */
      shipmentId: string;
      /**
       * Identificador asociado a proof type concept.
       */
      proofTypeConceptId: string;
      /**
       * Valor de recipient name mantenido por la instancia.
       */
      recipientName?: string;
      /**
       * Identificador asociado a signature file.
       */
      signatureFileId?: string;
      /**
       * Identificador asociado a photo file.
       */
      photoFileId?: string;
      /**
       * Valor de latitude mantenido por la instancia.
       */
      latitude?: string;
      /**
       * Valor de longitude mantenido por la instancia.
       */
      longitude?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find carrier by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find carrier by id conforme al contrato `Promise<TrackingCarriers | null>`.
   */
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
