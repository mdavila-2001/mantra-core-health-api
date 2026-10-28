import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import { PractitionerInsurerRequestsService } from './practitioner-insurer-requests.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PROFILE = 'prof-1';
const CARRIER_A = '11111111-1111-4111-8111-111111111111';
const CARRIER_B = '22222222-2222-4222-8222-222222222222';
const doctor = { id: 'u-doc', practitionerProfileId: PROFILE } as any;
const noProfile = { id: 'u-sin' } as any;
const insurerUser = { id: 'u-ins' } as any;

interface Row {
  id: string;
  practitionerProfileId: string;
  insuranceCarrierId: string;
  statusConceptId: string;
  decisionReasonText?: string;
  decidedAt?: Date;
  decidedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedByUserId?: string;
}

function build(options: { rows?: Row[]; carriers?: any[] } = {}) {
  const rows: Row[] = options.rows ?? [];
  const carriers = options.carriers ?? [
    {
      id: CARRIER_A,
      legalName: 'Alianza Vida S.A.',
      sigla: 'Alianza',
      statusConceptId: INS.CARRIER_ACTIVE,
    },
    {
      id: CARRIER_B,
      legalName: 'Nacional Vida S.A.',
      statusConceptId: INS.CARRIER_ACTIVE,
    },
  ];
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: () => tx,
    transactional: (fn: (t: unknown) => unknown) => fn(tx),
  };
  let seq = 0;
  const repo = {
    findCarriers: mockFn((_: unknown, ids: string[]) =>
      Promise.resolve(carriers.filter((c) => ids.includes(c.id))),
    ),
    findPair: mockFn((_: unknown, profile: string, carrier: string) =>
      Promise.resolve(
        rows.find(
          (r) =>
            r.practitionerProfileId === profile &&
            r.insuranceCarrierId === carrier,
        ) ?? null,
      ),
    ),
    create: mockFn((_: unknown, data: any) => {
      const row: Row = {
        id: `req-${++seq}`,
        practitionerProfileId: data.practitionerProfileId,
        insuranceCarrierId: data.insuranceCarrierId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date('2026-10-28T10:00:00Z'),
        updatedAt: new Date('2026-10-28T10:00:00Z'),
      };
      rows.push(row);
      return row;
    }),
    listByPractitioner: mockFn((_: unknown, profile: string) =>
      Promise.resolve(rows.filter((r) => r.practitionerProfileId === profile)),
    ),
    findOwn: mockFn((_: unknown, id: string, profile: string) =>
      Promise.resolve(
        rows.find((r) => r.id === id && r.practitionerProfileId === profile) ??
          null,
      ),
    ),
    listByCarrier: mockFn((_: unknown, carrier: string, states: string[]) =>
      Promise.resolve(
        rows.filter(
          (r) =>
            r.insuranceCarrierId === carrier &&
            states.includes(r.statusConceptId),
        ),
      ),
    ),
    findForCarrier: mockFn((_: unknown, id: string, carrier: string) =>
      Promise.resolve(
        rows.find((r) => r.id === id && r.insuranceCarrierId === carrier) ??
          null,
      ),
    ),
    findPractitionerCards: mockFn((_: unknown, ids: string[]) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            { displayName: 'Dra. Ana Rojas', professionalTitle: 'Médica' },
          ]),
        ),
      ),
    ),
  };
  const insurerContext = {
    resolve: mockFn().mockResolvedValue({
      carrierId: CARRIER_A,
      tenantId: 't-a',
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PractitionerInsurerRequestsService(
    em as never,
    repo as never,
    insurerContext as never,
    logger as never,
  );
  return { service, repo, rows, tx, insurerContext };
}

function row(over: Partial<Row>): Row {
  return {
    id: 'req-x',
    practitionerProfileId: PROFILE,
    insuranceCarrierId: CARRIER_A,
    statusConceptId: INS.PRACTITIONER_REQUEST_PENDING,
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T10:00:00Z'),
    ...over,
  };
}

describe('PractitionerInsurerRequestsService', () => {
  describe('requestWithin (el alta y el pedido desde la cuenta)', () => {
    it('crea una solicitud PENDIENTE por aseguradora, sin repetir las duplicadas del envío', async () => {
      const d = build();

      const result = await d.service.requestWithin(d.tx as never, {
        practitionerProfileId: PROFILE,
        carrierIds: [CARRIER_A, CARRIER_B, CARRIER_A],
        actorUserId: 'u-doc',
      });

      expect(result.requested).toHaveLength(2);
      expect(d.rows.map((r) => r.statusConceptId)).toEqual([
        INS.PRACTITIONER_REQUEST_PENDING,
        INS.PRACTITIONER_REQUEST_PENDING,
      ]);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rechaza el envío entero si alguna aseguradora no existe o no está activa', async () => {
      const d = build({
        carriers: [
          { id: CARRIER_A, legalName: 'A', statusConceptId: 'otro-estado' },
        ],
      });

      await expect(
        d.service.requestWithin(d.tx as never, {
          practitionerProfileId: PROFILE,
          carrierIds: [CARRIER_A, CARRIER_B],
          actorUserId: 'u-doc',
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('no toca lo pendiente o aprobado, y reabre lo rechazado sin el motivo anterior', async () => {
      const aprobada = row({
        id: 'req-a',
        statusConceptId: INS.PRACTITIONER_REQUEST_APPROVED,
      });
      const rechazada = row({
        id: 'req-b',
        insuranceCarrierId: CARRIER_B,
        statusConceptId: INS.PRACTITIONER_REQUEST_REJECTED,
        decisionReasonText: 'Sin convenio',
        decidedAt: new Date('2026-10-02T10:00:00Z'),
        decidedByUserId: 'u-ins',
      });
      const d = build({ rows: [aprobada, rechazada] });

      const result = await d.service.requestWithin(d.tx as never, {
        practitionerProfileId: PROFILE,
        carrierIds: [CARRIER_A, CARRIER_B],
        actorUserId: 'u-doc',
      });

      expect(result.alreadyLive).toEqual([aprobada]);
      expect(result.requested).toEqual([rechazada]);
      expect(rechazada.statusConceptId).toBe(INS.PRACTITIONER_REQUEST_PENDING);
      expect(rechazada.decisionReasonText).toBeUndefined();
      expect(rechazada.decidedAt).toBeUndefined();
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('no hace nada si no se eligió ninguna aseguradora', async () => {
      const d = build();

      await expect(
        d.service.requestWithin(d.tx as never, {
          practitionerProfileId: PROFILE,
          carrierIds: [],
          actorUserId: 'u-doc',
        }),
      ).resolves.toEqual({ requested: [], alreadyLive: [] });
      expect(d.repo.findCarriers).not.toHaveBeenCalled();
    });
  });

  describe('lado del médico', () => {
    it('lista las propias con el nombre comercial de la aseguradora y el estado como clave', async () => {
      const d = build({
        rows: [
          row({ id: 'r1' }),
          row({
            id: 'r2',
            insuranceCarrierId: CARRIER_B,
            statusConceptId: INS.PRACTITIONER_REQUEST_REJECTED,
            decisionReasonText: 'Sin convenio vigente',
          }),
        ],
      });

      const page = await d.service.listOwn(doctor);

      expect(page.count).toBe(2);
      expect(page.items[0]).toMatchObject({
        carrierName: 'Alianza',
        status: 'PENDING',
      });
      expect(page.items[1]).toMatchObject({
        carrierName: 'Nacional Vida S.A.',
        status: 'REJECTED',
        decisionReasonText: 'Sin convenio vigente',
      });
    });

    it('exige perfil profesional', async () => {
      const d = build();
      await expect(d.service.listOwn(noProfile)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('responde 409 si todas las pedidas ya estaban vivas', async () => {
      const d = build({ rows: [row({})] });
      await expect(
        d.service.requestOwn([CARRIER_A], doctor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('retira una pendiente propia', async () => {
      const pendiente = row({ id: 'r1' });
      const d = build({ rows: [pendiente] });

      const dto = await d.service.withdrawOwn('r1', doctor);

      expect(dto.status).toBe('WITHDRAWN');
      expect(pendiente.statusConceptId).toBe(
        INS.PRACTITIONER_REQUEST_WITHDRAWN,
      );
    });

    it('no retira una aprobada', async () => {
      const d = build({
        rows: [
          row({ id: 'r1', statusConceptId: INS.PRACTITIONER_REQUEST_APPROVED }),
        ],
      });
      await expect(d.service.withdrawOwn('r1', doctor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('la de otro médico responde 404, igual que una inexistente', async () => {
      const d = build({
        rows: [row({ id: 'r1', practitionerProfileId: 'otro' })],
      });
      await expect(d.service.withdrawOwn('r1', doctor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('lado de la aseguradora', () => {
    it('lista sólo las de su compañía, pendientes primero, con quién pide', async () => {
      const d = build({
        rows: [
          row({
            id: 'vieja-aprobada',
            statusConceptId: INS.PRACTITIONER_REQUEST_APPROVED,
            decidedAt: new Date('2026-10-05'),
          }),
          row({ id: 'pendiente' }),
          row({ id: 'de-otra', insuranceCarrierId: CARRIER_B }),
          row({
            id: 'retirada',
            statusConceptId: INS.PRACTITIONER_REQUEST_WITHDRAWN,
          }),
        ],
      });

      const page = await d.service.listReceived(insurerUser);

      expect(page.items.map((i) => i.id)).toEqual([
        'pendiente',
        'vieja-aprobada',
      ]);
      expect(page.items[0]).toMatchObject({
        practitionerName: 'Dra. Ana Rojas',
      });
      expect(d.repo.listByCarrier).toHaveBeenCalledWith(
        expect.anything(),
        CARRIER_A,
        expect.not.arrayContaining([INS.PRACTITIONER_REQUEST_WITHDRAWN]),
      );
    });

    it('aprueba: queda el sello con fecha y autor', async () => {
      const pendiente = row({ id: 'r1' });
      const d = build({ rows: [pendiente] });

      const dto = await d.service.approve('r1', insurerUser);

      expect(dto.status).toBe('APPROVED');
      expect(pendiente.decidedByUserId).toBe('u-ins');
      expect(pendiente.decidedAt).toBeInstanceOf(Date);
    });

    it('rechaza con el motivo que lee el médico; un motivo en blanco no se guarda', async () => {
      const a = row({ id: 'r1' });
      const b = row({ id: 'r2' });
      const d = build({ rows: [a, b] });

      await d.service.reject('r1', '  Sin convenio vigente  ', insurerUser);
      await d.service.reject('r2', '   ', insurerUser);

      expect(a.decisionReasonText).toBe('Sin convenio vigente');
      expect(a.statusConceptId).toBe(INS.PRACTITIONER_REQUEST_REJECTED);
      expect(b.decisionReasonText).toBeUndefined();
    });

    it('no decide dos veces', async () => {
      const d = build({
        rows: [
          row({ id: 'r1', statusConceptId: INS.PRACTITIONER_REQUEST_APPROVED }),
        ],
      });
      await expect(
        d.service.reject('r1', undefined, insurerUser),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('la solicitud de otra aseguradora responde 404', async () => {
      const d = build({
        rows: [row({ id: 'r1', insuranceCarrierId: CARRIER_B })],
      });
      await expect(d.service.approve('r1', insurerUser)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
