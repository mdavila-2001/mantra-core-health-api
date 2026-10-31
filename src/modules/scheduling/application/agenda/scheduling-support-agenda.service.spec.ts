import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PreconditionFailedException } from '../../../../common';
import { SchedulingSupportAgendaService } from './scheduling-support-agenda.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const ORG = 'tenant-hospital';

const row = (id: string, overrides: Record<string, unknown> = {}) => ({
  bookingId: id,
  resourceId: 'res-perez',
  practitionerProfileId: 'prof-perez',
  startAt: new Date('2026-11-02T14:00:00Z'),
  endAt: new Date('2026-11-02T14:30:00Z'),
  statusConceptId: 'st',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  patientProfileId: `pat-${id}`,
  patientName: `Paciente ${id}`,
  ...overrides,
});

/** Construye el servicio con la política y el repositorio en doble. */
function build(
  evaluate: (q: any) => any,
  rows: any[] = [row('b1'), row('b2', { careSpaceId: 'sala-201' })],
  waits: any[] = [],
) {
  const repo = {
    findRows: mockFn().mockResolvedValue(rows),
    findActiveWaits: mockFn().mockResolvedValue(waits),
    namesOf: mockFn().mockResolvedValue({
      doctors: new Map([['prof-perez', 'Andrés Pérez']]),
      services: new Map([['svc-consulta', 'Consulta']]),
      spaces: new Map([['sala-103', { name: '103', code: 'A-P1-103' }]]),
    }),
  };
  const tx = { __tx: true };
  const policy = {
    evaluator: mockFn().mockResolvedValue(evaluate),
    // Con RLS abre la transacción de la organización; acá la pasa tal cual.
    inTenantScope: mockFn((_em: any, _org: string, work: any) => work(tx)),
    // El orden de la bandeja: por nombre sin acentos y luego por perfil.
    orderDoctors: mockFn((doctors: any[]) =>
      [...doctors].sort((a, b) =>
        a.displayName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .localeCompare(
            b.displayName.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
            'es',
          ),
      ),
    ),
  };
  const access = {
    sealSupportAgendaView: mockFn().mockResolvedValue(undefined),
  };
  const em = { fork: mockFn().mockReturnValue({}) };
  const service = new SchedulingSupportAgendaService(
    em as any,
    repo as any,
    policy as any,
    access as any,
  );
  return { service, repo, policy, access, tx };
}

const query = {
  org: ORG,
  from: '2026-11-02T00:00:00Z',
  to: '2026-11-09T00:00:00Z',
} as any;

/** Permite todo en la sala 103 y nada en las demás. */
const onlySala103 = (q: any) =>
  q.careSpaceId === 'sala-103' || q.careSpaceId === undefined
    ? { allowed: true, reason: 'ALLOWED', grantId: 'g1' }
    : { allowed: false, reason: 'NO_COVERING_GRANT' };

/** Todo en la sala 103 y, en la 201, solo confirmar (no ver): un bloque sin paciente. */
const onlySala103ConfirmaEn201 = (q: any) => {
  if (q.careSpaceId === 'sala-103' || q.careSpaceId === undefined) {
    return { allowed: true, reason: 'ALLOWED', grantId: 'g1' };
  }
  return q.action === 'schedule.confirm'
    ? { allowed: true, reason: 'ALLOWED', grantId: 'g2' }
    : { allowed: false, reason: 'ACTION_NOT_GRANTED' };
};

describe('SchedulingSupportAgendaService', () => {
  it('sin vínculo en la organización responde 403 y no lee la agenda', async () => {
    const d = build(() => ({ allowed: false, reason: 'NO_ENGAGEMENT' }));
    await expect(d.service.list(query, ANA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.repo.findRows).not.toHaveBeenCalled();
  });

  it('un rango de más de 31 días se rechaza', async () => {
    const d = build(onlySala103);
    await expect(
      d.service.list({ ...query, to: '2026-12-31T00:00:00Z' }, ANA),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('cada cita trae su política: la cubierta con acciones, la que solo permite otra acción como bloque sin paciente, servicio ni bookingId', async () => {
    const d = build(onlySala103ConfirmaEn201);
    const res = await d.service.list(query, ANA);
    const [cubierta, bloque] = res.items;
    expect(cubierta.patientName).toBe('Paciente b1');
    expect(cubierta.bookingId).toBe('b1');
    expect(cubierta.healthcareServiceId).toBe('svc-consulta');
    expect(cubierta.allowedActions).toContain('schedule.view');
    expect(bloque.patientName).toBeUndefined();
    expect(bloque.patientProfileId).toBeUndefined();
    expect(bloque.denialReason).toBe('ACTION_NOT_GRANTED');
    expect(bloque.allowedActions).toEqual([]);
    // B-b: el bloque ocupado no nombra la cita ni el servicio.
    expect(bloque).not.toHaveProperty('bookingId');
    expect(bloque).not.toHaveProperty('healthcareServiceId');
    // El horario, el doctor y el espacio se conservan.
    expect(bloque.careSpaceId).toBe('sala-201');
    expect(bloque.resourceId).toBe('res-perez');
    expect(bloque.practitionerProfileId).toBe('prof-perez');
  });

  it('B-b: una cita sin ningún permiso schedule.* aplicable no sale ni como bloque', async () => {
    const d = build(onlySala103, [
      row('b1'),
      row('b2', { careSpaceId: 'sala-201' }),
    ]);
    const res = await d.service.list(query, ANA);
    expect(res.items.map((i) => i.bookingId)).toEqual(['b1']);
    expect(JSON.stringify(res)).not.toContain('b2');
    expect(JSON.stringify(res)).not.toContain('sala-201');
  });

  it('B-b: con un vínculo vivo pero sin ningún permiso de agenda la lista sale vacía', async () => {
    const d = build(() => ({ allowed: false, reason: 'NO_COVERING_GRANT' }));
    const res = await d.service.list(query, ANA);
    expect(res.items).toEqual([]);
    expect(res.doctors).toEqual([]);
  });

  it('las opciones de filtro se limitan a lo que la persona ve', async () => {
    const d = build(onlySala103);
    const res = await d.service.list(query, ANA);
    expect(res.doctors).toEqual([
      { practitionerProfileId: 'prof-perez', displayName: 'Andrés Pérez' },
    ]);
    expect(res.locations.map((l) => l.id)).toEqual(['sala-103']);
    expect(res.services.map((s) => s.id)).toEqual(['svc-consulta']);
  });

  it('M7: sella la lectura una vez por permiso y doctor, no por cita', async () => {
    const d = build(onlySala103, [row('b1'), row('b2'), row('b3')]);
    await d.service.list(query, ANA);
    const [, tenantId, accesses] = d.access.sealSupportAgendaView.mock.calls[0];
    expect(tenantId).toBe(ORG);
    expect(accesses.every((a: any) => a.grantId === 'g1')).toBe(true);
  });

  it('M7: la lectura pasa al sello los pacientes que reveló (solo los de citas con schedule.view), sin repetir', async () => {
    const d = build(onlySala103ConfirmaEn201, [
      row('b1'),
      row('b2', { patientProfileId: 'pat-b1' }),
      row('b3', { careSpaceId: 'sala-201' }),
    ]);
    await d.service.list(query, ANA);
    const [, , , patients] = d.access.sealSupportAgendaView.mock.calls[0];
    expect(patients).toEqual(['pat-b1']);
  });

  it('pasa los filtros al repositorio', async () => {
    const d = build(onlySala103);
    await d.service.list(
      { ...query, doctors: ['prof-perez'], locations: ['sala-103'] },
      ANA,
    );
    expect(d.repo.findRows.mock.calls[0][5]).toEqual({
      doctors: ['prof-perez'],
      services: undefined,
      locations: ['sala-103'],
    });
  });

  it('un vínculo terminado, vencido o suspendido tampoco abre la agenda (403, caso 12)', async () => {
    const d = build(() => ({ allowed: false, reason: 'ENGAGEMENT_INACTIVE' }));
    await expect(d.service.list(query, ANA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.repo.findRows).not.toHaveBeenCalled();
  });

  describe('lista de espera por horario (waitlistCount)', () => {
    const espera = (overrides: Record<string, unknown> = {}) => ({
      resourceId: 'res-perez',
      ...overrides,
    });

    it('cada cita visible trae cuánta gente espera su horario; sin espera, el campo no viaja', async () => {
      const d = build(
        onlySala103,
        [row('b1'), row('b2', { resourceId: 'res-rojas' })],
        [espera(), espera(), espera({ resourceId: 'res-rojas' })],
      );
      // `onlySala103` permite todo en la sala 103 (ambas citas la tienen).
      const res = await d.service.list(query, ANA);
      expect(res.items.map((i) => i.waitlistCount)).toEqual([2, 1]);
    });

    it('cuenta solo la ventana que incluye el inicio del horario (sin ventana, cuenta)', async () => {
      const d = build(
        onlySala103,
        [row('b1')],
        [
          espera(), // sin ventana: «cualquiera me sirve»
          espera({
            desiredFrom: new Date('2026-11-02T00:00:00Z'),
            desiredTo: new Date('2026-11-03T00:00:00Z'),
          }),
          espera({ desiredFrom: new Date('2026-11-05T00:00:00Z') }), // después
          espera({ desiredTo: new Date('2026-11-01T00:00:00Z') }), // antes
        ],
      );
      const res = await d.service.list(query, ANA);
      expect(res.items[0].waitlistCount).toBe(2);
    });

    it('sin nadie en espera el campo no viaja', async () => {
      const d = build(onlySala103, [row('b1')], []);
      const res = await d.service.list(query, ANA);
      expect(res.items[0]).not.toHaveProperty('waitlistCount');
    });

    it('el bloque de una cita que no puede ver (pero sobre la que tiene otro permiso de agenda) sale sin paciente, sin motivo y sin la cifra de espera', async () => {
      const d = build(
        onlySala103ConfirmaEn201,
        [row('b2', { careSpaceId: 'sala-201' })],
        [espera()],
      );
      const res = await d.service.list(query, ANA);
      const [bloque] = res.items;
      expect(bloque.patientName).toBeUndefined();
      expect(bloque.patientProfileId).toBeUndefined();
      expect(bloque).not.toHaveProperty('waitlistCount');
      expect(bloque).not.toHaveProperty('reasonText');
      // Y no consulta esperas de agendas que no puede ver.
      expect(d.repo.findActiveWaits.mock.calls[0][2]).toEqual([]);
    });

    it('consulta las esperas de la organización de la agenda, una sola vez', async () => {
      const d = build(onlySala103, [row('b1'), row('b2')], []);
      await d.service.list(query, ANA);
      expect(d.repo.findActiveWaits).toHaveBeenCalledTimes(1);
      expect(d.repo.findActiveWaits.mock.calls[0][1]).toBe(ORG);
      expect(d.repo.findActiveWaits.mock.calls[0][2]).toEqual(['res-perez']);
    });
  });

  describe('organización: org o tenantId', () => {
    it('acepta tenantId como alias de org', async () => {
      const d = build(onlySala103);
      const { org: _org, ...sinOrg } = query;
      await d.service.list({ ...sinOrg, tenantId: ORG }, ANA);
      expect(d.policy.evaluator).toHaveBeenCalledWith('user-ana', ORG, d.tx);
      expect(d.repo.findRows.mock.calls[0][1]).toBe(ORG);
    });

    it('si llegan los dos y son distintos, 400', async () => {
      const d = build(onlySala103);
      await expect(
        d.service.list({ ...query, tenantId: 'tenant-otro' }, ANA),
      ).rejects.toMatchObject({ status: 400 });
      expect(d.repo.findRows).not.toHaveBeenCalled();
    });
  });

  describe('aislamiento por organización y orden de doctores', () => {
    it('todas las lecturas corren en la transacción de la organización (inTenantScope), no en otro fork', async () => {
      const d = build(onlySala103);
      await d.service.list(query, ANA);
      expect(d.policy.inTenantScope).toHaveBeenCalledWith(
        expect.anything(),
        ORG,
        expect.any(Function),
      );
      expect(d.policy.evaluator).toHaveBeenCalledWith('user-ana', ORG, d.tx);
      expect(d.repo.findRows.mock.calls[0][0]).toBe(d.tx);
      expect(d.repo.findActiveWaits.mock.calls[0][0]).toBe(d.tx);
      expect(d.repo.namesOf.mock.calls[0][0]).toBe(d.tx);
    });

    it('el sello de la lectura va después de salir de la transacción', async () => {
      const d = build(onlySala103);
      let inside = false;
      d.policy.inTenantScope.mockImplementation(
        async (_em: any, _org: string, work: any) => {
          inside = true;
          try {
            return await work(d.tx);
          } finally {
            inside = false;
          }
        },
      );
      let sealedInside: boolean | undefined;
      d.access.sealSupportAgendaView.mockImplementation(() => {
        sealedInside = inside;
        return Promise.resolve();
      });
      await d.service.list(query, ANA);
      expect(sealedInside).toBe(false);
    });

    it('doctors[] sale en el orden de la bandeja (nombre sin acentos), no en el de las citas', async () => {
      const d = build(
        () => ({ allowed: true, reason: 'ALLOWED', grantId: 'g1' }),
        [
          row('b1', { practitionerProfileId: 'prof-zeta' }),
          row('b2', { practitionerProfileId: 'prof-alvaro' }),
          row('b3', { practitionerProfileId: 'prof-perez' }),
        ],
      );
      d.repo.namesOf.mockResolvedValue({
        doctors: new Map([
          ['prof-zeta', 'Zulema Rojas'],
          ['prof-alvaro', 'Álvaro Pérez'],
          ['prof-perez', 'Andrés Pérez'],
        ]),
        services: new Map(),
        spaces: new Map(),
      });
      const res = await d.service.list(query, ANA);
      expect(res.doctors.map((x) => x.displayName)).toEqual([
        'Álvaro Pérez',
        'Andrés Pérez',
        'Zulema Rojas',
      ]);
    });
  });
});
