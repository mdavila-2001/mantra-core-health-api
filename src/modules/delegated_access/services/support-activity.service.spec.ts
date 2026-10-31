import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS, runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { SupportActivityService } from './support-activity.service';
import { namesRepoDouble } from './support-names.testing';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ANA = 'c0000000-0000-4000-8000-00000000000a';
const LUCIA = 'c0000000-0000-4000-8000-00000000000b';
const PEREZ_PROFILE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ROJAS_PROFILE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/** Un asiento de la cadena de auditoría. */
let seq = 0;
function row(over: Record<string, unknown> = {}): any {
  seq += 1;
  return {
    id: `a${String(seq).padStart(3, '0')}`,
    userId: ANA,
    tenantId: TENANT,
    action: 'BOOKING_CHECKED_IN',
    entity: 'appointment_booking',
    entityId: `b${seq}`,
    outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
    recordedAt: new Date(Date.UTC(2026, 9, 30, 12, 0, 60 - seq)),
    ...over,
  };
}

function attributions(entries: Record<string, any> = {}) {
  return {
    byBooking: new Map(Object.entries(entries)),
    byAppointment: new Map<string, any>(),
    byDelegate: new Map<string, any>(),
    byGrant: new Map<string, any>(),
  };
}

function build(opts: { batches?: any[][]; attr?: any } = {}) {
  const tx = { execute: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn().mockReturnValue(tx),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const live = (id: string) => ({ id, statusConceptId: STATUS.ACTIVE });
  const engagementRows: any[] = [
    {
      assignment: live('eng-ana'),
      tenantId: TENANT,
      userId: ANA,
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    },
    {
      assignment: live('eng-lucia'),
      tenantId: TENANT,
      userId: LUCIA,
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    },
  ];
  const access = {
    findEngagements: mockFn((_tx: unknown, filter: any) =>
      Promise.resolve(
        engagementRows.filter(
          (r) =>
            (!filter.ids || filter.ids.includes(r.assignment.id)) &&
            (!filter.userId || r.userId === filter.userId),
        ),
      ),
    ),
    findRoleAssignmentsOfPractitioner: mockFn().mockResolvedValue([
      { id: 'pra-perez' },
    ]),
    findDelegationsOfEngagements: mockFn().mockResolvedValue([
      { practitionerProfileId: PEREZ_PROFILE },
    ]),
  };
  const engagements = {
    findDelegationsOfDoctor: mockFn().mockResolvedValue([
      { delegateUserAssignmentId: 'eng-ana' },
    ]),
  };
  const repo = namesRepoDouble(mockFn);
  repo.userNames.mockResolvedValue(
    new Map([
      [ANA, 'Ana Gutiérrez'],
      [LUCIA, 'Lucía Paz'],
    ]),
  );
  const batches = opts.batches ?? [[]];
  let call = 0;
  repo.scan = mockFn(() => Promise.resolve(batches[call++] ?? []));
  repo.attributions.mockResolvedValue(opts.attr ?? attributions());
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const service = new SupportActivityService(
    em as any,
    access as any,
    engagements as any,
    repo as any,
    scope,
  );
  const org = (query: any = {}) =>
    runWithTenant(TENANT, () => service.forTenant(query));
  const doctor = (query: any = {}, profile: string | null = PEREZ_PROFILE) =>
    runWithTenant(TENANT, () =>
      service.forPractitioner(
        {
          id: 'user-perez',
          roles: ['PRACTITIONER'],
          practitionerProfileId: profile ?? undefined,
        } as any,
        query,
      ),
    );
  const person = (query: any = {}) =>
    service.forPerson({ id: ANA, roles: ['USER'] } as any, query);
  return {
    service,
    tx,
    em,
    access,
    engagements,
    engagementRows,
    repo,
    org,
    doctor,
    person,
  };
}

describe('SupportActivityService', () => {
  describe('organización', () => {
    it('cada fila trae nombres, fecha, acción, resultado, permiso y cita, sin datos clínicos', async () => {
      const entry = row({ id: 'a-1', entityId: 'b-1' });
      const d = build({
        batches: [[entry]],
        attr: attributions({
          'b-1': {
            bookingId: 'b-1',
            appointmentId: 'cita-1',
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
          },
        }),
      });
      const res = await d.org();
      expect(res).toEqual({
        items: [
          expect.objectContaining({
            id: 'a-1',
            tenantId: TENANT,
            userId: ANA,
            personName: 'Ana Gutiérrez',
            actorName: 'Ana Gutiérrez',
            action: 'schedule.check_in',
            auditAction: 'BOOKING_CHECKED_IN',
            permission: 'schedule.check_in',
            bookingId: 'b-1',
            appointmentId: 'cita-1',
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
            success: true,
            result: 'SUCCESS',
            createdAt: entry.recordedAt,
            occurredAt: entry.recordedAt,
            recordedAt: entry.recordedAt,
          }),
        ],
        count: 1,
        nextCursor: null,
      });
      expect(res.items[0].summary).toBe(
        'Ana Gutiérrez registró la llegada de un paciente (agenda de Andrés Pérez).',
      );
      // Nada de pacientes ni contenido clínico en la fila.
      expect(Object.keys(res.items[0])).not.toEqual(
        expect.arrayContaining([
          'patientName',
          'reasonText',
          'patientProfileId',
        ]),
      );
    });

    it('lee dentro de la transacción de la petición (el fork la conserva) para ver su contexto de organización', async () => {
      const d = build();
      await d.org();
      expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
      const doctor = build();
      await doctor.doctor();
      expect(doctor.em.fork).toHaveBeenCalledWith({
        keepTransactionContext: true,
      });
    });

    it('lee las organizaciones y personas del contexto verificado, no del cliente', async () => {
      const d = build();
      await d.org({ tenantId: TENANT });
      expect(d.repo.scan).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantIds: [TENANT],
          userIds: [ANA, LUCIA],
          limit: 200,
        }),
      );
    });

    it('un tenantId distinto del activo no devuelve nada ni consulta la bitácora', async () => {
      const d = build({ batches: [[row()]] });
      await expect(d.org({ tenantId: 'otro' })).resolves.toEqual({
        items: [],
        count: 0,
        nextCursor: null,
      });
      expect(d.repo.scan).not.toHaveBeenCalled();
    });

    it('un asiento fallido figura como FAILURE', async () => {
      const d = build({
        batches: [[row({ outcomeConceptId: CONCEPTS.OUTCOME_FAILURE })]],
      });
      const [item] = (await d.org()).items;
      expect(item).toMatchObject({ success: false, result: 'FAILURE' });
      expect(item.summary).toContain('no se pudo hacer');
    });

    it('un asiento que no se reconoce conserva su acción y no inventa permiso', async () => {
      const d = build({
        batches: [[row({ action: 'ALGO_RARO', entity: 'x' })]],
      });
      const [item] = (await d.org()).items;
      expect(item).toMatchObject({
        action: 'ALGO_RARO',
        auditAction: 'ALGO_RARO',
      });
      expect(item.permission).toBeUndefined();
    });

    describe('filtros', () => {
      it('por persona: nombre sin distinguir acentos, o id', async () => {
        const byName = build();
        await byName.org({ person: 'lucia paz' });
        expect(byName.repo.scan).toHaveBeenCalledWith(
          byName.tx,
          expect.objectContaining({ userIds: [LUCIA] }),
        );
        const byId = build();
        await byId.org({ person: ANA });
        expect(byId.repo.scan).toHaveBeenCalledWith(
          byId.tx,
          expect.objectContaining({ userIds: [ANA] }),
        );
        const legacy = build();
        await legacy.org({ userId: LUCIA });
        expect(legacy.repo.scan).toHaveBeenCalledWith(
          legacy.tx,
          expect.objectContaining({ userIds: [LUCIA] }),
        );
      });

      it('una persona que no es del personal de la organización no devuelve nada', async () => {
        const d = build({ batches: [[row()]] });
        const res = await d.org({ person: 'Pedro Desconocido' });
        expect(res.items).toEqual([]);
        expect(d.repo.scan).not.toHaveBeenCalled();
      });

      it('por acción: el código del cliente se traduce a sus asientos', async () => {
        const d = build();
        await d.org({ action: 'schedule.confirm' });
        const { actions } = d.repo.scan.mock.calls[0][1];
        expect([...actions].sort()).toEqual([
          'BOOKING_ACCEPTED',
          'BOOKING_CONFIRMED',
        ]);
      });

      it('por fechas: un día sin hora es el día completo en hora de La Paz', async () => {
        const d = build();
        await d.org({ from: '2026-10-01', to: '2026-10-30' });
        const scan = d.repo.scan.mock.calls[0][1];
        expect(scan.from.toISOString()).toBe('2026-10-01T04:00:00.000Z');
        expect(scan.to.toISOString()).toBe('2026-10-31T03:59:59.999Z');
      });

      it('por doctor: por nombre o por perfil, y descarta lo que no se puede atribuir', async () => {
        const mine = row({ id: 'a-perez', entityId: 'b-perez' });
        const other = row({ id: 'a-rojas', entityId: 'b-rojas' });
        const none = row({ id: 'a-none', entityId: 'b-none' });
        const attr = attributions({
          'b-perez': {
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
          },
          'b-rojas': {
            practitionerProfileId: ROJAS_PROFILE,
            practitionerName: 'Valeria Rojas',
          },
        });
        const byName = build({ batches: [[mine, other, none]], attr });
        expect(
          (await byName.org({ doctor: 'andres perez' })).items.map((i) => i.id),
        ).toEqual(['a-perez']);
        const byId = build({ batches: [[mine, other, none]], attr });
        expect(
          (await byId.org({ doctor: ROJAS_PROFILE })).items.map((i) => i.id),
        ).toEqual(['a-rojas']);
      });
    });

    describe('paginación', () => {
      it('con más filas que el tope devuelve cursor y la página siguiente continúa después de él', async () => {
        const rows = Array.from({ length: 3 }, () => row());
        const d = build({ batches: [rows] });
        const first = await d.org({ limit: 2 });
        expect(first.items.map((i) => i.id)).toEqual([rows[0].id, rows[1].id]);
        expect(first.nextCursor).not.toBeNull();

        const next = build({ batches: [[rows[2]]] });
        await next.org({ limit: 2, cursor: first.nextCursor as string });
        const scan = next.repo.scan.mock.calls[0][1];
        expect(scan.before).toEqual({
          recordedAt: rows[1].recordedAt,
          id: rows[1].id,
        });
      });

      it('sin más filas no hay cursor', async () => {
        const d = build({ batches: [[row(), row()]] });
        const res = await d.org({ limit: 2 });
        expect(res.count).toBe(2);
        expect(res.nextCursor).toBeNull();
      });

      it('con un filtro selectivo recorre varios lotes hasta llenar la página', async () => {
        const full = (n: number) =>
          Array.from({ length: 200 }, () =>
            row({ id: `x${n}-${seq}`, entityId: undefined, action: 'OTRA' }),
          );
        const hit = row({ id: 'hit', entityId: 'b-hit' });
        const attr = attributions({
          'b-hit': {
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
          },
        });
        const d = build({ batches: [full(1), [hit]], attr });
        const res = await d.org({ doctor: 'Andrés Pérez', limit: 5 });
        expect(res.items.map((i) => i.id)).toEqual(['hit']);
        expect(d.repo.scan).toHaveBeenCalledTimes(2);
        expect(res.nextCursor).toBeNull();
      });
    });
  });

  describe('doctor', () => {
    it('sin perfil profesional no tiene equipo', async () => {
      const d = build();
      await expect(d.doctor({}, null)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lee solo a las personas de su equipo', async () => {
      const d = build();
      await d.doctor();
      expect(d.repo.scan).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ userIds: [ANA], tenantIds: [TENANT] }),
      );
    });

    it('lo hecho sobre la agenda de OTRO doctor no figura; lo no atribuible y lo propio sí', async () => {
      const mine = row({ id: 'a-mine', entityId: 'b-mine' });
      const other = row({ id: 'a-other', entityId: 'b-other' });
      const neutral = row({
        id: 'a-neutral',
        action: 'SUPPORT_PATIENT_SEARCHED',
        entity: 'patient_search',
        entityId: undefined,
      });
      const d = build({
        batches: [[mine, other, neutral]],
        attr: attributions({
          'b-mine': {
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
          },
          'b-other': {
            practitionerProfileId: ROJAS_PROFILE,
            practitionerName: 'Valeria Rojas',
          },
        }),
      });
      const res = await d.doctor();
      expect(res.items.map((i) => i.id)).toEqual(['a-mine', 'a-neutral']);
      expect(JSON.stringify(res)).not.toContain('Valeria Rojas');
    });
  });

  describe('persona', () => {
    it('lee solo lo suyo, en las organizaciones de sus vínculos vivos', async () => {
      const d = build({ batches: [[row()]] });
      const res = await d.person();
      expect(d.access.findEngagements).toHaveBeenCalledWith(d.tx, {
        userId: ANA,
      });
      expect(d.repo.scan).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ userIds: [ANA], tenantIds: [TENANT] }),
      );
      expect(res.count).toBe(1);
    });

    it('un vínculo terminado, suspendido, vencido o con la membresía cerrada no abre su organización', async () => {
      const OTHER = 'tenant-2';
      const dead = (
        over: Record<string, unknown>,
        membership = DIR.MEMBERSHIP_ACTIVE,
      ) => ({
        assignment: { id: 'eng-x', statusConceptId: STATUS.ACTIVE, ...over },
        tenantId: OTHER,
        userId: ANA,
        membershipStatusConceptId: membership,
      });
      for (const record of [
        dead({ statusConceptId: STATUS.REVOKED }),
        dead({ statusConceptId: STATUS.SUSPENDED }),
        dead({ validTo: new Date(Date.now() - 1000) }),
        dead({ nextRecertificationAt: new Date(Date.now() - 40 * 86_400_000) }),
        dead({}, 'cerrada'),
      ]) {
        const d = build({ batches: [[row({ tenantId: OTHER })]] });
        d.engagementRows.push(record);
        await d.person();
        expect(d.repo.scan).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ tenantIds: [TENANT] }),
        );
        // `tenantId` sobre una organización sin vínculo vivo no devuelve nada.
        const none = build({ batches: [[row({ tenantId: OTHER })]] });
        none.engagementRows.push(record);
        await expect(none.person({ tenantId: OTHER })).resolves.toEqual({
          items: [],
          count: 0,
          nextCursor: null,
        });
      }
    });

    it('con RLS: los vínculos propios con el contexto de sistema acotado, y la bitácora solo con llaves verificadas (su id y sus organizaciones vivas), todo en UNA transacción', async () => {
      const before = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const d = build({ batches: [[row()]] });
        const log: string[] = [];
        d.tx.execute.mockImplementation((sql: string, params?: unknown[]) => {
          log.push(params ? `${sql}|${String(params)}` : sql);
          return Promise.resolve([]);
        });
        const find = d.access.findEngagements.getMockImplementation();
        d.access.findEngagements.mockImplementation((...a: unknown[]) => {
          log.push('FIND');
          return find(...a);
        });
        d.repo.scan.mockImplementation((_tx: unknown, scan: any) => {
          log.push(`SCAN|${scan.userIds}|${scan.tenantIds}`);
          return Promise.resolve([row()]);
        });
        const res = await d.person();
        expect(res.count).toBe(1);
        expect(d.em.transactional).toHaveBeenCalledTimes(1);
        const open = "select set_config('app.system_context', 'true', true)";
        // Los vínculos se leen con el contexto de sistema abierto…
        expect(log.indexOf(open)).toBeLessThan(log.indexOf('FIND'));
        // …que se cierra antes de seguir, y se reabre solo para la bitácora acotada.
        const scan = log.findIndex((l) => l.startsWith('SCAN'));
        expect(log.lastIndexOf(open, scan)).toBeGreaterThan(
          log.indexOf('FIND'),
        );
        expect(log[scan]).toBe(`SCAN|${ANA}|${TENANT}`);
      } finally {
        if (before === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = before;
      }
    });

    it('nunca pide la actividad de otra persona, aunque mande userId o person', async () => {
      const d = build();
      await d.person({ userId: LUCIA });
      expect(d.repo.scan).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ userIds: [ANA] }),
      );
      const other = build();
      const res = await other.person({ person: 'Lucía Paz' });
      expect(res.items).toEqual([]);
      expect(other.repo.scan).not.toHaveBeenCalled();
    });

    it('sin vínculos no hay actividad', async () => {
      const d = build();
      d.access.findEngagements.mockResolvedValue([]);
      await expect(d.person()).resolves.toEqual({
        items: [],
        count: 0,
        nextCursor: null,
      });
      expect(d.repo.scan).not.toHaveBeenCalled();
    });

    it('filtra por organización solo entre las suyas', async () => {
      const d = build();
      await expect(d.person({ tenantId: 'ajena' })).resolves.toMatchObject({
        items: [],
      });
      expect(d.repo.scan).not.toHaveBeenCalled();
    });

    it('el nombre de un doctor que no la aceptó no figura, aunque la acción sí', async () => {
      const visible = row({ id: 'a-visible', entityId: 'b-v' });
      const hidden = row({ id: 'a-hidden', entityId: 'b-h' });
      const d = build({
        batches: [[visible, hidden]],
        attr: attributions({
          'b-v': {
            practitionerProfileId: PEREZ_PROFILE,
            practitionerName: 'Andrés Pérez',
          },
          'b-h': {
            practitionerProfileId: ROJAS_PROFILE,
            practitionerName: 'Valeria Rojas',
          },
        }),
      });
      const res = await d.person();
      expect(res.items.map((i) => i.id)).toEqual(['a-visible', 'a-hidden']);
      expect(res.items[0].practitionerName).toBe('Andrés Pérez');
      expect(res.items[1].practitionerName).toBeUndefined();
      expect(res.items[1].practitionerProfileId).toBeUndefined();
      expect(JSON.stringify(res)).not.toContain('Valeria Rojas');
    });
  });
});
