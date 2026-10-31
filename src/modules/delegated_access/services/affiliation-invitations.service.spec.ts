import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import {
  AffiliationInvitationsService,
  hashCode,
} from './affiliation-invitations.service';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const ANA = { id: 'user-ana', roles: [] } as any;

const invitation = (overrides: Record<string, unknown> = {}): any => ({
  id: 'inv-1',
  tenantId: TENANT,
  kindConceptId: DIR.AFFILIATION_INVITE_KIND_SUPPORT_STAFF,
  statusConceptId: DIR.AFFILIATION_INVITE_ACTIVE,
  expiresAt: new Date(Date.now() + 86_400_000),
  maxUses: 5,
  usesCount: 0,
  roleTemplateId: 'tpl-secretary',
  createdByUserId: 'admin-1',
  ...overrides,
});

/** Construye el servicio con repositorios en doble. */
function build(inv: any = invitation(), counted = true) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    nativeUpdate: mockFn().mockResolvedValue(1),
    // El contador sube en SQL (`uses_count + 1 ... WHERE uses_count < max_uses`):
    // sin fila afectada no quedaba cupo.
    execute: mockFn((sql: string) =>
      Promise.resolve(
        sql.includes('uses_count')
          ? counted
            ? [{ uses_count: 1, max_uses: inv?.maxUses ?? 1 }]
            : []
          : [],
      ),
    ),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const invitations = {
    create: mockFn().mockReturnValue({ id: 'inv-new' }),
    findByTokenHash: mockFn().mockResolvedValue(inv),
    findUseBy: mockFn().mockResolvedValue(null),
    findById: mockFn(),
    recordUse: mockFn(),
  };
  const templates = {
    findEffectiveByCode: mockFn().mockResolvedValue({ id: 'tpl-secretary' }),
    findById: mockFn().mockResolvedValue({
      id: 'tpl-secretary',
      code: 'SECRETARY',
    }),
  };
  const engagements = {
    create: mockFn().mockReturnValue({ id: 'eng-1' }),
    findActiveByMembershipTemplate: mockFn().mockResolvedValue(null),
  };
  const requests = {
    create: mockFn().mockReturnValue({ id: 'req-1' }),
    createItem: mockFn(),
  };
  const directory = {
    ensureActiveStaffMembership: mockFn().mockResolvedValue({ id: 'mem-1' }),
    ensurePendingStaffMembership: mockFn().mockResolvedValue({
      id: 'mem-pend',
      statusConceptId: DIR.MEMBERSHIP_INVITED,
    }),
    findTenant: mockFn().mockResolvedValue({
      id: TENANT,
      tenantTypeConceptId: 'x',
    }),
    findPersonIdOfUser: mockFn().mockResolvedValue('person-ana'),
    findPractitionerProfileIdOfUser: mockFn().mockResolvedValue('person-ana'),
  };
  // La solicitud de afiliación del médico vive en `practice`: práctica y sede
  // donde queda, y la fila `PENDING` que la organización aprueba.
  const affiliations = {
    findTarget: mockFn().mockResolvedValue({
      practiceId: 'practice-1',
      practiceSiteId: 'site-1',
    }),
    ensurePending: mockFn().mockResolvedValue({ id: 'role-pend' }),
  };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AffiliationInvitationsService(
    em as any,
    invitations as any,
    templates as any,
    engagements as any,
    requests as any,
    directory as any,
    scope,
    logger as any,
    affiliations as any,
  );
  return {
    service,
    tx,
    invitations,
    templates,
    engagements,
    requests,
    directory,
    affiliations,
  };
}

describe('AffiliationInvitationsService', () => {
  describe('create', () => {
    it('guarda solo el hash del código y devuelve el código una vez', async () => {
      const d = build();
      const res = await runWithTenant(TENANT, () =>
        d.service.create(
          {
            kind: 'SUPPORT_STAFF',
            roleTemplateCode: 'SECRETARY',
            maxUses: 10,
          } as any,
          ADMIN,
        ),
      );
      const [[, data]] = d.invitations.create.mock.calls;
      expect(data.tokenHash).toBe(hashCode(res.code));
      expect(data.tokenHash).not.toBe(res.code);
      expect(data.maxUses).toBe(10);
      expect(res.code.length).toBeGreaterThanOrEqual(32);
    });

    it('para una persona específica el código es de un solo uso', async () => {
      const d = build();
      await runWithTenant(TENANT, () =>
        d.service.create(
          {
            kind: 'PRACTITIONER',
            targetPersonId: 'person-ana',
            maxUses: 50,
          } as any,
          ADMIN,
        ),
      );
      const [[, data]] = d.invitations.create.mock.calls;
      expect(data.maxUses).toBe(1);
      expect(data.targetPersonId).toBe('person-ana');
    });

    it('un QR de doctor sin persona destino exige que la organización tenga una práctica activa donde dejar las solicitudes', async () => {
      const d = build();
      d.affiliations.findTarget.mockResolvedValue(null);
      await expect(
        runWithTenant(TENANT, () =>
          d.service.create({ kind: 'PRACTITIONER', maxUses: 20 } as any, ADMIN),
        ),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING,
      });
      expect(d.invitations.create).not.toHaveBeenCalled();
      // El código dirigido a una persona no pasa por la práctica: afilia directo.
      await runWithTenant(TENANT, () =>
        d.service.create(
          { kind: 'PRACTITIONER', targetPersonId: 'person-ana' } as any,
          ADMIN,
        ),
      );
      expect(d.invitations.create).toHaveBeenCalledTimes(1);
    });

    it('una invitación de personal de apoyo exige una plantilla que exista', async () => {
      const d = build();
      d.templates.findEffectiveByCode.mockResolvedValue(null);
      await expect(
        runWithTenant(TENANT, () =>
          d.service.create(
            { kind: 'SUPPORT_STAFF', roleTemplateCode: 'SECRETARY' } as any,
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_TEMPLATE_NOT_FOUND });
    });
  });

  describe('redeem', () => {
    it('A2: un código multiuso (sin persona destino) deja una solicitud PENDIENTE y no abre membresía ni vínculo', async () => {
      const d = build();
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res).toEqual({
        kind: 'SUPPORT_STAFF',
        tenantId: TENANT,
        requestId: 'req-1',
        pendingApproval: true,
      });
      expect(d.directory.ensureActiveStaffMembership).not.toHaveBeenCalled();
      expect(d.engagements.create).not.toHaveBeenCalled();
      const [[, request]] = d.requests.create.mock.calls;
      expect(request.statusConceptId).toBe(DELEG.ENGAGEMENT_STATUS_PENDING);
      expect(request.requesterUserId).toBe('user-ana');
      expect(d.requests.createItem).toHaveBeenCalled();
      expect(d.invitations.recordUse).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'inv-1',
        'user-ana',
        DIR.AFFILIATION_USE_ACCEPTED,
      );
    });

    it('un código de un solo uso atado a la persona afilia directo, con origen INVITATION', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res).toEqual({
        kind: 'SUPPORT_STAFF',
        tenantId: TENANT,
        membershipId: 'mem-1',
        engagementId: 'eng-1',
      });
      const [[, data]] = d.engagements.create.mock.calls;
      expect(data.originConceptId).toBe(DELEG.ENGAGEMENT_ORIGIN_INVITATION);
    });

    it('N10c: la invitación de apoyo abre la membresía con origen SUPPORT_ENGAGEMENT', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(d.directory.ensureActiveStaffMembership).toHaveBeenCalledWith(
        expect.anything(),
        'user-ana',
        TENANT,
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        'admin-1',
      );
    });

    it('un canje de la misma persona que choca con el único del modelo (23505) se informa como cualquier rechazo', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      d.tx.flush.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_INVITATION_INVALID });
    });

    it('si ya tiene el vínculo activo con esa plantilla lo devuelve y no abre otro', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      d.engagements.findActiveByMembershipTemplate.mockResolvedValue({
        id: 'eng-previo',
      });
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res.engagementId).toBe('eng-previo');
      expect(d.engagements.create).not.toHaveBeenCalled();
    });

    it('M1: el contador sube en SQL con la condición del cupo, sin usar el valor leído', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      const [sql] = d.tx.execute.mock.calls.find(([text]: [string]) =>
        text.includes('uses_count'),
      );
      expect(sql).toMatch(/uses_count\s*=\s*uses_count\s*\+\s*1/);
      expect(sql).toMatch(/uses_count\s*<\s*max_uses/);
    });

    it('M8: busca la invitación con contexto de sistema acotado y sigue con el tenant de la invitación', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      const sqls = d.tx.execute.mock.calls.map(([text]: [string]) => text);
      expect(sqls[0]).toContain("'app.system_context', 'true'");
      expect(sqls[1]).toContain("'app.system_context', 'false'");
      expect(sqls[2]).toContain('app.current_tenant_id');
      expect(d.tx.execute.mock.calls[2][1]).toEqual([TENANT]);
    });

    it('M1: el canje bloquea la invitación para que dos intentos de la misma persona se serialicen', async () => {
      const d = build(invitation({ targetPersonId: 'person-ana', maxUses: 1 }));
      await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(d.invitations.findByTokenHash).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        { lock: true },
      );
    });

    it('N10: un QR de doctor multiuso (sin persona destino) deja la solicitud PENDIENTE en el flujo de afiliación de la práctica y una membresía pendiente, sin abrir una activa', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
        }),
      );
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res).toEqual({
        kind: 'PRACTITIONER',
        tenantId: TENANT,
        roleAssignmentId: 'role-pend',
        pendingApproval: true,
      });
      expect(d.directory.ensureActiveStaffMembership).not.toHaveBeenCalled();
      expect(d.directory.ensurePendingStaffMembership).toHaveBeenCalledWith(
        expect.anything(),
        'user-ana',
        TENANT,
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        'admin-1',
      );
      // La solicitud la ve y la decide la organización con `role-assignments`:
      // perfil del médico, práctica y sede del destino, y la cuenta que canjeó.
      expect(d.directory.findPractitionerProfileIdOfUser).toHaveBeenCalledWith(
        expect.anything(),
        'user-ana',
      );
      expect(d.affiliations.findTarget).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
      );
      expect(d.affiliations.ensurePending).toHaveBeenCalledWith(
        expect.anything(),
        'person-ana',
        { practiceId: 'practice-1', practiceSiteId: 'site-1' },
        'user-ana',
      );
      expect(d.engagements.create).not.toHaveBeenCalled();
      // El uso se cuenta: el cupo del código se gasta igual.
      expect(d.invitations.recordUse).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'inv-1',
        'user-ana',
        DIR.AFFILIATION_USE_ACCEPTED,
      );
    });

    it('N10: quien ya es miembro activo y canjea un QR de doctor multiuso no queda pendiente ni abre otra solicitud', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
        }),
      );
      d.directory.ensurePendingStaffMembership.mockResolvedValue({
        id: 'mem-activa',
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      });
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res).toEqual({
        kind: 'PRACTITIONER',
        tenantId: TENANT,
        membershipId: 'mem-activa',
      });
      expect(d.affiliations.ensurePending).not.toHaveBeenCalled();
    });

    it('un QR de doctor multiuso canjeado por una cuenta sin perfil profesional se rechaza con su motivo y no gasta el código', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
        }),
      );
      d.directory.findPractitionerProfileIdOfUser.mockResolvedValue(null);
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PRACTITIONER_PROFILE_REQUIRED,
      });
      expect(d.affiliations.ensurePending).not.toHaveBeenCalled();
      // La transacción lanzó: el contador y el uso no se confirman.
      expect(d.invitations.recordUse).not.toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'inv-1',
        'user-ana',
        DIR.AFFILIATION_USE_ACCEPTED,
      );
    });

    it('un QR de doctor multiuso de una organización sin práctica activa no deja solicitud', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
        }),
      );
      d.affiliations.findTarget.mockResolvedValue(null);
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING,
      });
      expect(d.affiliations.ensurePending).not.toHaveBeenCalled();
    });

    it('un QR de doctor multiuso sin sede activa deja la solicitud igual (sin sede)', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
        }),
      );
      d.affiliations.findTarget.mockResolvedValue({ practiceId: 'practice-1' });
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res.pendingApproval).toBe(true);
      expect(d.affiliations.ensurePending).toHaveBeenCalledWith(
        expect.anything(),
        'person-ana',
        { practiceId: 'practice-1' },
        'user-ana',
      );
    });

    it('un QR de doctor de un solo uso atado a la persona afilia directo (decisión de producto vigente)', async () => {
      const d = build(
        invitation({
          kindConceptId: DIR.AFFILIATION_INVITE_KIND_PRACTITIONER,
          roleTemplateId: undefined,
          targetPersonId: 'person-ana',
          maxUses: 1,
        }),
      );
      const res = await d.service.redeem({ code: 'codigo-valido-1' }, ANA);
      expect(res).toEqual({
        kind: 'PRACTITIONER',
        tenantId: TENANT,
        membershipId: 'mem-1',
      });
      // N10c: la invitación de un doctor es una invitación canjeada, no apoyo.
      expect(d.directory.ensureActiveStaffMembership).toHaveBeenCalledWith(
        expect.anything(),
        'user-ana',
        TENANT,
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        'admin-1',
      );
      expect(d.directory.ensurePendingStaffMembership).not.toHaveBeenCalled();
      expect(d.affiliations.ensurePending).not.toHaveBeenCalled();
      expect(d.engagements.create).not.toHaveBeenCalled();
    });

    it.each([
      ['inexistente', null],
      ['vencido', invitation({ expiresAt: new Date(Date.now() - 1000) })],
      ['agotado', invitation({ usesCount: 5 })],
    ])(
      'un código %s responde 422 opaco (PRECONDITION_FAILED)',
      async (_n, inv) => {
        const d = build(inv as any);
        await expect(
          d.service.redeem({ code: 'codigo-valido-1' }, ANA),
        ).rejects.toMatchObject({ reason: Reason.SUPPORT_INVITATION_INVALID });
      },
    );

    it('una invitación revocada se rechaza y el rechazo queda registrado con su motivo', async () => {
      const d = build(
        invitation({ statusConceptId: DIR.AFFILIATION_INVITE_REVOKED }),
      );
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.invitations.recordUse).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'inv-1',
        'user-ana',
        DIR.AFFILIATION_USE_REJECTED_REVOKED,
      );
      expect(d.engagements.create).not.toHaveBeenCalled();
    });

    it('la misma persona no canjea dos veces el mismo código', async () => {
      const d = build();
      d.invitations.findUseBy.mockResolvedValue({ id: 'uso-previo' });
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_INVITATION_INVALID });
      expect(d.invitations.recordUse).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        'inv-1',
        'user-ana',
        DIR.AFFILIATION_USE_ALREADY_MEMBER,
      );
    });

    it('un código dirigido a otra persona no sirve', async () => {
      const d = build(
        invitation({ targetPersonId: 'person-otra', maxUses: 1 }),
      );
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_INVITATION_INVALID });
      expect(d.engagements.create).not.toHaveBeenCalled();
    });

    it('si el cupo se agotó entre la lectura y la escritura, rechaza (la condición va en el UPDATE)', async () => {
      const d = build(invitation(), false);
      await expect(
        d.service.redeem({ code: 'codigo-valido-1' }, ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_INVITATION_INVALID });
      expect(d.engagements.create).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('M1: la organización apaga un código vigente y deja de canjearse', async () => {
      const d = build();
      d.invitations.findById.mockResolvedValue(invitation());
      await runWithTenant(TENANT, () => d.service.revoke('inv-1', ADMIN));
      expect(d.tx.nativeUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'inv-1', tenantId: TENANT },
        expect.objectContaining({
          statusConceptId: DIR.AFFILIATION_INVITE_REVOKED,
        }),
      );
    });

    it('M1: un código de otra organización responde como inexistente', async () => {
      const d = build();
      d.invitations.findById.mockResolvedValue(
        invitation({ tenantId: 'otra-org' }),
      );
      await expect(
        runWithTenant(TENANT, () => d.service.revoke('inv-1', ADMIN)),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
