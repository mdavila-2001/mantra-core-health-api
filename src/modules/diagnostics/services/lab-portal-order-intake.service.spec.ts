import { describe, expect, it, jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { ServiceRequests } from '../../clinical/entities';
import { LabPortalOrderIntakeService } from './lab-portal-order-intake.service';
import { LAB, actor, mockFn, order, view } from './lab-portal-orders.testing';

type Row = Record<string, unknown>;

function build(opts: {
  rows?: Row[];
  patient?: Row | null;
  found?: Row | null;
  status?: string;
}) {
  const created: Row = { id: 'sr-new', statusConceptId: 'active' };
  const found = opts.found === undefined ? order() : opts.found;
  const tx = {
    findOne: mockFn(async () =>
      opts.patient === undefined ? { profileId: 'pat-1' } : opts.patient,
    ),
    create: mockFn((_entity: unknown, data: unknown) =>
      Object.assign(created, data),
    ),
    assign: mockFn((target: unknown, data: unknown) =>
      Object.assign(target as Row, data),
    ),
    flush: mockFn(async () => undefined),
    execute: mockFn(async () => opts.rows ?? []),
  };
  const em = {
    transactional: mockFn(async (cb) => (cb as (t: unknown) => unknown)(tx)),
    fork: () => tx,
  };
  const repo = { findOrder: mockFn(async () => found) };
  const labels = {
    findPatientLabels: mockFn(
      async () =>
        new Map([['pat-1', { displayName: 'Ana Pérez', patientCode: 'P-1' }]]),
    ),
  };
  const detail = {
    prepare: mockFn(async () => ({
      categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      componentConceptIds: [],
    })),
  };
  const snapshot = {
    load: mockFn(async (_em: unknown, _t: unknown, orders: unknown) => ({
      orders: (orders as Row[]).map((o) =>
        view(opts.status ?? 'DRAFT', { order: o }),
      ),
      files: [],
    })),
  };
  const drafts = { findByOrders: mockFn(async () => []) };
  const outbox = { publishDomainEvent: mockFn(async () => undefined) };
  const logger = { setContext: jest.fn(), info: jest.fn() };
  const service = new LabPortalOrderIntakeService(
    em as never,
    repo as never,
    labels as never,
    detail as never,
    snapshot as never,
    drafts as never,
    outbox as never,
    logger as never,
  );
  return { service, tx, repo, detail, outbox, created };
}

describe('LabPortalOrderIntakeService.lookupPatient', () => {
  it('the only patient with that national id, with a name to confirm', async () => {
    const t = build({ rows: [{ profile_id: 'pat-1' }] });
    await expect(t.service.lookupPatient(' 1234567 ')).resolves.toEqual({
      patientProfileId: 'pat-1',
      displayName: 'Ana Pérez',
      patientCode: 'P-1',
    });
    expect(t.tx.execute).toHaveBeenCalledWith(
      expect.stringContaining('common.identifiers'),
      expect.arrayContaining(['1234567']),
    );
  });

  it('nobody holds it: 404', async () => {
    const t = build({ rows: [] });
    await expect(t.service.lookupPatient('999')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('two patients hold it: 409, never a guess', async () => {
    const t = build({ rows: [{ profile_id: 'a' }, { profile_id: 'b' }] });
    await expect(t.service.lookupPatient('1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('LabPortalOrderIntakeService.create', () => {
  const dto = {
    patientProfileId: 'pat-1',
    codeConceptId: 'hemograma',
    category: 'LAB' as const,
    externalRequesterName: ' Dra. Rojas ',
  };

  it('the center is custodian and performer; no encounter, no platform requester', async () => {
    const t = build({});
    const result = await t.service.create(LAB, dto, actor);
    expect(t.tx.create).toHaveBeenCalledWith(
      ServiceRequests,
      expect.objectContaining({
        custodianTenantId: LAB,
        performerTenantId: LAB,
        patientProfileId: 'pat-1',
        registeredByPerformer: true,
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        externalRequesterName: 'Dra. Rojas',
        externalRequesterLicense: null,
        createdByUserId: actor.id,
      }),
      { partial: true },
    );
    const data = t.tx.create.mock.calls[0][1] as Row;
    expect(data).not.toHaveProperty('encounterId');
    expect(data).not.toHaveProperty('requesterProfileId');
    expect(t.outbox.publishDomainEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: LAB,
        eventType: 'ServiceRequestPlaced',
      }),
    );
    expect(t.detail.prepare).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        codeConceptId: 'hemograma',
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      }),
    );
    expect(t.repo.findOrder).toHaveBeenCalledWith(
      expect.anything(),
      LAB,
      'sr-new',
    );
    expect(result.status).toBe('DRAFT');
  });

  it('an unknown patient: 422 before writing anything', async () => {
    const t = build({ patient: null });
    await expect(t.service.create(LAB, dto, actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(t.tx.create).not.toHaveBeenCalled();
  });
});

describe('LabPortalOrderIntakeService.update', () => {
  const dto = { codeConceptId: 'glucosa', category: 'LAB' as const };

  it('replaces the editable fields of its own order still in draft', async () => {
    const own = order({ registeredByPerformer: true, priorityConceptId: 'p' });
    const t = build({ found: own });
    const result = await t.service.update(LAB, 'sr-1', dto, actor);
    expect(t.tx.assign).toHaveBeenCalledWith(
      own,
      expect.objectContaining({
        codeConceptId: 'glucosa',
        priorityConceptId: null,
        externalRequesterName: null,
        updatedByUserId: actor.id,
      }),
    );
    expect(result.canEdit).toBe(true);
  });

  it("a practitioner's order: 409", async () => {
    const t = build({ found: order({ registeredByPerformer: false }) });
    await expect(
      t.service.update(LAB, 'sr-1', dto, actor),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(t.tx.assign).not.toHaveBeenCalled();
  });

  it('its own order already received: 409', async () => {
    const t = build({
      found: order({ registeredByPerformer: true }),
      status: 'RECEIVED',
    });
    await expect(
      t.service.update(LAB, 'sr-1', dto, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('an order of another center: 404', async () => {
    const t = build({ found: null });
    await expect(
      t.service.update(LAB, 'sr-1', dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
