import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { TrackingService } from './tracking.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['TRACKING_ADMIN'] };
const SUBJECT = '11111111-1111-1111-1111-111111111111';
const SHIPMENT = '22222222-2222-2222-2222-222222222222';
const CARRIER = '33333333-3333-3333-3333-333333333333';
const REF = '44444444-4444-4444-4444-444444444444';
const FILE = '55555555-5555-5555-5555-555555555555';
const COURIER = '66666666-6666-6666-6666-666666666666';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const trackingRepo = {
    createSubject: mockFn(),
    findSubjectById: mockFn(),
    findSubjectForUpdate: mockFn(),
    findSubjectByTrackingNumber: mockFn(),
    findOpenSubjectByRef: mockFn(),
    createShipment: mockFn(),
    findShipmentById: mockFn(),
    findShipmentForUpdate: mockFn(),
    findShipmentByNumber: mockFn(),
    findShipmentBySubjectForUpdate: mockFn(),
    countShipments: mockFn(),
    createMilestoneDefinition: mockFn(),
    findMilestoneById: mockFn(),
    findMilestoneByCode: mockFn(),
    findMilestonesBySubjectType: mockFn(),
    createEvent: mockFn(),
    findEventsBySubject: mockFn(),
    findEventByExternalReference: mockFn(),
    createHandoff: mockFn(),
    createEtaEstimate: mockFn(),
    findLatestEstimate: mockFn(),
    createDeliveryProof: mockFn(),
    findVerifiedProof: mockFn(),
    findCarrierById: mockFn(),
    findCarrierByCode: mockFn(),
    findOpenSubjectsForScan: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new TrackingService(em as any, trackingRepo, logger as any);
  return { service, tx, trackingRepo, logger };
}

/**
 * Ejecuta la operación open subject.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de open subject conforme al contrato `any`.
 */
function openSubject(overrides: Record<string, unknown> = {}): any {
  return {
    id: SUBJECT,
    subjectTypeConceptId: CONCEPTS.SUBJECT_TYPE_SPECIMEN,
    stateConceptId: CONCEPTS.SUBJECT_OPEN,
    currentStatusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
    priorityConceptId: CONCEPTS.TRACK_PRIORITY_NORMAL,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Ejecuta la operación live shipment.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de live shipment conforme al contrato `any`.
 */
function liveShipment(overrides: Record<string, unknown> = {}): any {
  return {
    id: SHIPMENT,
    trackableSubjectId: SUBJECT,
    statusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
    carrierId: CARRIER,
    ...overrides,
  };
}

describe('TrackingService', () => {
  describe('openSubject (UC-37-01)', () => {
    const dto = {
      subjectType: 'SPECIMEN' as const,
      subjectRefType: 'lab_specimen',
      subjectRefId: REF,
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.trackingRepo.findOpenSubjectByRef.mockResolvedValue(null);
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(null);
      d.trackingRepo.countShipments.mockResolvedValue(0);
      d.trackingRepo.findShipmentByNumber.mockResolvedValue(null);
      d.trackingRepo.createSubject.mockReturnValue({ id: SUBJECT });
      d.trackingRepo.createShipment.mockReturnValue({ id: SHIPMENT });
    }

    it('opens the subject with an opaque tracking number and its shipment', async () => {
      const d = build();
      wire(d);

      const res = await d.service.openSubject(dto, actor);

      expect(res).toMatchObject({
        id: SUBJECT,
        stateConceptId: CONCEPTS.SUBJECT_OPEN,
        currentStatusConceptId: CONCEPTS.TRACK_CREATED,
        shipmentId: SHIPMENT,
        shipmentNumber: 'ENV-000001',
      });
      // Opaco: no contiene la referencia de lo transportado.
      expect(res.trackingNumber).not.toContain(REF);
    });

    it('rejects a second open subject for the same entity', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectByRef.mockResolvedValue({
        id: 'subject-prev',
      });

      await expect(
        d.service.openSubject(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses an inactive carrier', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findCarrierById.mockResolvedValue({
        id: CARRIER,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.openSubject({ ...dto, carrierId: CARRIER }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the carrier does not exist', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findCarrierById.mockResolvedValue(null);

      await expect(
        d.service.openSubject({ ...dto, carrierId: CARRIER }, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('defineMilestones (UC-37-02)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param milestones - Valor de milestones requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(milestones: any[]): any {
      return { subjectType: 'SPECIMEN' as const, milestones, tenantId: 'tenant-a' };
    }

    it('creates the milestones numbering them in order', async () => {
      const d = build();
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([]);
      let n = 0;
      d.trackingRepo.createMilestoneDefinition.mockImplementation(() => ({
        id: `ms-${++n}`,
      }));

      const res = await d.service.defineMilestones(
        dto([
          {
            code: 'PICKED',
            name: 'Recogido',
            milestoneStatus: 'IN_TRANSIT' as const,
          },
          {
            code: 'DELIVERED',
            name: 'Entregado',
            milestoneStatus: 'DELIVERED' as const,
            isTerminal: true,
          },
        ]),
        actor,
      );

      expect(res).toMatchObject({
        milestoneIds: ['ms-1', 'ms-2'],
        skipped: 0,
        terminalCount: 1,
      });
      expect(
        d.trackingRepo.createMilestoneDefinition.mock.calls[0][1].ordinal,
      ).toBe(1);
      expect(
        d.trackingRepo.createMilestoneDefinition.mock.calls[1][1].ordinal,
      ).toBe(2);
    });

    it("checks existing codes scoped to the catalog's own tenant", async () => {
      const d = build();
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([]);
      d.trackingRepo.createMilestoneDefinition.mockReturnValue({ id: 'ms-1' });

      await d.service.defineMilestones(
        dto([{ code: 'PICKED', name: 'Recogido', milestoneStatus: 'IN_TRANSIT' as const }]),
        actor,
      );

      expect(
        d.trackingRepo.findMilestonesBySubjectType,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.any(String),
        expect.any(String),
        'tenant-a',
      );
    });

    it('skips a code that already exists', async () => {
      const d = build();
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { code: 'PICKED', isTerminal: false },
      ]);

      const res = await d.service.defineMilestones(
        dto([
          {
            code: 'PICKED',
            name: 'Recogido',
            milestoneStatus: 'IN_TRANSIT' as const,
          },
        ]),
        actor,
      );

      expect(res).toMatchObject({ milestoneIds: [], skipped: 1 });
    });

    it('rejects two terminal milestones in the same request', async () => {
      const d = build();

      await expect(
        d.service.defineMilestones(
          dto([
            {
              code: 'A',
              name: 'A',
              milestoneStatus: 'DELIVERED' as const,
              isTerminal: true,
            },
            {
              code: 'B',
              name: 'B',
              milestoneStatus: 'CANCELLED' as const,
              isTerminal: true,
            },
          ]),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a terminal milestone when one already exists', async () => {
      const d = build();
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { code: 'DONE', isTerminal: true },
      ]);

      await expect(
        d.service.defineMilestones(
          dto([
            {
              code: 'B',
              name: 'B',
              milestoneStatus: 'DELIVERED' as const,
              isTerminal: true,
            },
          ]),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('dispatchShipment (UC-37-03)', () => {
    it('dispatches and moves both shipment and subject to in transit', async () => {
      const d = build();
      const shipment = liveShipment({
        statusConceptId: CONCEPTS.TRACK_PREPARING,
      });
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      const subject = openSubject();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.dispatchShipment(SHIPMENT, {}, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        eventId: 'event-1',
      });
      expect(shipment.dispatchedAt).toBeInstanceOf(Date);
      expect(subject.currentStatusConceptId).toBe(CONCEPTS.TRACK_IN_TRANSIT);
    });

    it('refuses to dispatch with no carrier and no courier', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({
          statusConceptId: CONCEPTS.TRACK_PREPARING,
          carrierId: undefined,
        }),
      );

      await expect(
        d.service.dispatchShipment(SHIPMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to dispatch a shipment that is not preparing', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(liveShipment());

      await expect(
        d.service.dispatchShipment(SHIPMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordEvent (UC-37-04)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return { status: 'IN_TRANSIT' as const, ...overrides };
    }

    it('records the event and moves the current status', async () => {
      const d = build();
      const subject = openSubject();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.recordEvent(SUBJECT, dto(), actor);

      expect(res).toMatchObject({
        id: 'event-1',
        currentStatusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        subjectClosed: false,
      });
    });

    it('a terminal milestone closes the subject', async () => {
      const d = build();
      const subject = openSubject({ tenantId: 'tenant-a' });
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.findMilestoneByCode.mockResolvedValue({
        id: 'ms-1',
        isTerminal: true,
      });
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.recordEvent(
        SUBJECT,
        dto({ status: 'DELIVERED' as const, milestoneCode: 'DELIVERED' }),
        actor,
      );

      expect(res.subjectClosed).toBe(true);
      expect(subject.stateConceptId).toBe(CONCEPTS.SUBJECT_CLOSED);
      expect(subject.closedAt).toBeInstanceOf(Date);
      expect(d.trackingRepo.findMilestoneByCode).toHaveBeenCalledWith(
        d.tx,
        subject.subjectTypeConceptId,
        'DELIVERED',
        'tenant-a',
      );
    });

    it('refuses to record on a closed subject', async () => {
      const d = build();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(
        openSubject({ stateConceptId: CONCEPTS.SUBJECT_CLOSED }),
      );

      await expect(
        d.service.recordEvent(SUBJECT, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the milestone code is unknown for the subject type', async () => {
      const d = build();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(openSubject());
      d.trackingRepo.findMilestoneByCode.mockResolvedValue(null);

      await expect(
        d.service.recordEvent(
          SUBJECT,
          dto({ milestoneCode: 'NOPE' }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('ingestCarrierWebhook (UC-37-05)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        trackingNumber: 'ABC123',
        externalStatusCode: 'IN_TRANSIT',
        externalEventId: 'evt-1',
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.trackingRepo.findCarrierByCode.mockResolvedValue({
        id: CARRIER,
        code: 'DHL',
      });
      const subject = openSubject();
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(subject);
      d.trackingRepo.findEventByExternalReference.mockResolvedValue(null);
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });
      return subject;
    }

    it('maps the external code and records the event', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(
        liveShipment(),
      );

      const res = await d.service.ingestCarrierWebhook('DHL', dto());

      expect(res).toMatchObject({
        eventId: 'event-1',
        currentStatusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        duplicate: false,
      });
    });

    it('is idempotent when the carrier redelivers the event', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findEventByExternalReference.mockResolvedValue({
        id: 'event-prev',
      });

      const res = await d.service.ingestCarrierWebhook('DHL', dto());

      expect(res).toMatchObject({ eventId: 'event-prev', duplicate: true });
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    });

    it('records an unmapped code as an exception and warns', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(
        liveShipment(),
      );

      const res = await d.service.ingestCarrierWebhook(
        'DHL',
        dto({ externalStatusCode: 'RARO' }),
      );

      expect(res.currentStatusConceptId).toBe(CONCEPTS.TRACK_EXCEPTION);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not move a shipment that is already delivered', async () => {
      const d = build();
      wire(d);
      const shipment = liveShipment({
        statusConceptId: CONCEPTS.TRACK_DELIVERED,
      });
      d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(shipment);

      await d.service.ingestCarrierWebhook(
        'DHL',
        dto({ externalStatusCode: 'IN_TRANSIT' }),
      );

      expect(shipment.statusConceptId).toBe(CONCEPTS.TRACK_DELIVERED);
    });

    it('fails on an unknown tracking number', async () => {
      const d = build();
      d.trackingRepo.findCarrierByCode.mockResolvedValue({
        id: CARRIER,
        code: 'DHL',
      });
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(null);

      await expect(
        d.service.ingestCarrierWebhook('DHL', dto()),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails on an unknown carrier code', async () => {
      const d = build();
      d.trackingRepo.findCarrierByCode.mockResolvedValue(null);

      await expect(
        d.service.ingestCarrierWebhook('NOPE', dto()),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordHandoff (UC-37-06)', () => {
    const dto = { handoffType: 'TRANSFER' as const };

    it('records the handoff and moves the responsible carrier', async () => {
      const d = build();
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findCarrierById.mockResolvedValue({
        id: 'carrier-new',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.trackingRepo.createHandoff.mockReturnValue({ id: 'handoff-1' });
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.recordHandoff(
        SHIPMENT,
        { ...dto, newCarrierId: 'carrier-new' },
        actor,
      );

      expect(res).toMatchObject({
        id: 'handoff-1',
        eventId: 'event-1',
        carrierId: 'carrier-new',
      });
      expect(shipment.carrierId).toBe('carrier-new');
    });

    it('refuses a handoff on a delivered shipment', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({ statusConceptId: CONCEPTS.TRACK_DELIVERED }),
      );

      await expect(
        d.service.recordHandoff(SHIPMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive new carrier', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(liveShipment());
      d.trackingRepo.findCarrierById.mockResolvedValue({
        id: 'carrier-new',
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.recordHandoff(
          SHIPMENT,
          { ...dto, newCarrierId: 'carrier-new' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recomputeEta (UC-37-07)', () => {
    const dto = {
      estimatedArrivalAt: '2026-09-01T18:00:00Z',
      method: 'DISTANCE' as const,
      distanceM: '12000',
    };

    it('records the estimate and applies it to the shipment', async () => {
      const d = build();
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findLatestEstimate.mockResolvedValue(null);
      d.trackingRepo.createEtaEstimate.mockReturnValue({
        id: 'eta-1',
        recordedAt: new Date(),
      });
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(openSubject());

      const res = await d.service.recomputeEta(SHIPMENT, dto, actor);

      expect(res).toMatchObject({ id: 'eta-1', applied: true });
      expect(shipment.estimatedArrivalAt).toBeInstanceOf(Date);
      expect(shipment.distanceM).toBe('12000');
    });

    it('does not apply an estimate older than the current one', async () => {
      const d = build();
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findLatestEstimate.mockResolvedValue({
        id: 'eta-prev',
        recordedAt: new Date(Date.now() + 60_000),
      });
      d.trackingRepo.createEtaEstimate.mockReturnValue({
        id: 'eta-1',
        recordedAt: new Date(),
      });
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(openSubject());

      const res = await d.service.recomputeEta(SHIPMENT, dto, actor);

      expect(res.applied).toBe(false);
      expect(shipment.estimatedArrivalAt).toBeUndefined();
    });

    it('refuses an estimate on a cancelled shipment', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({ statusConceptId: CONCEPTS.TRACK_CANCELLED }),
      );

      await expect(
        d.service.recomputeEta(SHIPMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordDeliveryProof (UC-37-08)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        proofType: 'SIGNATURE' as const,
        signatureFileId: FILE,
        recipientName: 'Ana Pérez',
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findVerifiedProof.mockResolvedValue(null);
      const subject = openSubject();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createDeliveryProof.mockReturnValue({ id: 'proof-1' });
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { id: 'ms-terminal', isTerminal: true },
      ]);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });
      return { shipment, subject };
    }

    it('records the proof, delivers the shipment and closes the subject', async () => {
      const d = build();
      const { shipment, subject } = wire(d);

      const res = await d.service.recordDeliveryProof(SHIPMENT, dto(), actor);

      expect(res).toMatchObject({
        id: 'proof-1',
        shipmentStatusConceptId: CONCEPTS.TRACK_DELIVERED,
        subjectStateConceptId: CONCEPTS.SUBJECT_CLOSED,
        eventId: 'event-1',
      });
      expect(shipment.deliveredAt).toBeInstanceOf(Date);
      expect(subject.currentMilestoneId).toBe('ms-terminal');
    });

    it('requires the signature file on a signature proof', async () => {
      const d = build();

      await expect(
        d.service.recordDeliveryProof(
          SHIPMENT,
          dto({ signatureFileId: undefined }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('requires the photo on a photo proof', async () => {
      const d = build();

      await expect(
        d.service.recordDeliveryProof(
          SHIPMENT,
          { proofType: 'PHOTO' as const } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects delivering twice', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({ statusConceptId: CONCEPTS.TRACK_DELIVERED }),
      );

      await expect(
        d.service.recordDeliveryProof(SHIPMENT, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a second verified proof', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findVerifiedProof.mockResolvedValue({ id: 'proof-prev' });

      await expect(
        d.service.recordDeliveryProof(SHIPMENT, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('recordException (UC-37-09)', () => {
    const dto = { reason: 'Destinatario ausente' };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param priority - Valor de priority requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      priority = CONCEPTS.TRACK_PRIORITY_NORMAL,
    ) {
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      const subject = openSubject({ priorityConceptId: priority });
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });
      d.trackingRepo.createDeliveryProof.mockReturnValue({ id: 'proof-1' });
      return { shipment, subject };
    }

    it('marks the exception and escalates the priority', async () => {
      const d = build();
      const { shipment, subject } = wire(d);

      const res = await d.service.recordException(SHIPMENT, dto, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.TRACK_EXCEPTION,
        priorityConceptId: CONCEPTS.TRACK_PRIORITY_HIGH,
      });
      expect(shipment.statusConceptId).toBe(CONCEPTS.TRACK_EXCEPTION);
      expect(subject.priorityConceptId).toBe(CONCEPTS.TRACK_PRIORITY_HIGH);
    });

    it('escalates from high to critical', async () => {
      const d = build();
      wire(d, CONCEPTS.TRACK_PRIORITY_HIGH);

      const res = await d.service.recordException(SHIPMENT, dto, actor);

      expect(res.priorityConceptId).toBe(CONCEPTS.TRACK_PRIORITY_CRITICAL);
    });

    it('does not escalate past critical', async () => {
      const d = build();
      wire(d, CONCEPTS.TRACK_PRIORITY_CRITICAL);

      const res = await d.service.recordException(SHIPMENT, dto, actor);

      expect(res.priorityConceptId).toBe(CONCEPTS.TRACK_PRIORITY_CRITICAL);
    });

    it('schedules a retry when asked', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordException(
        SHIPMENT,
        { ...dto, scheduleRetry: true },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.TRACK_RETRY_SCHEDULED);
    });

    it('records the failed attempt proof when a photo is given', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordException(
        SHIPMENT,
        { ...dto, photoFileId: FILE },
        actor,
      );

      expect(res.failedAttemptProofId).toBe('proof-1');
      expect(d.trackingRepo.createDeliveryProof).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.PROOF_REJECTED }),
      );
    });
  });

  describe('cancelShipment (UC-37-10)', () => {
    const dto = { reason: 'Pedido anulado' };

    it('cancels the shipment and closes the subject', async () => {
      const d = build();
      const shipment = liveShipment();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      const subject = openSubject();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.cancelShipment(SHIPMENT, dto, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.TRACK_CANCELLED,
        subjectStateConceptId: CONCEPTS.SUBJECT_CLOSED,
      });
      expect(subject.closedAt).toBeInstanceOf(Date);
    });

    it('rejects cancelling twice', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({ statusConceptId: CONCEPTS.TRACK_CANCELLED }),
      );

      await expect(
        d.service.cancelShipment(SHIPMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to cancel a delivered shipment', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment({ statusConceptId: CONCEPTS.TRACK_DELIVERED }),
      );

      await expect(
        d.service.cancelShipment(SHIPMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('scanSla (UC-37-11)', () => {
    it('detects the breach on the next pending milestone and escalates', async () => {
      const d = build();
      const subject = openSubject({
        currentMilestoneId: 'ms-1',
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      });
      d.trackingRepo.findOpenSubjectsForScan.mockResolvedValue([subject]);
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { id: 'ms-1', code: 'PICKED', ordinal: 1 },
        { id: 'ms-2', code: 'DELIVERED', ordinal: 2, slaMinutes: 60 },
      ]);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.scanSla({}, actor);

      expect(res).toMatchObject({
        scanned: 1,
        breached: 1,
        escalated: 1,
        eventIds: ['event-1'],
      });
      expect(subject.priorityConceptId).toBe(CONCEPTS.TRACK_PRIORITY_HIGH);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not flag a milestone still within its window', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectsForScan.mockResolvedValue([
        openSubject({ currentMilestoneId: 'ms-1', updatedAt: new Date() }),
      ]);
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { id: 'ms-1', code: 'PICKED', ordinal: 1 },
        { id: 'ms-2', code: 'DELIVERED', ordinal: 2, slaMinutes: 60 },
      ]);

      const res = await d.service.scanSla({}, actor);

      expect(res).toMatchObject({ scanned: 1, breached: 0 });
    });

    it('skips a milestone with no SLA declared', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectsForScan.mockResolvedValue([
        openSubject({ updatedAt: new Date(Date.now() - 100 * 60 * 60 * 1000) }),
      ]);
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { id: 'ms-1', code: 'PICKED', ordinal: 1 },
      ]);

      const res = await d.service.scanSla({}, actor);

      expect(res.breached).toBe(0);
    });

    it('measures the first milestone when none has been reached yet', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectsForScan.mockResolvedValue([
        openSubject({
          currentMilestoneId: undefined,
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        }),
      ]);
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([
        { id: 'ms-1', code: 'PICKED', ordinal: 1, slaMinutes: 30 },
      ]);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.scanSla({}, actor);

      expect(res.breached).toBe(1);
    });

    it('reports an empty scan when nothing is open', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectsForScan.mockResolvedValue([]);

      const res = await d.service.scanSla({}, actor);

      expect(res).toEqual({
        scanned: 0,
        breached: 0,
        escalated: 0,
        eventIds: [],
      });
    });
  });
});
