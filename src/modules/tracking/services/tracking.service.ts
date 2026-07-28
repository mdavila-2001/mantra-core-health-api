import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { TrackingRepository } from '../repositories';
import { TrackableSubjects } from '../entities';
import {
  OpenSubjectDto,
  SubjectResponseDto,
  DefineMilestonesDto,
  MilestonesResponseDto,
  DispatchShipmentDto,
  DispatchResponseDto,
  RecordEventDto,
  EventResponseDto,
  CarrierWebhookDto,
  WebhookResponseDto,
  RecordHandoffDto,
  HandoffResponseDto,
  RecomputeEtaDto,
  EtaResponseDto,
  RecordDeliveryProofDto,
  DeliveryProofResponseDto,
  RecordExceptionDto,
  ExceptionResponseDto,
  CancelShipmentDto,
  CancelShipmentResponseDto,
  ScanSlaDto,
  ScanSlaResponseDto,
  type SubjectType,
  type MilestoneStatus,
  type EventSource,
  type HandoffType,
  type EtaMethod,
  type ProofType,
} from '../dto';

const SUBJECT_TYPE_CONCEPT: Readonly<Record<SubjectType, string>> = {
  SPECIMEN: CONCEPTS.SUBJECT_TYPE_SPECIMEN,
  ORDER: CONCEPTS.SUBJECT_TYPE_ORDER,
  DEVICE: CONCEPTS.SUBJECT_TYPE_DEVICE,
};

const STATUS_CONCEPT: Readonly<Record<MilestoneStatus, string>> = {
  CREATED: CONCEPTS.TRACK_CREATED,
  PREPARING: CONCEPTS.TRACK_PREPARING,
  IN_TRANSIT: CONCEPTS.TRACK_IN_TRANSIT,
  HANDOFF: CONCEPTS.TRACK_HANDOFF,
  DELIVERED: CONCEPTS.TRACK_DELIVERED,
  CANCELLED: CONCEPTS.TRACK_CANCELLED,
};

const SOURCE_CONCEPT: Readonly<Record<EventSource, string>> = {
  OPERATOR: CONCEPTS.TRACK_SOURCE_OPERATOR,
  CARRIER_WEBHOOK: CONCEPTS.TRACK_SOURCE_CARRIER_WEBHOOK,
  COURIER_APP: CONCEPTS.TRACK_SOURCE_COURIER_APP,
  SYSTEM: CONCEPTS.TRACK_SOURCE_SYSTEM,
};

const HANDOFF_TYPE_CONCEPT: Readonly<Record<HandoffType, string>> = {
  PICKUP: CONCEPTS.HANDOFF_PICKUP,
  TRANSFER: CONCEPTS.HANDOFF_TRANSFER,
  DROPOFF: CONCEPTS.HANDOFF_DROPOFF,
};

const ETA_METHOD_CONCEPT: Readonly<Record<EtaMethod, string>> = {
  CARRIER: CONCEPTS.ETA_METHOD_CARRIER,
  DISTANCE: CONCEPTS.ETA_METHOD_DISTANCE,
  MANUAL: CONCEPTS.ETA_METHOD_MANUAL,
};

const PROOF_TYPE_CONCEPT: Readonly<Record<ProofType, string>> = {
  SIGNATURE: CONCEPTS.PROOF_SIGNATURE,
  PHOTO: CONCEPTS.PROOF_PHOTO,
};

/**
 * Mapeo del código externo del transportista al estado del modelo. Lo que no
 * reconoce se registra como excepción: inventar un estado sería peor que
 * declarar que no se entendió.
 */
const EXTERNAL_STATUS_MAP: Readonly<Record<string, string>> = {
  PICKED_UP: CONCEPTS.TRACK_IN_TRANSIT,
  IN_TRANSIT: CONCEPTS.TRACK_IN_TRANSIT,
  OUT_FOR_DELIVERY: CONCEPTS.TRACK_IN_TRANSIT,
  DELIVERED: CONCEPTS.TRACK_DELIVERED,
  EXCEPTION: CONCEPTS.TRACK_EXCEPTION,
  RETURNED: CONCEPTS.TRACK_EXCEPTION,
  CANCELLED: CONCEPTS.TRACK_CANCELLED,
};

/** Estados desde los que el envío todavía puede moverse. */
const LIVE_SHIPMENT_STATES: readonly string[] = [
  CONCEPTS.TRACK_PREPARING,
  CONCEPTS.TRACK_IN_TRANSIT,
  CONCEPTS.TRACK_HANDOFF,
  CONCEPTS.TRACK_EXCEPTION,
  CONCEPTS.TRACK_RETRY_SCHEDULED,
];

const DEFAULT_SCAN_BATCH = 100;
const TRACKING_NUMBER_BYTES = 8;

/**
 * Seguimiento de sujetos y envíos: apertura, hitos, despacho, eventos,
 * webhooks, traspasos, ETA, entrega, excepciones, cancelación y SLA
 * (UC-37-01 … 11).
 */
@Injectable()
export class TrackingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param trackingRepo - Valor de tracking repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly trackingRepo: TrackingRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TrackingService.name);
  }

  /**
   * UC-37-01: abrir el sujeto rastreable y su envío. El número de seguimiento
   * es opaco: no debe dejar deducir qué se transporta ni de quién es.
   */
  async openSubject(
    dto: OpenSubjectDto,
    actor: AuthenticatedUser,
  ): Promise<SubjectResponseDto> {
    this.logger.info(
      {
        operation: 'tracking.subject.open',
        subjectRefType: dto.subjectRefType,
      },
      'Opening trackable subject',
    );

    return this.em.transactional(async (tx) => {
      const open = await this.trackingRepo.findOpenSubjectByRef(
        tx,
        dto.subjectRefType,
        dto.subjectRefId,
        CONCEPTS.SUBJECT_OPEN,
      );
      if (open) {
        throw new ConflictException(
          'La entidad ya tiene un seguimiento abierto',
          {
            subjectRefId: dto.subjectRefId,
            trackableSubjectId: open.id,
          },
        );
      }

      if (dto.carrierId) {
        const carrier = await this.trackingRepo.findCarrierById(
          tx,
          dto.carrierId,
        );
        if (!carrier) {
          throw new ResourceNotFoundException('Transportista no encontrado', {
            carrierId: dto.carrierId,
          });
        }
        if (carrier.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
          throw new PreconditionFailedException(
            'El transportista no está activo',
            {
              carrierId: dto.carrierId,
            },
          );
        }
      }

      const trackingNumber = await this.generateTrackingNumber(tx);
      const subject = this.trackingRepo.createSubject(tx, {
        tenantId: dto.tenantId,
        subjectTypeConceptId: SUBJECT_TYPE_CONCEPT[dto.subjectType],
        subjectRefType: dto.subjectRefType,
        subjectRefId: dto.subjectRefId,
        trackingNumber,
        currentStatusConceptId: CONCEPTS.TRACK_CREATED,
        priorityConceptId: CONCEPTS.TRACK_PRIORITY_NORMAL,
        stateConceptId: CONCEPTS.SUBJECT_OPEN,
        actorUserId: actor.id,
      });

      const shipmentNumber = await this.nextShipmentNumber(tx);
      const shipment = this.trackingRepo.createShipment(tx, {
        trackableSubjectId: subject.id,
        carrierId: dto.carrierId,
        tenantId: dto.tenantId,
        shipmentNumber,
        originAddressId: dto.originAddressId,
        destinationAddressId: dto.destinationAddressId,
        assignedCourierUserId: dto.assignedCourierUserId,
        statusConceptId: CONCEPTS.TRACK_PREPARING,
        temperatureControlled: dto.temperatureControlled ?? false,
        actorUserId: actor.id,
      });

      return {
        id: subject.id,
        trackingNumber,
        stateConceptId: CONCEPTS.SUBJECT_OPEN,
        currentStatusConceptId: CONCEPTS.TRACK_CREATED,
        shipmentId: shipment.id,
        shipmentNumber,
      };
    });
  }

  /**
   * UC-37-02: definir los hitos esperados del tipo de sujeto. Sólo puede haber
   * un hito terminal: con dos, no se sabría cuál cierra el seguimiento.
   */
  async defineMilestones(
    dto: DefineMilestonesDto,
    actor: AuthenticatedUser,
  ): Promise<MilestonesResponseDto> {
    this.logger.info(
      { operation: 'tracking.milestones.define', subjectType: dto.subjectType },
      'Defining milestone catalog',
    );

    const subjectTypeConceptId = SUBJECT_TYPE_CONCEPT[dto.subjectType];
    const incomingTerminals = dto.milestones.filter((m) => m.isTerminal).length;
    if (incomingTerminals > 1) {
      throw new PreconditionFailedException(
        'Sólo puede haber un hito terminal',
        {
          subjectType: dto.subjectType,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const existing = await this.trackingRepo.findMilestonesBySubjectType(
        tx,
        subjectTypeConceptId,
        CONCEPTS.STATE_ACTIVE,
      );
      const existingCodes = new Set(existing.map((m) => m.code));
      const existingTerminals = existing.filter((m) => m.isTerminal).length;
      if (existingTerminals + incomingTerminals > 1) {
        throw new ConflictException(
          'El tipo de sujeto ya tiene hito terminal',
          {
            subjectType: dto.subjectType,
          },
        );
      }

      const milestoneIds: string[] = [];
      let skipped = 0;
      let ordinal = existing.length;

      for (const milestone of dto.milestones) {
        if (existingCodes.has(milestone.code)) {
          skipped += 1;
          continue;
        }
        ordinal += 1;
        const created = this.trackingRepo.createMilestoneDefinition(tx, {
          tenantId: dto.tenantId,
          subjectTypeConceptId,
          code: milestone.code,
          name: milestone.name,
          milestoneStatusConceptId: STATUS_CONCEPT[milestone.milestoneStatus],
          ordinal,
          isTerminal: milestone.isTerminal ?? false,
          slaMinutes: milestone.slaMinutes,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        existingCodes.add(milestone.code);
        milestoneIds.push(created.id);
      }

      return {
        subjectTypeConceptId,
        milestoneIds,
        skipped,
        terminalCount: existingTerminals + incomingTerminals,
      };
    });
  }

  /** UC-37-03: despachar el envío y dejar el evento correspondiente. */
  async dispatchShipment(
    shipmentId: string,
    dto: DispatchShipmentDto,
    actor: AuthenticatedUser,
  ): Promise<DispatchResponseDto> {
    this.logger.info(
      { operation: 'tracking.shipment.dispatch', shipmentId },
      'Dispatching shipment',
    );

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (shipment.statusConceptId !== CONCEPTS.TRACK_PREPARING) {
        throw new PreconditionFailedException(
          'El envío no está en preparación',
          {
            shipmentId,
            statusConceptId: shipment.statusConceptId,
          },
        );
      }
      // Despachar sin transportista deja el envío sin responsable en cuanto
      // sale por la puerta.
      if (
        !shipment.carrierId &&
        !dto.assignedCourierUserId &&
        !shipment.assignedCourierUserId
      ) {
        throw new PreconditionFailedException(
          'El despacho necesita transportista o mensajero asignado',
          { shipmentId },
        );
      }

      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        shipment.trackableSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          trackableSubjectId: shipment.trackableSubjectId,
        });
      }

      const dispatchedAt = new Date();
      shipment.statusConceptId = CONCEPTS.TRACK_IN_TRANSIT;
      shipment.dispatchedAt = dispatchedAt;
      if (dto.assignedCourierUserId)
        shipment.assignedCourierUserId = dto.assignedCourierUserId;
      touch(shipment, actor.id);

      subject.currentStatusConceptId = CONCEPTS.TRACK_IN_TRANSIT;
      touch(subject, actor.id);

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: subject.id,
        statusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        description: 'Envío despachado',
        locationText: dto.locationText,
        actorUserId: actor.id,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_OPERATOR,
        occurredAt: dispatchedAt,
        recordedByUserId: actor.id,
      });

      return {
        id: shipmentId,
        statusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        eventId: event.id,
        dispatchedAt: dispatchedAt.toISOString(),
      };
    });
  }

  /**
   * UC-37-04: registrar un evento y avanzar el hito. Alcanzar el hito terminal
   * cierra el sujeto: es el único punto donde el timeline termina por sí solo.
   */
  async recordEvent(
    subjectId: string,
    dto: RecordEventDto,
    actor: AuthenticatedUser,
  ): Promise<EventResponseDto> {
    this.logger.info(
      { operation: 'tracking.event.record', subjectId, status: dto.status },
      'Recording tracking event',
    );

    return this.em.transactional(async (tx) => {
      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        subjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          subjectId,
        });
      }
      if (subject.stateConceptId === CONCEPTS.SUBJECT_CLOSED) {
        throw new PreconditionFailedException(
          'El seguimiento del sujeto está cerrado',
          {
            subjectId,
          },
        );
      }

      const milestone = dto.milestoneCode
        ? await this.trackingRepo.findMilestoneByCode(
            tx,
            subject.subjectTypeConceptId,
            dto.milestoneCode,
          )
        : null;
      if (dto.milestoneCode && !milestone) {
        throw new ResourceNotFoundException(
          'Hito no encontrado para el tipo de sujeto',
          {
            milestoneCode: dto.milestoneCode,
          },
        );
      }

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: subjectId,
        milestoneDefinitionId: milestone?.id,
        statusConceptId: STATUS_CONCEPT[dto.status],
        description: dto.description,
        locationText: dto.locationText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationPingId: dto.locationPingId,
        actorUserId: actor.id,
        sourceConceptId: SOURCE_CONCEPT[dto.source ?? 'OPERATOR'],
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId: actor.id,
      });

      subject.currentStatusConceptId = STATUS_CONCEPT[dto.status];
      if (milestone) subject.currentMilestoneId = milestone.id;

      let subjectClosed = false;
      if (milestone?.isTerminal) {
        subject.closedAt = new Date();
        subject.stateConceptId = CONCEPTS.SUBJECT_CLOSED;
        subjectClosed = true;
      }
      touch(subject, actor.id);

      return {
        id: event.id,
        trackableSubjectId: subjectId,
        currentStatusConceptId:
          subject.currentStatusConceptId ?? STATUS_CONCEPT[dto.status],
        currentMilestoneId: subject.currentMilestoneId,
        subjectClosed,
      };
    });
  }

  /**
   * UC-37-05: ingerir el webhook del transportista. Es idempotente por el
   * identificador del evento externo: los transportistas reentregan, y el
   * timeline no debe duplicarse por eso.
   */
  async ingestCarrierWebhook(
    carrierCode: string,
    dto: CarrierWebhookDto,
  ): Promise<WebhookResponseDto> {
    this.logger.info(
      {
        operation: 'tracking.webhook.ingest',
        carrierCode,
        externalStatusCode: dto.externalStatusCode,
      },
      'Ingesting carrier webhook',
    );

    return this.em.transactional(async (tx) => {
      const carrier = await this.trackingRepo.findCarrierByCode(
        tx,
        carrierCode,
      );
      if (!carrier) {
        throw new ResourceNotFoundException('Transportista no encontrado', {
          carrierCode,
        });
      }

      const subject = await this.trackingRepo.findSubjectByTrackingNumber(
        tx,
        dto.trackingNumber,
      );
      if (!subject) {
        throw new ResourceNotFoundException(
          'Número de seguimiento desconocido',
          {
            trackingNumber: dto.trackingNumber,
          },
        );
      }

      const reference = this.externalReference(
        carrierCode,
        dto.externalEventId,
      );
      const previous = await this.trackingRepo.findEventByExternalReference(
        tx,
        subject.id,
        reference,
      );
      if (previous) {
        return {
          eventId: previous.id,
          trackableSubjectId: subject.id,
          currentStatusConceptId:
            subject.currentStatusConceptId ?? CONCEPTS.TRACK_CREATED,
          duplicate: true,
        };
      }

      const locked = await this.trackingRepo.findSubjectForUpdate(
        tx,
        subject.id,
      );
      if (!locked) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          subjectId: subject.id,
        });
      }

      const mapped = EXTERNAL_STATUS_MAP[dto.externalStatusCode.toUpperCase()];
      if (!mapped) {
        this.logger.warn(
          {
            operation: 'tracking.webhook.ingest',
            carrierCode,
            code: dto.externalStatusCode,
          },
          'Unmapped carrier status code recorded as exception',
        );
      }
      const statusConceptId = mapped ?? CONCEPTS.TRACK_EXCEPTION;

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: locked.id,
        statusConceptId,
        description: reference,
        locationText: dto.locationText,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_CARRIER_WEBHOOK,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      });

      locked.currentStatusConceptId = statusConceptId;
      touch(locked, undefined);

      // El envío sigue al sujeto sólo mientras siga vivo: un envío entregado o
      // cancelado no vuelve atrás por un webhook tardío.
      const shipment = await this.trackingRepo.findShipmentBySubjectForUpdate(
        tx,
        locked.id,
      );
      if (shipment && LIVE_SHIPMENT_STATES.includes(shipment.statusConceptId)) {
        shipment.statusConceptId = statusConceptId;
        if (statusConceptId === CONCEPTS.TRACK_DELIVERED)
          shipment.deliveredAt = new Date();
        touch(shipment, undefined);
      }

      return {
        eventId: event.id,
        trackableSubjectId: locked.id,
        currentStatusConceptId: statusConceptId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-37-06: registrar el traspaso entre responsables. Actualizar quién
   * responde en la misma transacción es lo que evita un envío sin dueño.
   */
  async recordHandoff(
    shipmentId: string,
    dto: RecordHandoffDto,
    actor: AuthenticatedUser,
  ): Promise<HandoffResponseDto> {
    this.logger.info(
      {
        operation: 'tracking.handoff.record',
        shipmentId,
        handoffType: dto.handoffType,
      },
      'Recording shipment handoff',
    );

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (!LIVE_SHIPMENT_STATES.includes(shipment.statusConceptId)) {
        throw new PreconditionFailedException(
          'El envío ya no admite traspasos',
          {
            shipmentId,
            statusConceptId: shipment.statusConceptId,
          },
        );
      }

      if (dto.newCarrierId) {
        const carrier = await this.trackingRepo.findCarrierById(
          tx,
          dto.newCarrierId,
        );
        if (!carrier) {
          throw new ResourceNotFoundException('Transportista no encontrado', {
            carrierId: dto.newCarrierId,
          });
        }
        if (carrier.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
          throw new PreconditionFailedException(
            'El transportista no está activo',
            {
              carrierId: dto.newCarrierId,
            },
          );
        }
      }

      const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
      const handoff = this.trackingRepo.createHandoff(tx, {
        shipmentId,
        handoffTypeConceptId: HANDOFF_TYPE_CONCEPT[dto.handoffType],
        fromPartyType: dto.fromPartyType,
        fromPartyId: dto.fromPartyId,
        toPartyType: dto.toPartyType,
        toPartyId: dto.toPartyId,
        locationText: dto.locationText,
        occurredAt,
        recordedByUserId: actor.id,
      });

      if (dto.newCarrierId) shipment.carrierId = dto.newCarrierId;
      if (dto.newCourierUserId)
        shipment.assignedCourierUserId = dto.newCourierUserId;
      touch(shipment, actor.id);

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: shipment.trackableSubjectId,
        statusConceptId: CONCEPTS.TRACK_HANDOFF,
        description: 'Traspaso de responsabilidad',
        locationText: dto.locationText,
        actorUserId: actor.id,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_OPERATOR,
        occurredAt,
        recordedByUserId: actor.id,
      });

      return {
        id: handoff.id,
        shipmentId,
        eventId: event.id,
        carrierId: shipment.carrierId,
      };
    });
  }

  /**
   * UC-37-07: registrar una estimación. El histórico es append-only y sólo la
   * más reciente pasa al envío: una estimación vieja llegando tarde no debe
   * pisar a la que ya la sustituyó.
   */
  async recomputeEta(
    shipmentId: string,
    dto: RecomputeEtaDto,
    actor: AuthenticatedUser,
  ): Promise<EtaResponseDto> {
    this.logger.info(
      { operation: 'tracking.eta.recompute', shipmentId, method: dto.method },
      'Recomputing ETA',
    );

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (!LIVE_SHIPMENT_STATES.includes(shipment.statusConceptId)) {
        throw new PreconditionFailedException(
          'El envío ya no admite estimaciones',
          {
            shipmentId,
            statusConceptId: shipment.statusConceptId,
          },
        );
      }

      const previous = await this.trackingRepo.findLatestEstimate(
        tx,
        shipmentId,
      );
      const estimate = this.trackingRepo.createEtaEstimate(tx, {
        trackableSubjectId: shipment.trackableSubjectId,
        shipmentId,
        estimatedArrivalAt: new Date(dto.estimatedArrivalAt),
        confidencePct: dto.confidencePct,
        methodConceptId: ETA_METHOD_CONCEPT[dto.method],
        recordedByUserId: actor.id,
      });

      // La recién creada es por definición la más reciente; se comprueba contra
      // la anterior para dejar explícito por qué se aplica.
      const applied = !previous || estimate.recordedAt >= previous.recordedAt;
      if (applied) {
        shipment.estimatedArrivalAt = new Date(dto.estimatedArrivalAt);
        if (dto.distanceM) shipment.distanceM = dto.distanceM;
        touch(shipment, actor.id);
      }

      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        shipment.trackableSubjectId,
      );
      if (subject) touch(subject, actor.id);

      return {
        id: estimate.id,
        shipmentId,
        estimatedArrivalAt: dto.estimatedArrivalAt,
        applied,
      };
    });
  }

  /**
   * UC-37-08: registrar la prueba de entrega y cerrar. Una firma sin archivo de
   * firma —o una foto sin foto— no acredita nada.
   */
  async recordDeliveryProof(
    shipmentId: string,
    dto: RecordDeliveryProofDto,
    actor: AuthenticatedUser,
  ): Promise<DeliveryProofResponseDto> {
    this.logger.info(
      {
        operation: 'tracking.delivery.proof',
        shipmentId,
        proofType: dto.proofType,
      },
      'Recording delivery proof',
    );

    if (dto.proofType === 'SIGNATURE' && !dto.signatureFileId) {
      throw new PreconditionFailedException(
        'Una prueba por firma necesita el archivo de firma',
        {
          shipmentId,
        },
      );
    }
    if (dto.proofType === 'PHOTO' && !dto.photoFileId) {
      throw new PreconditionFailedException(
        'Una prueba por foto necesita la foto',
        { shipmentId },
      );
    }

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (shipment.statusConceptId === CONCEPTS.TRACK_DELIVERED) {
        throw new ConflictException('El envío ya está entregado', {
          shipmentId,
        });
      }
      if (!LIVE_SHIPMENT_STATES.includes(shipment.statusConceptId)) {
        throw new PreconditionFailedException(
          'El envío no admite entrega en su estado actual',
          {
            shipmentId,
            statusConceptId: shipment.statusConceptId,
          },
        );
      }

      const existing = await this.trackingRepo.findVerifiedProof(
        tx,
        shipmentId,
        CONCEPTS.PROOF_VERIFIED,
      );
      if (existing) {
        throw new ConflictException(
          'El envío ya tiene prueba de entrega verificada',
          {
            shipmentId,
            proofId: existing.id,
          },
        );
      }

      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        shipment.trackableSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          trackableSubjectId: shipment.trackableSubjectId,
        });
      }

      const proof = this.trackingRepo.createDeliveryProof(tx, {
        shipmentId,
        proofTypeConceptId: PROOF_TYPE_CONCEPT[dto.proofType],
        recipientName: dto.recipientName,
        signatureFileId: dto.signatureFileId,
        photoFileId: dto.photoFileId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        statusConceptId: CONCEPTS.PROOF_VERIFIED,
        actorUserId: actor.id,
      });

      const deliveredAt = new Date();
      shipment.statusConceptId = CONCEPTS.TRACK_DELIVERED;
      shipment.deliveredAt = deliveredAt;
      touch(shipment, actor.id);

      // La entrega es terminal: cierra el sujeto sin esperar a un hito.
      const terminal = (
        await this.trackingRepo.findMilestonesBySubjectType(
          tx,
          subject.subjectTypeConceptId,
          CONCEPTS.STATE_ACTIVE,
        )
      ).find((m) => m.isTerminal);

      subject.currentStatusConceptId = CONCEPTS.TRACK_DELIVERED;
      if (terminal) subject.currentMilestoneId = terminal.id;
      subject.closedAt = deliveredAt;
      subject.stateConceptId = CONCEPTS.SUBJECT_CLOSED;
      touch(subject, actor.id);

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: subject.id,
        milestoneDefinitionId: terminal?.id,
        statusConceptId: CONCEPTS.TRACK_DELIVERED,
        description: 'Entrega acreditada',
        locationText: dto.locationText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        actorUserId: actor.id,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_COURIER_APP,
        occurredAt: deliveredAt,
        recordedByUserId: actor.id,
      });

      return {
        id: proof.id,
        shipmentId,
        shipmentStatusConceptId: CONCEPTS.TRACK_DELIVERED,
        subjectStateConceptId: CONCEPTS.SUBJECT_CLOSED,
        eventId: event.id,
      };
    });
  }

  /**
   * UC-37-09: registrar la excepción. La prioridad del sujeto sube: una entrega
   * que falló necesita atención antes que una que va bien.
   */
  async recordException(
    shipmentId: string,
    dto: RecordExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    this.logger.warn(
      { operation: 'tracking.shipment.exception', shipmentId },
      'Recording shipment exception',
    );

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (!LIVE_SHIPMENT_STATES.includes(shipment.statusConceptId)) {
        throw new PreconditionFailedException(
          'El envío ya no admite excepciones',
          {
            shipmentId,
            statusConceptId: shipment.statusConceptId,
          },
        );
      }

      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        shipment.trackableSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          trackableSubjectId: shipment.trackableSubjectId,
        });
      }

      const statusConceptId = dto.scheduleRetry
        ? CONCEPTS.TRACK_RETRY_SCHEDULED
        : CONCEPTS.TRACK_EXCEPTION;
      shipment.statusConceptId = statusConceptId;
      touch(shipment, actor.id);

      const priorityConceptId = this.escalate(subject.priorityConceptId);
      subject.currentStatusConceptId = CONCEPTS.TRACK_EXCEPTION;
      subject.priorityConceptId = priorityConceptId;
      touch(subject, actor.id);

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: subject.id,
        statusConceptId: CONCEPTS.TRACK_EXCEPTION,
        description: dto.reason,
        locationText: dto.locationText,
        actorUserId: actor.id,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_OPERATOR,
        recordedByUserId: actor.id,
      });

      // El intento fallido se acredita igual que la entrega: sin constancia, la
      // discusión sobre si se intentó no se puede resolver.
      let failedAttemptProofId: string | undefined;
      if (dto.photoFileId) {
        const proof = this.trackingRepo.createDeliveryProof(tx, {
          shipmentId,
          proofTypeConceptId: CONCEPTS.PROOF_FAILED_ATTEMPT,
          photoFileId: dto.photoFileId,
          statusConceptId: CONCEPTS.PROOF_REJECTED,
          actorUserId: actor.id,
        });
        failedAttemptProofId = proof.id;
      }

      return {
        shipmentId,
        statusConceptId,
        priorityConceptId,
        eventId: event.id,
        failedAttemptProofId,
      };
    });
  }

  /** UC-37-10: cancelar el envío y cerrar el sujeto. */
  async cancelShipment(
    shipmentId: string,
    dto: CancelShipmentDto,
    actor: AuthenticatedUser,
  ): Promise<CancelShipmentResponseDto> {
    this.logger.warn(
      { operation: 'tracking.shipment.cancel', shipmentId },
      'Cancelling shipment',
    );

    return this.em.transactional(async (tx) => {
      const shipment = await this.trackingRepo.findShipmentForUpdate(
        tx,
        shipmentId,
      );
      if (!shipment) {
        throw new ResourceNotFoundException('Envío no encontrado', {
          shipmentId,
        });
      }
      if (shipment.statusConceptId === CONCEPTS.TRACK_CANCELLED) {
        throw new ConflictException('El envío ya está cancelado', {
          shipmentId,
        });
      }
      // Cancelar algo ya entregado reescribiría lo ocurrido.
      if (shipment.statusConceptId === CONCEPTS.TRACK_DELIVERED) {
        throw new PreconditionFailedException(
          'Un envío entregado no se cancela',
          { shipmentId },
        );
      }

      const subject = await this.trackingRepo.findSubjectForUpdate(
        tx,
        shipment.trackableSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreable no encontrado', {
          trackableSubjectId: shipment.trackableSubjectId,
        });
      }

      const cancelledAt = new Date();
      shipment.statusConceptId = CONCEPTS.TRACK_CANCELLED;
      touch(shipment, actor.id);

      subject.currentStatusConceptId = CONCEPTS.TRACK_CANCELLED;
      subject.closedAt = cancelledAt;
      subject.stateConceptId = CONCEPTS.SUBJECT_CLOSED;
      touch(subject, actor.id);

      const event = this.trackingRepo.createEvent(tx, {
        trackableSubjectId: subject.id,
        statusConceptId: CONCEPTS.TRACK_CANCELLED,
        description: dto.reason,
        actorUserId: actor.id,
        sourceConceptId: CONCEPTS.TRACK_SOURCE_OPERATOR,
        occurredAt: cancelledAt,
        recordedByUserId: actor.id,
      });

      return {
        shipmentId,
        statusConceptId: CONCEPTS.TRACK_CANCELLED,
        subjectStateConceptId: CONCEPTS.SUBJECT_CLOSED,
        eventId: event.id,
      };
    });
  }

  /**
   * UC-37-11: barrer los compromisos vencidos. El SLA se mide contra el hito
   * **siguiente** al alcanzado: es el que se está incumpliendo ahora.
   */
  async scanSla(
    dto: ScanSlaDto,
    actor: AuthenticatedUser,
  ): Promise<ScanSlaResponseDto> {
    this.logger.info(
      { operation: 'tracking.sla.scan' },
      'Scanning SLA breaches',
    );

    const now = new Date();

    return this.em.transactional(async (tx) => {
      const subjects = await this.trackingRepo.findOpenSubjectsForScan(
        tx,
        CONCEPTS.SUBJECT_OPEN,
        dto.batchSize ?? DEFAULT_SCAN_BATCH,
      );

      const eventIds: string[] = [];
      let breached = 0;
      let escalated = 0;

      for (const subject of subjects) {
        const milestones = await this.trackingRepo.findMilestonesBySubjectType(
          tx,
          subject.subjectTypeConceptId,
          CONCEPTS.STATE_ACTIVE,
        );
        const pending = this.nextPendingMilestone(subject, milestones);
        if (!pending?.slaMinutes) continue;

        const since =
          subject.updatedAt ?? subject.openedAt ?? subject.createdAt;
        const dueAt = new Date(since.getTime() + pending.slaMinutes * 60_000);
        if (dueAt > now) continue;

        breached += 1;
        const overdueMinutes = Math.round(
          (now.getTime() - dueAt.getTime()) / 60_000,
        );
        const event = this.trackingRepo.createEvent(tx, {
          trackableSubjectId: subject.id,
          milestoneDefinitionId: pending.id,
          statusConceptId: CONCEPTS.TRACK_SLA_BREACH,
          description: `Hito ${pending.code} excedido en ${overdueMinutes} minutos`,
          sourceConceptId: CONCEPTS.TRACK_SOURCE_SYSTEM,
          occurredAt: now,
          recordedByUserId: actor.id,
        });
        eventIds.push(event.id);

        const escalatedPriority = this.escalate(subject.priorityConceptId);
        if (escalatedPriority !== subject.priorityConceptId) {
          subject.priorityConceptId = escalatedPriority;
          escalated += 1;
        }
        touch(subject, actor.id);
      }

      if (breached > 0) {
        this.logger.warn(
          { operation: 'tracking.sla.scan', breached, escalated },
          'SLA breaches detected',
        );
      }

      return { scanned: subjects.length, breached, escalated, eventIds };
    });
  }

  // --- Apoyo ---

  /**
   * Hito que el sujeto debería estar alcanzando: el siguiente al actual por
   * ordinal, o el primero si aún no alcanzó ninguno.
   */
  private nextPendingMilestone(
    subject: TrackableSubjects,
    milestones: Array<{
      /**
       * Identificador único de la instancia.
       */
      id: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal?: number;
      /**
       * Valor de sla minutes mantenido por la instancia.
       */
      slaMinutes?: number;
    }>,
  ):
    | {
        /**
         * Identificador único de la instancia.
         */
        id: string; /**
         * Valor de code mantenido por la instancia.
         */
        code: string; /**
         * Valor de sla minutes mantenido por la instancia.
         */
        slaMinutes?: number;
      }
    | undefined {
    if (milestones.length === 0) return undefined;
    if (!subject.currentMilestoneId) return milestones[0];

    const currentIndex = milestones.findIndex(
      (m) => m.id === subject.currentMilestoneId,
    );
    if (currentIndex < 0) return milestones[0];
    return milestones[currentIndex + 1];
  }

  /** Sube un escalón la prioridad; en crítica ya no sube más. */
  private escalate(priorityConceptId: string | undefined): string {
    if (priorityConceptId === CONCEPTS.TRACK_PRIORITY_CRITICAL) {
      return CONCEPTS.TRACK_PRIORITY_CRITICAL;
    }
    if (priorityConceptId === CONCEPTS.TRACK_PRIORITY_HIGH) {
      return CONCEPTS.TRACK_PRIORITY_CRITICAL;
    }
    return CONCEPTS.TRACK_PRIORITY_HIGH;
  }

  /** Referencia estable del evento externo, con la que se deduplica. */
  private externalReference(
    carrierCode: string,
    externalEventId: string,
  ): string {
    return `${carrierCode}:${externalEventId}`;
  }

  /** Número de seguimiento opaco: no debe dejar deducir qué se transporta. */
  private async generateTrackingNumber(tx: EntityManager): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = randomBytes(TRACKING_NUMBER_BYTES)
        .toString('base64url')
        .toUpperCase();
      if (!(await this.trackingRepo.findSubjectByTrackingNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException(
      'No se pudo generar un número de seguimiento libre',
      {},
    );
  }

  /** Número de envío correlativo. */
  private async nextShipmentNumber(tx: EntityManager): Promise<string> {
    const total = await this.trackingRepo.countShipments(tx);
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const candidate = `ENV-${String(total + attempt).padStart(6, '0')}`;
      if (!(await this.trackingRepo.findShipmentByNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException('No se pudo asignar número de envío', {});
  }
}
