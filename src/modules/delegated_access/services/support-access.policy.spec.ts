import { jest } from '@jest/globals';
import { SupportAccessPolicy } from './support-access.policy';
import { SupportAccessReason, SUPPORT_TEMPLATE_DEFAULTS } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { STATUS } from './concept-maps';
import { supportPermissionId } from '../domain/support-actions';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-hospital';
const OTHER_TENANT = 'tenant-otro';
const ANA = 'user-ana';

const engagement = (
  overrides: Record<string, unknown> = {},
  membership: Record<string, unknown> = {},
) => ({
  assignment: {
    id: 'eng-ana',
    statusConceptId: STATUS.ACTIVE,
    validFrom: new Date('2026-01-01'),
    validTo: undefined,
    ...overrides,
  },
  tenantId: TENANT,
  userId: ANA,
  membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  membershipEndDate: undefined,
  ...membership,
});

const perezGrant = {
  grant: {
    id: 'g-perez',
    organizationUserAssignmentId: 'eng-ana',
    targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
    practitionerRoleAssignmentId: 'pra-perez',
    expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
    statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  },
  permissionIds: SUPPORT_TEMPLATE_DEFAULTS.SECRETARY.map(supportPermissionId),
};

const acceptedDelegation = (mayReply: boolean, hide = false) => ({
  delegate: {
    id: 'del-1',
    delegateUserAssignmentId: 'eng-ana',
    acceptedAt: new Date('2026-02-01'),
    statusConceptId: STATUS.ACTIVE,
    mayReplyOnBehalf: mayReply,
    replyDisclosureConceptId: hide
      ? DELEG.REPLY_DISCLOSURE_HIDE
      : DELEG.REPLY_DISCLOSURE_SHOW,
  },
  practitionerProfileId: 'prof-perez',
});

/** Construye la política con repositorios en doble. */
function build(
  opts: {
    engagements?: any[];
    delegations?: any[];
    grants?: any[];
    roleTenant?: string;
  } = {},
) {
  const repo = {
    findEngagements: mockFn().mockResolvedValue(
      opts.engagements ?? [engagement()],
    ),
    findGrantsWithActions: mockFn().mockResolvedValue(
      opts.grants ?? [perezGrant],
    ),
    findDelegationsOfEngagements: mockFn().mockResolvedValue(
      opts.delegations ?? [acceptedDelegation(true)],
    ),
    findRoleAssignments: mockFn().mockImplementation(
      async (_em: unknown, ids: string[]) =>
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              practitionerProfileId: 'prof-perez',
              tenantId: opts.roleTenant ?? TENANT,
            },
          ]),
        ),
    ),
    findRoleAssignmentsOfPractitioner: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findRoleAssignmentsOfTenant: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findRoleAssignmentsOfProfile: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findCareSpaceIdsOfTenant: mockFn().mockResolvedValue([]),
    findServices: mockFn().mockResolvedValue(new Map()),
    findCareSpaces: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em = { fork: mockFn().mockReturnValue({}) };
  const policy = new SupportAccessPolicy(em as any, repo as any, logger as any);
  return { policy, repo, logger };
}

describe('SupportAccessPolicy', () => {
  describe('can', () => {
    it('permite cuando hay vínculo, el doctor aceptó y el permiso cubre y trae la acción', async () => {
      const d = build();
      const result = await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.create',
        practitionerRoleAssignmentId: 'pra-perez',
      });
      expect(result).toEqual({
        allowed: true,
        reason: SupportAccessReason.ALLOWED,
        grantId: 'g-perez',
      });
    });

    it('niega sin vínculo en esa organización (caso Rosa en el hospital)', async () => {
      const d = build({ engagements: [] });
      const result = await d.policy.can({
        userId: 'user-rosa',
        tenantId: TENANT,
        action: 'schedule.view',
        practitionerProfileId: 'prof-cespedes',
      });
      expect(result.reason).toBe(SupportAccessReason.NO_ENGAGEMENT);
    });

    it('niega un doctor que es de otra organización antes de mirar los permisos', async () => {
      const d = build({ roleTenant: OTHER_TENANT });
      const result = await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.create',
        practitionerRoleAssignmentId: 'pra-perez',
      });
      expect(result.reason).toBe(SupportAccessReason.TARGET_OUTSIDE_TENANT);
      expect(d.repo.findGrantsWithActions).not.toHaveBeenCalled();
    });

    it('resuelve al doctor por su perfil cuando la agenda no conoce su asignación', async () => {
      const d = build();
      const result = await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.cancel',
        practitionerProfileId: 'prof-perez',
      });
      expect(result.allowed).toBe(true);
      expect(d.repo.findRoleAssignmentsOfPractitioner).toHaveBeenCalled();
    });

    it('un doctor sin asignación en la organización es ajeno', async () => {
      const d = build();
      d.repo.findRoleAssignmentsOfPractitioner.mockResolvedValue([]);
      const result = await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.cancel',
        practitionerProfileId: 'prof-fuera',
      });
      expect(result.reason).toBe(SupportAccessReason.TARGET_OUTSIDE_TENANT);
    });

    it('tras el fin de vínculo (estado revocado) niega con motivo de vínculo inactivo', async () => {
      const d = build({
        engagements: [engagement({ statusConceptId: STATUS.REVOKED })],
      });
      const result = await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.create',
        practitionerRoleAssignmentId: 'pra-perez',
      });
      expect(result.reason).toBe(SupportAccessReason.ENGAGEMENT_INACTIVE);
    });

    it('deja el registro estructurado de la decisión, sin contenido clínico', async () => {
      const d = build();
      await d.policy.can({
        userId: ANA,
        tenantId: TENANT,
        action: 'schedule.create',
        practitionerRoleAssignmentId: 'pra-perez',
      });
      expect(d.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'delegated_access.support_access.decision',
          userId: ANA,
          allowed: true,
          grantId: 'g-perez',
        }),
        expect.any(String),
      );
    });
  });

  describe('canReplyOnBehalf', () => {
    it('devuelve la delegación y que se muestra «respondido por su equipo» por defecto', async () => {
      const d = build();
      const result = await d.policy.canReplyOnBehalf(ANA, 'prof-perez');
      expect(result.allowed).toBe(true);
      expect(result.delegateAssignmentId).toBe('del-1');
      expect(result.disclosureShown).toBe(true);
    });

    it('respeta que el doctor oculte la divulgación', async () => {
      const d = build({ delegations: [acceptedDelegation(true, true)] });
      const result = await d.policy.canReplyOnBehalf(ANA, 'prof-perez');
      expect(result.disclosureShown).toBe(false);
    });

    it('niega si el doctor no le permitió responder en su nombre', async () => {
      const d = build({ delegations: [acceptedDelegation(false)] });
      const result = await d.policy.canReplyOnBehalf(ANA, 'prof-perez');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        SupportAccessReason.REPLY_NOT_ALLOWED_BY_DOCTOR,
      );
    });

    it('niega a quien no tiene ningún vínculo', async () => {
      const d = build({ engagements: [] });
      const result = await d.policy.canReplyOnBehalf('user-x', 'prof-perez');
      expect(result.reason).toBe(SupportAccessReason.NO_ENGAGEMENT);
    });
  });

  describe('canSearchPatients', () => {
    it('lo permite con un permiso que trata con pacientes', async () => {
      const d = build();
      await expect(d.policy.canSearchPatients(ANA, TENANT)).resolves.toBe(true);
    });

    it('lo niega sin vínculo', async () => {
      const d = build({ engagements: [] });
      await expect(d.policy.canSearchPatients(ANA, TENANT)).resolves.toBe(
        false,
      );
    });
  });

  describe('M5: el vínculo se evalúa vivo en cada decisión', () => {
    const query = {
      userId: ANA,
      tenantId: TENANT,
      action: 'schedule.view' as const,
      practitionerRoleAssignmentId: 'pra-perez',
    };

    it('con la membresía terminada la política niega aunque el vínculo siga marcado activo', async () => {
      const d = build({
        engagements: [
          engagement(
            {},
            {
              membershipStatusConceptId: DIR.MEMBERSHIP_ENDED,
              membershipEndDate: new Date('2026-03-01'),
            },
          ),
        ],
      });
      const res = await d.policy.can(query);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe(SupportAccessReason.ENGAGEMENT_INACTIVE);
    });

    it('con la membresía suspendida niega', async () => {
      const d = build({
        engagements: [
          engagement(
            {},
            { membershipStatusConceptId: DIR.MEMBERSHIP_SUSPENDED },
          ),
        ],
      });
      expect((await d.policy.can(query)).allowed).toBe(false);
    });

    it('con la recertificación vencida más allá de la gracia niega sin esperar al worker', async () => {
      const d = build({
        engagements: [
          engagement({
            nextRecertificationAt: new Date(Date.now() - 20 * 86_400_000),
          }),
        ],
      });
      const res = await d.policy.can(query);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe(SupportAccessReason.ENGAGEMENT_INACTIVE);
    });

    it('dentro de la gracia de recertificación sigue permitiendo', async () => {
      const d = build({
        engagements: [
          engagement({
            nextRecertificationAt: new Date(Date.now() - 5 * 86_400_000),
          }),
        ],
      });
      expect((await d.policy.can(query)).allowed).toBe(true);
    });
  });

  describe('bandeja de chat: vínculo vivo, doctores visibles y quién puede atender', () => {
    it('liveEngagementTenants: solo las organizaciones con vínculo vivo, sin repetir', async () => {
      const d = build({
        engagements: [
          engagement(),
          engagement({ id: 'eng-ana-2' }),
          engagement(
            { id: 'eng-vieja' },
            { membershipEndDate: new Date('2026-02-01') },
          ),
          {
            ...engagement({ id: 'eng-otra' }),
            tenantId: OTHER_TENANT,
            membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
          },
          {
            ...engagement({
              id: 'eng-suspendida',
              statusConceptId: 'suspendido',
            }),
            tenantId: 'tenant-suspendido',
          },
        ],
      });
      const tenants = await d.policy.liveEngagementTenants(ANA);
      expect(tenants.sort()).toEqual([OTHER_TENANT, TENANT].sort());
      expect(d.repo.findEngagements).toHaveBeenCalledWith(expect.anything(), {
        userId: ANA,
      });
    });

    it('liveEngagementTenants: con una organización pedida solo consulta esa', async () => {
      const d = build();
      await d.policy.liveEngagementTenants(ANA, undefined, TENANT);
      expect(d.repo.findEngagements).toHaveBeenCalledWith(expect.anything(), {
        userId: ANA,
        tenantId: TENANT,
      });
    });

    it('inboxDoctorsOfTenant: con la aceptación, el permiso y el permiso de responder del doctor, puede responder', async () => {
      const d = build();
      const doctors = await d.policy.inboxDoctorsOfTenant(ANA, TENANT);
      expect(doctors).toEqual([
        {
          tenantId: TENANT,
          practitionerProfileId: 'prof-perez',
          roleAssignmentId: 'pra-perez',
          replyAllowed: true,
          disclosureShown: true,
          delegateAssignmentId: 'del-1',
        },
      ]);
    });

    it('N10: inboxDoctorsOfTenant: aceptada solo para la agenda (sin permiso de responder del doctor) NO ve sus conversaciones', async () => {
      const d = build({ delegations: [acceptedDelegation(false)] });
      expect(await d.policy.inboxDoctorsOfTenant(ANA, TENANT)).toEqual([]);
      // Y no figura entre quienes pueden recibir la asignación de su conversación.
      expect(await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).toEqual([]);
    });

    it('inboxDoctorsOfTenant: sin la aceptación del doctor no ve nada de él', async () => {
      const d = build({ delegations: [] });
      expect(await d.policy.inboxDoctorsOfTenant(ANA, TENANT)).toEqual([]);
    });

    it('inboxDoctorsOfTenant: sin el permiso messages.reply_on_behalf que cubra al doctor no lo ve', async () => {
      const d = build({
        grants: [
          {
            ...perezGrant,
            permissionIds:
              SUPPORT_TEMPLATE_DEFAULTS.NURSING.map(supportPermissionId),
          },
        ],
      });
      expect(await d.policy.inboxDoctorsOfTenant(ANA, TENANT)).toEqual([]);
    });

    it('inboxDoctorsOfTenant: respeta que el doctor oculte la divulgación', async () => {
      const d = build({ delegations: [acceptedDelegation(true, true)] });
      const [doctor] = await d.policy.inboxDoctorsOfTenant(ANA, TENANT);
      expect(doctor.disclosureShown).toBe(false);
    });

    it('inboxDoctorsOfTenant: sin vínculo en la organización no hay bandeja', async () => {
      const d = build({ engagements: [] });
      expect(await d.policy.inboxDoctorsOfTenant(ANA, TENANT)).toEqual([]);
      expect(d.repo.findGrantsWithActions).not.toHaveBeenCalled();
    });

    it('inboxDoctorsOfTenant: lee solo la organización pedida', async () => {
      const d = build();
      await d.policy.inboxDoctorsOfTenant(ANA, TENANT);
      expect(d.repo.findEngagements).toHaveBeenCalledWith(expect.anything(), {
        userId: ANA,
        tenantId: TENANT,
      });
      expect(d.repo.findRoleAssignmentsOfTenant).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
      );
    });

    it('replyersOfDoctor: solo quienes pueden responder por ese doctor', async () => {
      const bea = {
        ...engagement({ id: 'eng-bea' }),
        userId: 'user-bea',
      };
      const d = build({
        engagements: [engagement(), bea],
        grants: [
          perezGrant,
          {
            ...perezGrant,
            grant: {
              ...perezGrant.grant,
              id: 'g-bea',
              organizationUserAssignmentId: 'eng-bea',
            },
          },
        ],
        // Bea no fue aceptada por el doctor.
        delegations: [acceptedDelegation(true)],
      });
      expect(await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).toEqual([
        ANA,
      ]);
    });

    it('replyersOfDoctor: sin vínculos no hay a quién asignar', async () => {
      const d = build({ engagements: [] });
      expect(await d.policy.replyersOfDoctor(TENANT, 'prof-perez')).toEqual([]);
    });

    it('isDoctorOfTenant: distingue al doctor de la organización del que no lo es', async () => {
      const d = build();
      expect(await d.policy.isDoctorOfTenant('prof-perez', TENANT)).toBe(true);
      d.repo.findRoleAssignmentsOfPractitioner.mockResolvedValue([]);
      expect(await d.policy.isDoctorOfTenant('prof-de-otra-org', TENANT)).toBe(
        false,
      );
    });
  });

  describe('con RLS, sin transacción propia la política abre una acotada a la organización', () => {
    const withRls = async (run: () => Promise<void>) => {
      const before = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        await run();
      } finally {
        if (before === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = before;
      }
    };
    const rlsPolicy = (d: ReturnType<typeof build>) => {
      const tx = { execute: mockFn().mockResolvedValue([]) };
      const em = { transactional: mockFn((cb: any) => cb(tx)), fork: mockFn() };
      return {
        tx,
        em,
        policy: new SupportAccessPolicy(
          em as any,
          d.repo as any,
          d.logger as any,
        ),
      };
    };

    it('can: lee dentro de una transacción con el tenant de la pregunta', async () => {
      await withRls(async () => {
        const d = build();
        const r = rlsPolicy(d);
        const result = await r.policy.can({
          userId: ANA,
          tenantId: TENANT,
          action: 'schedule.create',
          practitionerRoleAssignmentId: 'pra-perez',
        });
        expect(result.allowed).toBe(true);
        expect(r.em.fork).not.toHaveBeenCalled();
        expect(r.tx.execute).toHaveBeenCalledWith(
          "select set_config('app.current_tenant_id', ?, true)",
          [TENANT],
        );
        expect(d.repo.findEngagements.mock.calls[0][0]).toBe(r.tx);
      });
    });

    it('evaluatorFor: carga en la transacción de la organización y responde en memoria', async () => {
      await withRls(async () => {
        const d = build();
        const r = rlsPolicy(d);
        const evaluate = await r.policy.evaluatorFor(ANA, TENANT);
        expect(r.tx.execute).toHaveBeenCalledWith(
          "select set_config('app.current_tenant_id', ?, true)",
          [TENANT],
        );
        expect(
          evaluate({
            action: 'schedule.create',
            practitionerProfileId: 'prof-perez',
          }).allowed,
        ).toBe(true);
      });
    });

    /** Una transacción que modela a PostgreSQL: `set_config(..., true)` NO se revierte al liberar un savepoint. */
    const statefulPolicy = (d: ReturnType<typeof build>) => {
      const state = { sc: 'false', tid: 'org-de-la-peticion' };
      const tx = {
        execute: mockFn(async (sql: string, params?: unknown[]) => {
          if (sql.includes('current_setting')) {
            return [{ sc: state.sc, tid: state.tid }];
          }
          if (sql.includes("'app.system_context'")) {
            state.sc = params ? String(params[0]) : 'false';
          }
          if (sql.includes("'app.current_tenant_id'")) {
            state.tid = params ? String(params[0]) : '';
          }
          return [];
        }),
      };
      const em = { transactional: mockFn((cb: any) => cb(tx)), fork: mockFn() };
      return {
        state,
        policy: new SupportAccessPolicy(
          em as any,
          d.repo as any,
          d.logger as any,
        ),
      };
    };

    it('N-5 can: al terminar devuelve el contexto de tenant que traía la petición (no deja a la petición bajo otra organización)', async () => {
      await withRls(async () => {
        const r = statefulPolicy(build());
        await r.policy.can({
          userId: ANA,
          tenantId: TENANT,
          action: 'schedule.create',
          practitionerRoleAssignmentId: 'pra-perez',
        });
        expect(r.state).toEqual({ sc: 'false', tid: 'org-de-la-peticion' });
      });
    });

    it('N-5 evaluatorFor: igual, restaura el contexto tras cargar', async () => {
      await withRls(async () => {
        const r = statefulPolicy(build());
        await r.policy.evaluatorFor(ANA, TENANT);
        expect(r.state).toEqual({ sc: 'false', tid: 'org-de-la-peticion' });
      });
    });

    it('N-5: también lo restaura si la decisión falla', async () => {
      await withRls(async () => {
        const d = build();
        d.repo.findEngagements.mockRejectedValue(new Error('base caída'));
        const r = statefulPolicy(d);
        await expect(
          r.policy.can({
            userId: ANA,
            tenantId: TENANT,
            action: 'schedule.create',
            practitionerRoleAssignmentId: 'pra-perez',
          }),
        ).rejects.toThrow('base caída');
        expect(r.state.tid).toBe('org-de-la-peticion');
      });
    });

    it('con la transacción del llamador no abre otra', async () => {
      await withRls(async () => {
        const d = build();
        const r = rlsPolicy(d);
        const mine = {} as any;
        await r.policy.can(
          {
            userId: ANA,
            tenantId: TENANT,
            action: 'schedule.view',
            practitionerProfileId: 'prof-perez',
          },
          mine,
        );
        expect(r.em.transactional).not.toHaveBeenCalled();
        expect(d.repo.findEngagements.mock.calls[0][0]).toBe(mine);
      });
    });
  });
});
