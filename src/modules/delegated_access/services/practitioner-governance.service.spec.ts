import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type {
  PendingApprovalRow,
  PractitionerGovernanceRepository,
} from '../repositories/practitioner-governance.repository';
import type { SupportLinksRepository } from '../repositories/support-links.repository';
import {
  PractitionerGovernanceService,
  approvalSummary,
  decodeApprovalsCursor,
  encodeApprovalsCursor,
} from './practitioner-governance.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const DOCTOR = {
  id: 'u-doctor',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pp-1',
} as unknown as AuthenticatedUser;

const ANA = {
  supportUserId: 'u-ana',
  supportName: 'Ana Gutiérrez',
  tenantId: 't-1',
  kind: 'PRACTITIONER',
  practitionerProfileId: 'pp-1',
};
const KEY_ANA = { userId: 'u-ana', tenantId: 't-1' };

function row(over: Partial<PendingApprovalRow> = {}): PendingApprovalRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    tenantId: 't-1',
    kindCode: 'delegated_access:FOUR_EYES_KIND_ACTION',
    requesterUserId: 'u-ana',
    subjectUserId: 'u-ana',
    permissionCode: 'appointments.cancel',
    reasonText: 'El paciente no puede venir',
    createdAt: new Date('2026-11-03T10:00:00Z'),
    expiresAt: new Date('2026-11-04T10:00:00Z'),
    ...over,
  };
}

describe('PractitionerGovernanceService', () => {
  let repo: Record<
    'countPendingReviews' | 'findOpenAnomalies' | 'findPendingForDoctor',
    any
  >;
  let links: { findLinks: any };
  let service: PractitionerGovernanceService;

  beforeEach(() => {
    repo = {
      countPendingReviews: fn().mockResolvedValue(3),
      findOpenAnomalies: fn().mockResolvedValue([]),
      findPendingForDoctor: fn().mockResolvedValue([]),
    };
    links = { findLinks: fn().mockResolvedValue([ANA]) };
    const em = { fork: () => ({}) } as unknown as EntityManager;
    service = new PractitionerGovernanceService(
      em,
      repo as unknown as PractitionerGovernanceRepository,
      links as unknown as SupportLinksRepository,
    );
  });

  describe('panel', () => {
    it('cuenta las revisiones del doctor y limita las alertas a su equipo activo', async () => {
      repo.findOpenAnomalies.mockResolvedValue([
        {
          id: 'an-1',
          userId: 'u-ana',
          kindCode: 'delegated_access:ANOMALY_CANCEL_SPIKE',
          windowStart: new Date('2026-11-03T08:00:00Z'),
          observed: 30,
          threshold: 20,
        },
      ]);
      const panel = await service.panel(DOCTOR);
      expect(links.findLinks).toHaveBeenCalledWith(expect.anything(), {
        practitionerProfileId: 'pp-1',
        statuses: ['ACTIVE'],
      });
      expect(links.findLinks).toHaveBeenCalledWith(expect.anything(), {
        supportUserId: 'u-ana',
        statuses: ['ACTIVE'],
      });
      expect(repo.countPendingReviews).toHaveBeenCalledWith(
        expect.anything(),
        'u-doctor',
      );
      expect(repo.findOpenAnomalies).toHaveBeenCalledWith(
        expect.anything(),
        [KEY_ANA],
        expect.any(Number),
      );
      expect(panel).toMatchObject({
        pendingReviews: 3,
        team: [],
        openAnomalies: [
          {
            id: 'an-1',
            userId: 'u-ana',
            kindConceptId: 'ANOMALY_CANCEL_SPIKE',
            windowStart: '2026-11-03T08:00:00.000Z',
            observed: 30,
            threshold: 20,
          },
        ],
      });
    });

    it('sin perfil profesional no busca equipo y responde vacío', async () => {
      const sinPerfil = { ...DOCTOR, practitionerProfileId: undefined };
      repo.countPendingReviews.mockResolvedValue(0);
      const panel = await service.panel(sinPerfil as AuthenticatedUser);
      expect(links.findLinks).not.toHaveBeenCalled();
      expect(repo.findOpenAnomalies).toHaveBeenCalledWith(
        expect.anything(),
        [],
        expect.any(Number),
      );
      expect(panel).toMatchObject({ pendingReviews: 0, openAnomalies: [] });
    });
  });

  describe('pendingApprovals', () => {
    it('devuelve lo que pide su equipo con el nombre de quien pide', async () => {
      repo.findPendingForDoctor.mockResolvedValue([row()]);
      const page = await service.pendingApprovals(DOCTOR, {});
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctorUserId: 'u-doctor',
          team: [KEY_ANA],
          limit: 51,
        }),
      );
      expect(page.count).toBe(1);
      expect(page.nextCursor).toBeNull();
      expect(page.items[0]).toMatchObject({
        kind: 'ACTION',
        status: 'PENDING',
        approverKind: 'DOCTOR_OWNER',
        atom: 'appointments.cancel',
        summary: 'Ana Gutiérrez pide permiso para appointments.cancel.',
      });
    });

    it('pagina: pide una fila de más y devuelve el cursor de la última de la página', async () => {
      const filas = [
        row({ id: '00000000-0000-4000-8000-000000000003' }),
        row({ id: '00000000-0000-4000-8000-000000000002' }),
        row({ id: '00000000-0000-4000-8000-000000000001' }),
      ];
      repo.findPendingForDoctor.mockResolvedValue(filas);
      const page = await service.pendingApprovals(DOCTOR, { limit: 2 });
      expect(page.items.map((i) => i.id)).toEqual([
        '00000000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000002',
      ]);
      expect(decodeApprovalsCursor(page.nextCursor!)).toEqual({
        createdAt: filas[1]!.createdAt,
        id: '00000000-0000-4000-8000-000000000002',
      });
    });

    it('sin equipo no consulta aprobaciones ajenas', async () => {
      links.findLinks.mockResolvedValue([]);
      await service.pendingApprovals(DOCTOR, {});
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ team: [] }),
      );
    });

    it('una persona que también apoya a otro doctor no entra: no se sabe de cuál agenda es lo que pasó', async () => {
      links.findLinks.mockImplementation(async (_em: unknown, f: any) =>
        f.supportUserId
          ? [ANA, { ...ANA, practitionerProfileId: 'pp-otro' }]
          : [ANA],
      );
      await service.pendingApprovals(DOCTOR, {});
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ team: [] }),
      );
      await service.panel(DOCTOR);
      expect(repo.findOpenAnomalies).toHaveBeenCalledWith(
        expect.anything(),
        [],
        expect.any(Number),
      );
    });

    it('un vínculo de lugar de la misma persona no la deja fuera', async () => {
      links.findLinks.mockImplementation(async (_em: unknown, f: any) =>
        f.supportUserId
          ? [ANA, { ...ANA, kind: 'LOCATION', practitionerProfileId: null }]
          : [ANA],
      );
      await service.pendingApprovals(DOCTOR, {});
      expect(repo.findPendingForDoctor).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ team: [KEY_ANA] }),
      );
    });

    it('un cursor que no es nuestro es un pedido mal hecho', async () => {
      await expect(
        service.pendingApprovals(DOCTOR, { cursor: 'basura' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('frases y cursor', () => {
    it('cada tipo dice qué pide; uno desconocido pide aprobación sin inventar', () => {
      expect(approvalSummary('GRANT_CHANGE', 'Ana', 'schedule.view')).toBe(
        'Ana pide un cambio de permisos (schedule.view).',
      );
      expect(approvalSummary('ACTION', 'Ana', null)).toBe(
        'Ana pide permiso para una acción.',
      );
      expect(approvalSummary('OTRO', 'Ana', null)).toBe(
        'Ana pide su aprobación.',
      );
    });

    it('el cursor va y vuelve', () => {
      const r = row();
      expect(decodeApprovalsCursor(encodeApprovalsCursor(r))).toEqual({
        createdAt: r.createdAt,
        id: r.id,
      });
    });
  });
});
