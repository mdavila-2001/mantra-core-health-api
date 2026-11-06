import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { TrackingService } from './tracking.service';
import { carrierSignedString } from '../tracking-webhook-auth';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  runWithTenant,
  signPayload,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { TrackingErrorReason } from '../tracking.error-reasons';

const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';
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
    findShipmentBySubject: mockFn(),
    lockSubjectById: mockFn(),
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
  // Las operaciones autenticadas exigen el tenant activo: salvo que una prueba
  // diga otra cosa, actúan dentro de TENANT. `raw` conserva la operación sin
  // contexto para probar otro tenant.
  const raw = service;
  const scoped = Object.create(raw) as TrackingService;
  for (const name of [
    'openSubject',
    'defineMilestones',
    'dispatchShipment',
    'recordEvent',
    'recordHandoff',
    'recomputeEta',
    'recordDeliveryProof',
    'recordException',
    'cancelShipment',
  ] as const) {
    (scoped as any)[name] = (...args: unknown[]) =>
      runWithTenant(TENANT, () => (raw as any)[name](...args));
  }
  return { service: scoped, raw, tx, trackingRepo, logger };
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
      return {
        subjectType: 'SPECIMEN' as const,
        milestones,
      };
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
        dto([
          {
            code: 'PICKED',
            name: 'Recogido',
            milestoneStatus: 'IN_TRANSIT' as const,
          },
        ]),
        actor,
      );

      expect(d.trackingRepo.findMilestonesBySubjectType).toHaveBeenCalledWith(
        d.tx,
        expect.any(String),
        expect.any(String),
        TENANT,
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
    const SECRET = 'c'.repeat(40);
    const ENV_NAME = 'WEBHOOK_SECRET_CARRIER_DHL';
    const originalSecret = process.env[ENV_NAME];
    const originalPrev = process.env[`${ENV_NAME}_PREV`];

    beforeEach(() => {
      process.env[ENV_NAME] = SECRET;
      delete process.env[`${ENV_NAME}_PREV`];
    });

    afterEach(() => {
      if (originalSecret === undefined) delete process.env[ENV_NAME];
      else process.env[ENV_NAME] = originalSecret;
      if (originalPrev === undefined) delete process.env[`${ENV_NAME}_PREV`];
      else process.env[`${ENV_NAME}_PREV`] = originalPrev;
    });

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

    /** Cabeceras que enviaría el transportista para `body`, firmadas con `secret`. */
    function signed(
      body: any,
      {
        secret = SECRET,
        carrierCode = 'DHL',
        timestamp = String(Math.floor(Date.now() / 1000)),
      }: { secret?: string; carrierCode?: string; timestamp?: string } = {},
    ) {
      return {
        timestamp,
        signature: signPayload(
          secret,
          carrierSignedString(timestamp, carrierCode, body),
        ),
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
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const subject = openSubject();
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(subject);
      d.trackingRepo.findEventByExternalReference.mockResolvedValue(null);
      d.trackingRepo.lockSubjectById.mockResolvedValue(subject);
      d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(
        liveShipment(),
      );
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });
      return subject;
    }

    /** Afirma que se rechazó sin leer sujetos ni escribir nada. */
    function expectNoMutation(d: ReturnType<typeof build>) {
      expect(d.trackingRepo.findSubjectByTrackingNumber).not.toHaveBeenCalled();
      expect(d.trackingRepo.lockSubjectById).not.toHaveBeenCalled();
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    }

    it('maps the external code and records the event', async () => {
      const d = build();
      wire(d);
      const body = dto();

      const res = await d.service.ingestCarrierWebhook(
        'DHL',
        body,
        signed(body),
      );

      expect(res).toMatchObject({
        eventId: 'event-1',
        currentStatusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        duplicate: false,
      });
    });

    it('is idempotent when the carrier redelivers the event (signed redelivery)', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findEventByExternalReference.mockResolvedValue({
        id: 'event-prev',
      });
      const body = dto();

      const res = await d.service.ingestCarrierWebhook(
        'DHL',
        body,
        signed(body),
      );

      expect(res).toMatchObject({ eventId: 'event-prev', duplicate: true });
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    });

    it('decides the redelivery AFTER locking the subject, so concurrent deliveries cannot both insert', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findEventByExternalReference.mockResolvedValue({
        id: 'event-prev',
      });
      const body = dto();

      await d.service.ingestCarrierWebhook('DHL', body, signed(body));

      expect(
        d.trackingRepo.lockSubjectById.mock.invocationCallOrder[0],
      ).toBeLessThan(
        d.trackingRepo.findEventByExternalReference.mock.invocationCallOrder[0],
      );
    });

    it('records an unmapped code as an exception and warns', async () => {
      const d = build();
      wire(d);
      const body = dto({ externalStatusCode: 'RARO' });

      const res = await d.service.ingestCarrierWebhook(
        'DHL',
        body,
        signed(body),
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
      const body = dto({ externalStatusCode: 'IN_TRANSIT' });

      await d.service.ingestCarrierWebhook('DHL', body, signed(body));

      expect(shipment.statusConceptId).toBe(CONCEPTS.TRACK_DELIVERED);
    });

    it('fails on an unknown tracking number', async () => {
      const d = build();
      wire(d);
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(null);
      const body = dto();

      await expect(
        d.service.ingestCarrierWebhook('DHL', body, signed(body)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('answers an unknown carrier code like a bad signature, without revealing it', async () => {
      const d = build();
      d.trackingRepo.findCarrierByCode.mockResolvedValue(null);
      const body = dto();

      await expect(
        d.service.ingestCarrierWebhook('NOPE', body, signed(body)),
      ).rejects.toMatchObject({
        reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
      });
      expectNoMutation(d);
    });

    describe('autenticación del emisor (TRACK-01)', () => {
      it.each([
        ['sin firma', { timestamp: '1' }],
        ['sin marca de tiempo', { signature: 'a'.repeat(64) }],
        ['sin ninguna cabecera', {}],
        [
          'firma con formato inválido',
          { signature: 'tampered', timestamp: '1' },
        ],
      ])('rechaza %s con 401 y sin mutar', async (_label, auth) => {
        const d = build();
        wire(d);

        await expect(
          d.service.ingestCarrierWebhook('DHL', dto(), auth as any),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
        });
        await expect(
          d.service.ingestCarrierWebhook('DHL', dto(), auth as any),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expectNoMutation(d);
      });

      it('rechaza una firma alterada: cualquier campo del evento cambia el HMAC', async () => {
        for (const tamper of [
          { externalStatusCode: 'DELIVERED' },
          { trackingNumber: 'OTHER' },
          { externalEventId: 'evt-2' },
          { occurredAt: '2026-10-24T10:00:00Z' },
          { locationText: 'Quito' },
        ]) {
          const d = build();
          wire(d);
          const original = dto();
          const auth = signed(original);

          await expect(
            d.service.ingestCarrierWebhook(
              'DHL',
              { ...original, ...tamper },
              auth,
            ),
          ).rejects.toMatchObject({
            reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
          });
          expectNoMutation(d);
        }
      });

      it('rechaza una firma hecha con el secreto de otro transportista', async () => {
        const d = build();
        wire(d);
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { secret: 'z'.repeat(40) }),
          ),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
        });
        expectNoMutation(d);
      });

      it('rechaza al transportista que no tiene secreto configurado (fail-closed)', async () => {
        const d = build();
        wire(d);
        delete process.env[ENV_NAME];
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
        });
        expectNoMutation(d);
      });

      it('rechaza un secreto demasiado corto', async () => {
        const d = build();
        wire(d);
        process.env[ENV_NAME] = 'corto';
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { secret: 'corto' }),
          ),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
        });
      });

      it('rechaza al transportista inactivo aunque la firma sea válida', async () => {
        const d = build();
        wire(d);
        d.trackingRepo.findCarrierByCode.mockResolvedValue({
          id: CARRIER,
          code: 'DHL',
          stateConceptId: CONCEPTS.STATE_REVOKED,
        });
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_SIGNATURE_INVALID,
        });
        expectNoMutation(d);
      });

      it('rechaza una marca de tiempo vencida aunque la firma verifique (replay)', async () => {
        const d = build();
        wire(d);
        const body = dto();
        const stale = String(Math.floor(Date.now() / 1000) - 3_600);

        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { timestamp: stale }),
          ),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_REPLAY_REJECTED,
        });
        expectNoMutation(d);
      });

      it('rechaza una marca de tiempo adelantada más allá de la ventana', async () => {
        const d = build();
        wire(d);
        const body = dto();
        const future = String(Math.floor(Date.now() / 1000) + 3_600);

        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { timestamp: future }),
          ),
        ).rejects.toMatchObject({
          reason: TrackingErrorReason.WEBHOOK_REPLAY_REJECTED,
        });
      });

      it('acepta el secreto anterior durante una rotación', async () => {
        const d = build();
        wire(d);
        const OLD = 'o'.repeat(40);
        process.env[`${ENV_NAME}_PREV`] = OLD;
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { secret: OLD }),
          ),
        ).resolves.toMatchObject({ duplicate: false });
        await expect(
          d.service.ingestCarrierWebhook(
            'DHL',
            body,
            signed(body, { secret: SECRET }),
          ),
        ).resolves.toMatchObject({ duplicate: false });
      });

      it('no registra la firma ni el secreto al rechazar', async () => {
        const d = build();
        wire(d);
        const body = dto();
        const auth = signed(body, { secret: 'z'.repeat(40) });

        await d.service
          .ingestCarrierWebhook('DHL', body, auth)
          .catch(() => undefined);

        const logged = JSON.stringify(d.logger.warn.mock.calls);
        expect(logged).not.toContain(auth.signature);
        expect(logged).not.toContain(SECRET);
      });
    });

    describe('autorización por objeto', () => {
      it('un transportista autenticado no mueve el envío de otro transportista', async () => {
        const d = build();
        wire(d);
        d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(
          liveShipment({ carrierId: 'another-carrier' }),
        );
        const body = dto({ externalStatusCode: 'DELIVERED' });

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
      });

      it('un sujeto sin envío asignado tampoco se mueve por webhook', async () => {
        const d = build();
        wire(d);
        d.trackingRepo.findShipmentBySubjectForUpdate.mockResolvedValue(null);
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
      });

      it('un transportista de un tenant no opera sujetos de otro tenant', async () => {
        const d = build();
        wire(d);
        d.trackingRepo.findCarrierByCode.mockResolvedValue({
          id: CARRIER,
          code: 'DHL',
          tenantId: TENANT,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
        });
        d.trackingRepo.lockSubjectById.mockResolvedValue(
          openSubject({ tenantId: OTHER_TENANT }),
        );
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
      });

      it('un transportista de un tenant sí opera sujetos de su tenant', async () => {
        const d = build();
        wire(d);
        d.trackingRepo.findCarrierByCode.mockResolvedValue({
          id: CARRIER,
          code: 'DHL',
          tenantId: TENANT,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
        });
        d.trackingRepo.lockSubjectById.mockResolvedValue(
          openSubject({ tenantId: TENANT }),
        );
        const body = dto();

        await expect(
          d.service.ingestCarrierWebhook('DHL', body, signed(body)),
        ).resolves.toMatchObject({ duplicate: false });
      });
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

  describe('alcance de tenant y política de recurso (TRACK-02)', () => {
    const courierActor = { id: COURIER, roles: ['COURIER'] };
    const operatorActor = { id: 'op-1', roles: ['LOGISTICS_OPERATOR'] };

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException & InsufficientRoleException;
      }
      throw new Error('debía rechazar');
    }

    /** Cuerpos mínimos válidos de cada operación sobre un envío. */
    const shipmentOperations: Array<
      [string, (s: TrackingService, a: any) => Promise<unknown>]
    > = [
      [
        'dispatchShipment',
        (s, a) => s.dispatchShipment(SHIPMENT, {} as any, a),
      ],
      [
        'recordHandoff',
        (s, a) =>
          s.recordHandoff(
            SHIPMENT,
            {
              handoffType: 'TRANSFER',
              fromPartyType: 'x',
              toPartyType: 'y',
            } as any,
            a,
          ),
      ],
      [
        'recomputeEta',
        (s, a) =>
          s.recomputeEta(
            SHIPMENT,
            {
              estimatedArrivalAt: '2026-10-25T10:00:00.000Z',
              method: 'MANUAL',
            } as any,
            a,
          ),
      ],
      [
        'recordDeliveryProof',
        (s, a) =>
          s.recordDeliveryProof(
            SHIPMENT,
            { proofType: 'PHOTO', photoFileId: FILE } as any,
            a,
          ),
      ],
      [
        'recordException',
        (s, a) =>
          s.recordException(SHIPMENT, { reason: 'puerta cerrada' } as any, a),
      ],
      [
        'cancelShipment',
        (s, a) => s.cancelShipment(SHIPMENT, { reason: 'anulado' } as any, a),
      ],
    ];

    it.each(shipmentOperations)(
      'Inválido: %s con el UUID de un envío de otro tenant responde 404 y no escribe',
      async (_name, run) => {
        const d = build();
        // El repositorio filtra por id + tenant: el envío ajeno no se encuentra.
        d.trackingRepo.findShipmentForUpdate.mockResolvedValue(null);

        const error = await failure(run(d.service, operatorActor));

        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(error.getStatus()).toBe(404);
        expect(error.reason).toBe(TrackingErrorReason.SHIPMENT_NOT_FOUND);
        expect(error.details).toBeUndefined();
        expect(d.trackingRepo.findShipmentForUpdate).toHaveBeenCalledWith(
          d.tx,
          SHIPMENT,
          TENANT,
        );
        expect(d.trackingRepo.findSubjectForUpdate).not.toHaveBeenCalled();
        expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
        expect(d.trackingRepo.createHandoff).not.toHaveBeenCalled();
        expect(d.trackingRepo.createEtaEstimate).not.toHaveBeenCalled();
        expect(d.trackingRepo.createDeliveryProof).not.toHaveBeenCalled();
        expect(d.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('el envío ajeno y el inexistente responden exactamente igual', async () => {
      const ajeno = build();
      ajeno.trackingRepo.findShipmentForUpdate.mockResolvedValue(null);
      const inexistente = build();
      inexistente.trackingRepo.findShipmentForUpdate.mockResolvedValue(null);

      const a = await failure(
        ajeno.service.cancelShipment(SHIPMENT, { reason: 'x' } as any, actor),
      );
      const b = await failure(
        inexistente.service.cancelShipment(
          '99999999-9999-9999-9999-999999999999',
          { reason: 'x' } as any,
          actor,
        ),
      );

      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('Inválido: registrar un evento sobre el sujeto de otro tenant responde 404 y no escribe', async () => {
      const d = build();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(null);

      const error = await failure(
        d.service.recordEvent(SUBJECT, { status: 'IN_TRANSIT' } as any, actor),
      );

      expect(error.reason).toBe(TrackingErrorReason.SUBJECT_NOT_FOUND);
      expect(d.trackingRepo.findSubjectForUpdate).toHaveBeenCalledWith(
        d.tx,
        SUBJECT,
        TENANT,
      );
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    });

    it('Válido: el operador despacha un envío de su tenant con transición y evento', async () => {
      const d = build();
      const shipment = liveShipment({
        statusConceptId: CONCEPTS.TRACK_PREPARING,
        tenantId: TENANT,
      });
      const subject = openSubject();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.dispatchShipment(
        SHIPMENT,
        {} as any,
        operatorActor,
      );

      expect(res).toMatchObject({
        id: SHIPMENT,
        statusConceptId: CONCEPTS.TRACK_IN_TRANSIT,
        eventId: 'event-1',
      });
      expect(shipment.statusConceptId).toBe(CONCEPTS.TRACK_IN_TRANSIT);
      expect(d.trackingRepo.findSubjectForUpdate).toHaveBeenCalledWith(
        d.tx,
        SUBJECT,
        TENANT,
      );
    });

    it('Límite: el mensajero asignado registra la entrega permitida', async () => {
      const d = build();
      const shipment = liveShipment({ assignedCourierUserId: COURIER });
      const subject = openSubject();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(shipment);
      d.trackingRepo.findVerifiedProof.mockResolvedValue(null);
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(subject);
      d.trackingRepo.findMilestonesBySubjectType.mockResolvedValue([]);
      d.trackingRepo.createDeliveryProof.mockReturnValue({ id: 'proof-1' });
      d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });

      const res = await d.service.recordDeliveryProof(
        SHIPMENT,
        { proofType: 'PHOTO', photoFileId: FILE } as any,
        courierActor,
      );

      expect(res.shipmentStatusConceptId).toBe(CONCEPTS.TRACK_DELIVERED);
      expect(shipment.statusConceptId).toBe(CONCEPTS.TRACK_DELIVERED);
    });

    it.each([
      [
        'recordDeliveryProof',
        (s: TrackingService) =>
          s.recordDeliveryProof(
            SHIPMENT,
            { proofType: 'PHOTO', photoFileId: FILE } as any,
            courierActor,
          ),
      ],
      [
        'recordException',
        (s: TrackingService) =>
          s.recordException(
            SHIPMENT,
            { reason: 'puerta cerrada' } as any,
            courierActor,
          ),
      ],
      [
        'recordHandoff',
        (s: TrackingService) =>
          s.recordHandoff(
            SHIPMENT,
            {
              handoffType: 'TRANSFER',
              fromPartyType: 'x',
              toPartyType: 'y',
            } as any,
            courierActor,
          ),
      ],
      [
        'cancelShipment',
        (s: TrackingService) =>
          s.cancelShipment(
            SHIPMENT,
            { reason: 'anulado' } as any,
            courierActor,
          ),
      ],
    ])(
      'Catálogo: un mensajero no asignado intenta %s y recibe 403 sin escritura',
      async (_name, run) => {
        const d = build();
        d.trackingRepo.findShipmentForUpdate.mockResolvedValue(
          liveShipment({ assignedCourierUserId: 'otro-mensajero' }),
        );

        const error = await failure(run(d.service));

        expect(error).toBeInstanceOf(InsufficientRoleException);
        expect(error.getStatus()).toBe(403);
        expect(error.reason).toBe(TrackingErrorReason.SHIPMENT_ACCESS_DENIED);
        expect(d.trackingRepo.findSubjectForUpdate).not.toHaveBeenCalled();
        expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
        expect(d.trackingRepo.createDeliveryProof).not.toHaveBeenCalled();
        expect(d.trackingRepo.createHandoff).not.toHaveBeenCalled();
        expect(d.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('Catálogo: un mensajero no asignado no registra eventos sobre el sujeto', async () => {
      const d = build();
      d.trackingRepo.findSubjectForUpdate.mockResolvedValue(openSubject());
      d.trackingRepo.findShipmentBySubject.mockResolvedValue(
        liveShipment({ assignedCourierUserId: 'otro-mensajero' }),
      );

      const error = await failure(
        d.service.recordEvent(
          SUBJECT,
          { status: 'IN_TRANSIT' } as any,
          courierActor,
        ),
      );

      expect(error.reason).toBe(TrackingErrorReason.SHIPMENT_ACCESS_DENIED);
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    });

    it('un rol de operador concedido sólo en otro tenant no opera en este', async () => {
      const d = build();
      d.trackingRepo.findShipmentForUpdate.mockResolvedValue(liveShipment());
      const elsewhere = {
        id: 'op-2',
        roles: ['LOGISTICS_OPERATOR'],
        scopedRoles: { [OTHER_TENANT]: ['LOGISTICS_OPERATOR'] },
      };

      const error = await failure(
        d.service.cancelShipment(SHIPMENT, { reason: 'x' } as any, elsewhere),
      );

      expect(error.reason).toBe(TrackingErrorReason.SHIPMENT_ACCESS_DENIED);
      expect(d.trackingRepo.createEvent).not.toHaveBeenCalled();
    });

    it('SUPERADMIN acotado a otro tenant no opera en éste; acotado a éste o global sí (#1241)', async () => {
      const scopedTo = (tenantId: string) => ({
        id: 'sa-1',
        roles: ['SUPERADMIN'],
        scopedRoles: { [tenantId]: ['SUPERADMIN'] },
      });

      const denied = build();
      denied.trackingRepo.findShipmentForUpdate.mockResolvedValue(
        liveShipment(),
      );
      const error = await failure(
        denied.service.cancelShipment(
          SHIPMENT,
          { reason: 'x' } as any,
          scopedTo(OTHER_TENANT),
        ),
      );
      expect(error.reason).toBe(TrackingErrorReason.SHIPMENT_ACCESS_DENIED);
      expect(denied.trackingRepo.createEvent).not.toHaveBeenCalled();

      for (const who of [
        scopedTo(TENANT),
        { id: 'sa-g', roles: ['SUPERADMIN'] },
      ]) {
        const d = build();
        d.trackingRepo.findShipmentForUpdate.mockResolvedValue(liveShipment());
        d.trackingRepo.findSubjectForUpdate.mockResolvedValue(openSubject());
        d.trackingRepo.createEvent.mockReturnValue({ id: 'event-1' });
        const res = await d.service.cancelShipment(
          SHIPMENT,
          { reason: 'x' } as any,
          who,
        );
        expect(res).toMatchObject({
          statusConceptId: CONCEPTS.TRACK_CANCELLED,
        });
      }
    });

    it('el tenant del cuerpo no cuenta: el sujeto y el envío se abren en el del contexto', async () => {
      const d = build();
      d.trackingRepo.findOpenSubjectByRef.mockResolvedValue(null);
      d.trackingRepo.findSubjectByTrackingNumber.mockResolvedValue(null);
      d.trackingRepo.countShipments.mockResolvedValue(0);
      d.trackingRepo.findShipmentByNumber.mockResolvedValue(null);
      d.trackingRepo.createSubject.mockReturnValue({ id: SUBJECT });
      d.trackingRepo.createShipment.mockReturnValue({ id: SHIPMENT });

      await d.service.openSubject(
        {
          subjectType: 'SPECIMEN',
          subjectRefType: 'lab_specimen',
          subjectRefId: REF,
          tenantId: OTHER_TENANT,
        } as any,
        actor,
      );

      expect(d.trackingRepo.findOpenSubjectByRef).toHaveBeenCalledWith(
        d.tx,
        'lab_specimen',
        REF,
        CONCEPTS.SUBJECT_OPEN,
        TENANT,
      );
      expect(d.trackingRepo.createSubject).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
      expect(d.trackingRepo.createShipment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('sin tenant en el contexto falla cerrado (412) y no consulta', async () => {
      const d = build();

      const error = await d.raw
        .cancelShipment(SHIPMENT, { reason: 'x' } as any, actor)
        .catch((e) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.trackingRepo.findShipmentForUpdate).not.toHaveBeenCalled();
    });
  });
});
