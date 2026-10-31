import { jest } from '@jest/globals';
import { PractitionerSupportService } from './practitioner-support.service';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';
import { namesRepoDouble } from './support-names.testing';
import { STATUS } from './concept-maps';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const PEREZ = {
  id: 'user-perez',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-perez',
} as any;
const ROJAS = {
  id: 'user-rojas',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-rojas',
} as any;

/** Construye el servicio con repositorios en doble. */
function build(delegateOverrides: Record<string, unknown> = {}) {
  const delegate: any = {
    id: 'del-1',
    practitionerRoleAssignmentId: 'pra-perez',
    delegateUserAssignmentId: 'eng-ana',
    statusConceptId: STATUS.ACTIVE,
    acceptedAt: undefined,
    mayReplyOnBehalf: false,
    ...delegateOverrides,
  };
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const delegatesRepo = { findById: mockFn().mockResolvedValue(delegate) };
  const access = {
    findRoleAssignments: mockFn().mockResolvedValue(
      new Map([
        [
          'pra-perez',
          {
            id: 'pra-perez',
            practitionerProfileId: 'prof-perez',
            tenantId: TENANT,
          },
        ],
      ]),
    ),
    findRoleAssignmentsOfPractitioner: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findEngagements: mockFn().mockResolvedValue([
      {
        assignment: { id: 'eng-ana', roleTemplateId: 'tpl' },
        tenantId: TENANT,
        userId: 'user-ana',
      },
    ]),
  };
  const engagements = {
    findDelegationsOfDoctor: mockFn().mockResolvedValue([delegate]),
  };
  const templates = {
    findById: mockFn().mockResolvedValue({ code: 'SECRETARY' }),
  };
  const effective = {
    refreshTenant: mockFn().mockResolvedValue({}),
    previewForDoctor: mockFn().mockResolvedValue(
      new Map([['user-ana', new Set(['schedule.view', 'schedule.create'])]]),
    ),
  };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const approvalRequests = {
    findOpenByDelegates: mockFn().mockResolvedValue([
      {
        id: 'ar-1',
        practitionerDelegateAssignmentId: 'del-1',
        patientProfileId: 'pat-1',
        encounterId: undefined,
        reasonText: 'Necesito el motivo para reprogramar',
        createdAt: new Date('2026-10-30'),
      },
    ]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PractitionerSupportService(
    em as any,
    delegatesRepo as any,
    access as any,
    engagements as any,
    templates as any,
    effective as any,
    scope,
    logger as any,
    approvalRequests as any,
    namesRepoDouble(mockFn) as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return { service, delegate, access, effective, approvalRequests, inTenant };
}

describe('PractitionerSupportService', () => {
  describe('accept', () => {
    it('el doctor acepta una vez: queda la fecha, el permiso de responder y la divulgación por defecto', async () => {
      const d = build();
      await d.inTenant(() =>
        d.service.accept(
          'del-1',
          { acceptsSupportClause: true, mayReplyOnBehalf: true } as any,
          PEREZ,
        ),
      );
      expect(d.delegate.acceptedAt).toBeInstanceOf(Date);
      expect(d.delegate.mayReplyOnBehalf).toBe(true);
      expect(d.delegate.replyDisclosureConceptId).toBe(
        DELEG.REPLY_DISCLOSURE_SHOW,
      );
      expect(d.effective.refreshTenant).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ userId: 'user-ana' }),
      );
    });

    it('aceptar de nuevo no cambia la fecha de la primera aceptación', async () => {
      const first = new Date('2026-02-01');
      const d = build({ acceptedAt: first });
      await d.inTenant(() =>
        d.service.accept('del-1', { acceptsSupportClause: true } as any, PEREZ),
      );
      expect(d.delegate.acceptedAt).toBe(first);
    });

    it('un doctor ajeno recibe 404 uniforme: solo toca lo suyo', async () => {
      const d = build();
      await expect(
        d.inTenant(() =>
          d.service.accept(
            'del-1',
            { acceptsSupportClause: true } as any,
            ROJAS,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_DELEGATE_NOT_FOUND });
      expect(d.delegate.acceptedAt).toBeUndefined();
    });

    it('una delegación de otra organización responde como inexistente', async () => {
      const d = build();
      d.access.findEngagements.mockResolvedValue([]);
      await expect(
        d.inTenant(() =>
          d.service.accept(
            'del-1',
            { acceptsSupportClause: true } as any,
            PEREZ,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no se acepta una delegación revocada', async () => {
      const d = build({ statusConceptId: STATUS.REVOKED });
      await expect(
        d.inTenant(() =>
          d.service.accept(
            'del-1',
            { acceptsSupportClause: true } as any,
            PEREZ,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
    });
  });

  describe('replySettings', () => {
    it('el doctor oculta «respondido por su equipo» y retira el permiso de responder', async () => {
      const d = build({ mayReplyOnBehalf: true });
      await d.inTenant(() =>
        d.service.replySettings(
          'del-1',
          { mayReplyOnBehalf: false, replyDisclosure: 'HIDE' },
          PEREZ,
        ),
      );
      expect(d.delegate.mayReplyOnBehalf).toBe(false);
      expect(d.delegate.replyDisclosureConceptId).toBe(
        DELEG.REPLY_DISCLOSURE_HIDE,
      );
    });

    it('sin cambios que aplicar es una precondición fallida', async () => {
      const d = build();
      await expect(
        d.inTenant(() => d.service.replySettings('del-1', {}, PEREZ)),
      ).rejects.toThrow();
    });
  });

  describe('supportTeam', () => {
    it('lista su equipo con el estado de aceptación y las acciones que le tocan', async () => {
      const d = build();
      const team = await d.inTenant(() => d.service.supportTeam(PEREZ));
      expect(team.count).toBe(1);
      expect(team.items[0]).toMatchObject({
        delegateId: 'del-1',
        userId: 'user-ana',
        practitionerRoleAssignmentId: 'pra-perez',
        roleTemplateCode: 'SECRETARY',
        accepted: false,
        replyDisclosure: 'SHOW',
        actions: ['schedule.create', 'schedule.view'],
      });
    });

    it('trae lo que usa la pantalla del doctor: nombres, rol en los dos nombres, alcance resumido, actividad y pedidos clínicos con etiqueta corta', async () => {
      const d = build();
      const names = (d.service as any).activity;
      names.userNames.mockResolvedValue(
        new Map([['user-ana', 'Ana Gutiérrez']]),
      );
      names.tenantNames.mockResolvedValue(
        new Map([[TENANT, 'Hospital Piloto Mantra']]),
      );
      names.profileNames.mockResolvedValue(
        new Map([['pat-1', 'Juan Carlos Pérez Rojas']]),
      );
      names.lastActivity.mockResolvedValue(
        new Map([[`${TENANT}|user-ana`, new Date('2026-10-29T15:00:00Z')]]),
      );
      const { items } = await d.inTenant(() => d.service.supportTeam(PEREZ));
      expect(items[0]).toMatchObject({
        personName: 'Ana Gutiérrez',
        tenantId: TENANT,
        organizationName: 'Hospital Piloto Mantra',
        roleTemplateCode: 'SECRETARY',
        roleTemplate: 'SECRETARY',
        status: 'PENDING_ACCEPTANCE',
        delegateStatus: 'ACTIVE',
        coverageSummary: 'Crear citas, ver la agenda',
        lastActivityAt: new Date('2026-10-29T15:00:00Z'),
        pendingClinicalRequests: [
          {
            requestId: 'ar-1',
            patientLabel: 'Juan R.',
            reasonText: 'Necesito el motivo para reprogramar',
            requestedAt: new Date('2026-10-30'),
            requestedHours: 24,
          },
        ],
      });
      // Nunca el nombre completo del paciente.
      expect(JSON.stringify(items)).not.toContain('Juan Carlos');
    });

    it('el estado para el doctor: espera su aceptación, activo, o ya no integra el equipo', async () => {
      const status = async (over: Record<string, unknown>): Promise<string> => {
        const d = build(over);
        const { items } = await d.inTenant(() => d.service.supportTeam(PEREZ));
        return items[0].status;
      };
      expect(await status({})).toBe('PENDING_ACCEPTANCE');
      expect(await status({ acceptedAt: new Date() })).toBe('ACTIVE');
      expect(
        await status({
          acceptedAt: new Date(),
          statusConceptId: STATUS.REVOKED,
        }),
      ).toBe('REVOKED');
      expect(
        await status({
          acceptedAt: new Date(),
          statusConceptId: STATUS.SUSPENDED,
        }),
      ).toBe('REVOKED');
      const d = build({ statusConceptId: STATUS.SUSPENDED });
      const { items } = await d.inTenant(() => d.service.supportTeam(PEREZ));
      expect(items[0].delegateStatus).toBe('SUSPENDED');
    });

    it('sin permisos vigentes sobre su agenda lo dice, y sin pedidos no hay nada que decidir', async () => {
      const d = build();
      d.effective.previewForDoctor.mockResolvedValue(new Map());
      d.approvalRequests.findOpenByDelegates.mockResolvedValue([]);
      const { items } = await d.inTenant(() => d.service.supportTeam(PEREZ));
      expect(items[0].coverageSummary).toBe(
        'Sin permisos vigentes sobre su agenda',
      );
      expect(items[0].pendingClinicalRequests).toEqual([]);
      expect(items[0].lastActivityAt).toBeUndefined();
    });

    it('una cuenta sin perfil profesional no tiene equipo', async () => {
      const d = build();
      await expect(
        d.inTenant(() =>
          d.service.supportTeam({ id: 'x', roles: ['PRACTITIONER'] } as any),
        ),
      ).rejects.toThrow();
    });
  });

  describe('accessRequests (caso 10: lo que el doctor decide)', () => {
    it('lista las solicitudes abiertas de las delegaciones del doctor, con quién pide y para qué', async () => {
      const d = build();
      const res = await d.inTenant(() => d.service.accessRequests(PEREZ));
      expect(res.count).toBe(1);
      expect(res.items[0]).toMatchObject({
        id: 'ar-1',
        delegateId: 'del-1',
        userId: 'user-ana',
        patientProfileId: 'pat-1',
        reasonText: 'Necesito el motivo para reprogramar',
      });
      // Solo las delegaciones de ESTE doctor.
      expect(d.approvalRequests.findOpenByDelegates).toHaveBeenCalledWith(
        expect.anything(),
        ['del-1'],
        expect.any(String),
      );
    });

    it('un doctor sin delegaciones no recibe nada', async () => {
      const d = build();
      d.approvalRequests.findOpenByDelegates.mockResolvedValue([]);
      const res = await d.inTenant(() => d.service.accessRequests(PEREZ));
      expect(res).toEqual({ items: [], count: 0 });
    });
  });
});
