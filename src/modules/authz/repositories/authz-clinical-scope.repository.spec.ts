import { jest } from '@jest/globals';
import { AuthzClinicalScopeRepository } from './authz-clinical-scope.repository';
import {
  Appointments,
  CareEpisodes,
  Encounters,
} from '../../clinical/entities';
import { TenantMemberships } from '../../directory/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { AppointmentBookings } from '../../scheduling/entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** `EntityManager` en doble: `counts` dice cuántas filas hay por entidad. */
function build(
  counts: Map<unknown, number>,
  link: { userId: string } | null = null,
  admissionFootprints = 0,
) {
  const em = {
    // «Admisión crea el vínculo»: huellas de ingreso (SQL directo).
    execute: mockFn(() => Promise.resolve([{ n: admissionFootprints }])),
    count: mockFn((entity: unknown) =>
      Promise.resolve(counts.get(entity) ?? 0),
    ),
    findOne: mockFn(() => Promise.resolve(link)),
  };
  return { em, repo: new AuthzClinicalScopeRepository() };
}

describe('AuthzClinicalScopeRepository.patientHasFootprintInTenant', () => {
  it('«Admisión crea el vínculo»: la huella de un ingreso auditado cuenta aunque el paciente no tenga cuenta', async () => {
    const d = build(new Map(), null, 1);
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(true);
    expect(d.em.execute).toHaveBeenCalledWith(
      expect.stringContaining('clinical.patient_admission_footprints'),
      ['pat-1', 't1'],
      'all',
    );
  });

  it('sin huella de ingreso ni cuenta: sigue sin haber vínculo (la regla general no cambia)', async () => {
    const d = build(new Map([[Encounters, 3]]), null, 0);
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(false);
  });

  it('reconoce la reserva que la cuenta del paciente hizo en el tenant', async () => {
    const d = build(new Map([[AppointmentBookings, 1]]), { userId: 'u-pat' });
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(true);
    // Sólo cuenta si la reservó la propia cuenta del paciente: el personal también
    // reserva a nombre de cualquier paciente y eso no prueba nada.
    expect(d.em.count).toHaveBeenCalledWith(AppointmentBookings, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      bookedByUserId: 'u-pat',
    });
  });

  it('reconoce la membresía activa que la cuenta del paciente tiene por sí misma', async () => {
    const d = build(new Map([[TenantMemberships, 1]]), { userId: 'u-pat' });
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(true);
    expect(d.em.findOne).toHaveBeenCalledWith(
      PersonAccountLinks,
      expect.objectContaining({ personId: 'pat-1' }),
    );
    expect(d.em.count).toHaveBeenCalledWith(
      TenantMemberships,
      expect.objectContaining({ userId: 'u-pat', tenantId: 't1' }),
    );
  });

  it('la membresía que dio de alta un tercero (invitación de un administrador) no cuenta', async () => {
    const d = build(new Map([[TenantMemberships, 1]]), { userId: 'u-pat' });
    await d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1');
    // `POST /directory/tenants/:id/memberships` guarda el id del administrador en
    // `invited_by_user_id`; sólo se acepta el autorregistro (nulo) o la propia cuenta.
    expect(d.em.count).toHaveBeenCalledWith(
      TenantMemberships,
      expect.objectContaining({
        $or: [{ invitedByUserId: null }, { invitedByUserId: 'u-pat' }],
      }),
    );
  });

  it.each([
    ['un encuentro', Encounters],
    ['un turno', Appointments],
    ['un episodio de atención', CareEpisodes],
  ])(
    '%s del tenant con el paciente no es huella: el personal lo crea sin autorización previa',
    async (_name, entity) => {
      // El personal abre encuentros, episodios y turnos para cualquier paciente
      // existente: aceptarlos dejaría que otro tenant se fabricara el vínculo.
      const d = build(new Map([[entity, 3]]), { userId: 'u-pat' });
      await expect(
        d.repo.patientHasFootprintInTenant(d.em as any, 'pat-B', 't1'),
      ).resolves.toBe(false);
      expect(d.em.count).not.toHaveBeenCalledWith(entity, expect.anything());
    },
  );

  it('una reserva del paciente que no hizo su cuenta (la hizo el personal) no es huella', async () => {
    // La base sólo tiene reservas del personal: responde 1 a cualquier consulta que
    // no se restrinja a la cuenta del propio paciente.
    const em = {
      count: mockFn((entity: unknown, where: any) =>
        Promise.resolve(
          entity === AppointmentBookings && where.bookedByUserId !== 'u-pat'
            ? 1
            : 0,
        ),
      ),
      findOne: mockFn(() => Promise.resolve({ userId: 'u-pat' })),
      execute: mockFn(() => Promise.resolve([{ n: 0 }])),
    };
    await expect(
      new AuthzClinicalScopeRepository().patientHasFootprintInTenant(
        em as any,
        'pat-B',
        't1',
      ),
    ).resolves.toBe(false);
  });

  it('sin ninguna huella en el tenant no hay vínculo', async () => {
    const d = build(new Map(), { userId: 'u-pat' });
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-B', 't1'),
    ).resolves.toBe(false);
  });

  it('sin cuenta vinculada no hay huella propia: ni se consulta nada más', async () => {
    const d = build(
      new Map<unknown, number>([
        [AppointmentBookings, 1],
        [Encounters, 1],
        [TenantMemberships, 1],
      ]),
      null,
    );
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-B', 't1'),
    ).resolves.toBe(false);
    expect(d.em.count).not.toHaveBeenCalled();
  });
});
