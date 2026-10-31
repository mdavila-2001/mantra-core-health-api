import { ReviewerResolverService } from './reviewer-resolver.service';
import {
  engagement,
  fakeEm,
  grant,
  ids,
  mockFn,
  worldOf,
} from './governance-world.testing';

function build() {
  const queries: any = {
    securityAdminUserIds: mockFn().mockResolvedValue([ids.admin, ids.admin2]),
  };
  return { svc: new ReviewerResolverService(queries), queries };
}

const head = grant({
  grantId: 'g-head',
  actions: ['team.grants.assign', 'agenda.appointment.view'],
});
const member = grant({
  grantId: 'g-m',
  actions: ['agenda.appointment.cancel'],
  grantedByUserId: ids.admin,
});
const world = () =>
  worldOf([
    engagement({
      engagementId: 'e-head',
      subjectUserId: ids.sofia,
      grants: [head],
    }),
    engagement({
      engagementId: 'e-m',
      subjectUserId: ids.marcos,
      grants: [member],
    }),
    engagement({
      engagementId: 'e-susp',
      subjectUserId: ids.ana,
      state: 'SUSPENDED',
      grants: [grant({ grantId: 'g-s', actions: ['team.grants.assign'] })],
    }),
  ]);

describe('ReviewerResolverService.adminScopesOf', () => {
  it('un alcance por concesión ALLOW viva con team.grants.assign de un vínculo ACTIVO', () => {
    const { svc } = build();
    const scopes = svc.adminScopesOf(world());
    expect(
      scopes.map((s) => [s.adminUserId, (s.target as any).grantId]),
    ).toEqual([[ids.sofia, 'g-head']]);
  });

  it('una concesión DENY o vencida no da alcance', () => {
    const { svc } = build();
    const w = worldOf([
      engagement({
        engagementId: 'e',
        subjectUserId: ids.sofia,
        grants: [
          grant({
            grantId: 'a',
            actions: ['team.grants.assign'],
            effect: 'DENY',
          }),
          grant({
            grantId: 'b',
            actions: ['team.grants.assign'],
            validTo: new Date('2020-01-01'),
          }),
        ],
      }),
    ]);
    expect(svc.adminScopesOf(w)).toEqual([]);
  });
});

describe('ReviewerResolverService: factsFor, select, resolve y escalate', () => {
  it('factsFor trae administradores de seguridad, alcances y el responsable de la campaña', async () => {
    const { svc, queries } = build();
    const em = fakeEm();
    const f = await svc.factsFor(em, world(), ids.admin);
    expect(queries.securityAdminUserIds).toHaveBeenCalledWith(em, ids.tenant);
    expect(f.context).toMatchObject({
      campaignOwnerUserId: ids.admin,
      securityAdminUserIds: [ids.admin, ids.admin2],
    });
    expect(f.adminScopes).toHaveLength(1);
  });

  it('resuelve la cuenta del doctor por su perfil (la persona detrás del perfil)', async () => {
    const { svc } = build();
    const em = fakeEm();
    em.find = mockFn().mockResolvedValue([
      { personId: ids.perez, userId: ids.perez },
    ]);
    const w = worldOf([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        grants: [
          grant({
            grantId: 'g',
            targetKind: 'PRACTITIONER',
            healthcareServiceId: undefined,
            practitionerProfileId: ids.perez,
            actions: ['agenda.appointment.view'],
          }),
        ],
      }),
    ]);
    const f = await svc.factsFor(em, w, null);
    expect(f.context.doctorUserIdsByPractitioner).toEqual({
      [ids.perez]: ids.perez,
    });
  });

  it('la concesión de un servicio la revisa su jefe; la del jefe, un administrador; nunca el sujeto ni quien la otorgó', async () => {
    const { svc } = build();
    const w = world();
    const f = await svc.factsFor(fakeEm(), w, null);
    const marcos = w.engagements[1];
    const sofia = w.engagements[0];
    expect(svc.resolve(f, marcos, member, 'PERIODIC')).toMatchObject({
      kind: 'SERVICE_HEAD',
      userIds: [ids.sofia],
    });
    const own = svc.resolve(f, sofia, head, 'PERIODIC');
    expect(own.kind).toBe('ADMIN');
    expect(own.userIds).not.toContain(ids.sofia);
  });

  it('un ítem de vínculo (sin concesión) lo revisa un administrador', async () => {
    const { svc } = build();
    const w = world();
    const f = await svc.factsFor(fakeEm(), w, ids.admin);
    expect(
      svc.resolve(f, w.engagements[1], undefined, 'RECERTIFICATION'),
    ).toMatchObject({ kind: 'ADMIN' });
  });

  it('select usa el dominio: un ítem por concesión viva en el alcance y sin repetir lo ya abierto', async () => {
    const { svc } = build();
    const w = world();
    const f = await svc.factsFor(fakeEm(), w, null);
    const all = svc.select(w, f, {
      kind: 'PERIODIC',
      scope: { kind: 'ORGANIZATION' },
    });
    expect(all.items.map((i) => i.grantId).sort()).toEqual(['g-head', 'g-m']);
    const again = svc.select(w, f, {
      kind: 'PERIODIC',
      scope: { kind: 'ORGANIZATION' },
      existingOpenItemKeys: ['e-m:g-m'],
    });
    expect(again.items.map((i) => i.grantId)).toEqual(['g-head']);
    expect(again.skipped).toEqual([
      { engagementId: 'e-m', grantId: 'g-m', reason: 'ALREADY_OPEN' },
    ]);
  });

  it('escalate: del jefe de servicio al administrador (con el responsable de la campaña)', async () => {
    const { svc } = build();
    const w = world();
    const f = await svc.factsFor(fakeEm(), w, ids.admin2);
    const r = svc.escalate(
      'SERVICE_HEAD',
      f,
      w.engagements[1],
      member,
      'PERIODIC',
    );
    expect(r.kind).toBe('ADMIN');
    expect(r.userIds).not.toContain(ids.marcos);
    expect(r.userIds).not.toContain(ids.admin); // otorgó la concesión
  });
});

describe('ReviewerResolverService.resolveForMove (pendiente 12)', () => {
  const doctorGrant = {
    targetKind: 'PRACTITIONER' as const,
    practitionerRoleAssignmentId: ids.praPerez,
    practitionerProfileId: ids.perez,
  };
  const serviceGrant = {
    targetKind: 'SERVICE' as const,
    healthcareServiceId: ids.svcEco,
  };

  it('una concesión de un doctor la revisa ese doctor; el resto, el dueño de la cuenta', async () => {
    const { svc } = build();
    const em = fakeEm();
    em.find = mockFn().mockResolvedValue([
      { personId: ids.perez, userId: ids.perez },
    ]);
    const out = await svc.resolveForMove(
      em,
      ids.tenant,
      { subjectUserId: ids.marcos, supervisorUserId: ids.sofia },
      [doctorGrant, serviceGrant],
    );
    expect(out[0]).toMatchObject({
      kind: 'DOCTOR_OWNER',
      userIds: [ids.perez],
    });
    expect(out[1]).toMatchObject({ kind: 'SUPERVISOR', userIds: [ids.sofia] });
  });

  it('si el doctor no tiene cuenta o es la propia persona, cae al dueño y luego al administrador', async () => {
    const { svc } = build();
    const em = fakeEm();
    const noAccount = await svc.resolveForMove(
      em,
      ids.tenant,
      { subjectUserId: ids.marcos, supervisorUserId: ids.sofia },
      [doctorGrant],
    );
    expect(noAccount[0]).toMatchObject({
      kind: 'SUPERVISOR',
      userIds: [ids.sofia],
    });
    const orphan = await svc.resolveForMove(
      em,
      ids.tenant,
      { subjectUserId: ids.marcos, supervisorUserId: null },
      [doctorGrant],
    );
    expect(orphan[0].kind).toBe('ADMIN');
    expect(orphan[0].userIds).toEqual([ids.admin, ids.admin2]);
  });

  it('nunca devuelve a quien otorgó la concesión', async () => {
    const { svc } = build();
    const em = fakeEm();
    const out = await svc.resolveForMove(
      em,
      ids.tenant,
      { subjectUserId: ids.marcos, supervisorUserId: null },
      [{ ...serviceGrant, grantedByUserId: ids.admin }],
    );
    expect(out[0].userIds).toEqual([ids.admin2]);
  });
});
