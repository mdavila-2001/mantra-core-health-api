import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../../../common/tenant/tenant-context';
import { BookingAccess, SUPPORT_DENIED_MESSAGE } from './booking-access';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const booking: any = {
  id: 'b1',
  tenantId: 'tenant-1',
  resourceId: 'res-1',
  careSpaceId: 'sala-105',
  healthcareServiceId: 'svc-consulta',
};
const ANA = {
  id: 'user-ana',
  roles: ['SUPPORT_STAFF'],
  tenantIds: ['tenant-1'],
} as any;

/** Construye el acceso con puerto de política en doble. */
function build(allowed: boolean, withPolicy = true, grantId?: string) {
  const tx = {};
  const em = { fork: () => ({ transactional: (cb: any) => cb(tx) }) };
  const audit = {
    record: mockFn().mockResolvedValue(undefined),
    recordPatientAccess: mockFn().mockResolvedValue(undefined),
  };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue({
      tenantId: 'tenant-1',
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: 'prof-perez',
    }),
  };
  const policy = {
    decide: mockFn().mockResolvedValue({ allowed, reason: 'X', grantId }),
  };
  const access = new BookingAccess(
    {} as any,
    catalogRepo as any,
    {} as any,
    {} as any,
    withPolicy ? (policy as any) : undefined,
    em as any,
    audit as any,
  );
  return { access, policy, audit, tx, catalogRepo };
}

describe('BookingAccess.sealSupportAgendaView: M7 quién vio al paciente', () => {
  it('deja un asiento de acceso por paciente (sin repetir), con la organización y sin datos clínicos', async () => {
    const d = build(true);
    await d.access.sealSupportAgendaView(
      ANA,
      'tenant-1',
      [{ grantId: 'g1', practitionerProfileId: 'prof-perez' }],
      ['pat-1', 'pat-2', 'pat-1'],
    );
    expect(d.audit.recordPatientAccess).toHaveBeenCalledTimes(2);
    expect(d.audit.recordPatientAccess).toHaveBeenCalledWith(d.tx, ANA, {
      patientProfileId: 'pat-1',
      tenantId: 'tenant-1',
      resourceType: 'SUPPORT_AGENDA',
    });
    // El sello por permiso y doctor sigue como antes.
    expect(d.audit.record).toHaveBeenCalledTimes(3);
  });

  it('sin pacientes revelados no abre otra transacción ni escribe asientos de paciente', async () => {
    const d = build(true);
    await d.access.sealSupportAgendaView(ANA, 'tenant-1', [], []);
    expect(d.audit.recordPatientAccess).not.toHaveBeenCalled();
  });
});

describe('BookingAccess: persona de apoyo', () => {
  it('pregunta a la política por el doctor, servicio y espacio de ESTA cita', async () => {
    const d = build(true);
    await d.access.assertSupportMayAct(
      {} as any,
      booking,
      ANA,
      'schedule.check_in',
    );
    expect(d.policy.decide).toHaveBeenCalledWith({
      userId: 'user-ana',
      tenantId: 'tenant-1',
      action: 'schedule.check_in',
      practitionerProfileId: 'prof-perez',
      healthcareServiceId: 'svc-consulta',
      careSpaceId: 'sala-105',
    });
  });

  it('si la política niega, responde 403', async () => {
    const d = build(false);
    await expect(
      d.access.assertSupportMayAct({} as any, booking, ANA, 'schedule.cancel'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una operación que no declara su acción se niega (falla cerrado)', async () => {
    const d = build(true);
    await expect(
      d.access.assertSupportMayAct({} as any, booking, ANA, undefined),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('sin política cableada tampoco se abre la agenda', async () => {
    const d = build(true, false);
    await expect(
      d.access.assertSupportMayAct({} as any, booking, ANA, 'schedule.view'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('para quien no es persona de apoyo no hace nada ni consulta la política', async () => {
    const d = build(false);
    await d.access.assertSupportMayAct(
      {} as any,
      booking,
      { id: 'u', roles: ['SCHEDULING_AGENT', 'SUPPORT_STAFF'] } as any,
      'schedule.cancel',
    );
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('el listado conserva solo las citas que la política permite ver', async () => {
    const d = build(true);
    d.policy.decide
      .mockResolvedValueOnce({ allowed: true, reason: 'OK' })
      .mockResolvedValueOnce({ allowed: false, reason: 'NO' });
    const rows = [{ booking }, { booking: { ...booking, id: 'b2' } }];
    const visible = await d.access.keepVisibleToSupport({} as any, rows, ANA);
    expect(visible.map((r) => r.booking.id)).toEqual(['b1']);
  });

  it('devuelve el permiso que habilitó la acción sobre una cita', async () => {
    const d = build(true, true, 'grant-1');
    await expect(
      d.access.assertSupportMayAct({} as any, booking, ANA, 'schedule.confirm'),
    ).resolves.toBe('grant-1');
  });

  it('M7: lo permitido deja sello con la cita, el permiso que lo habilitó y el doctor', async () => {
    const d = build(true, true, 'grant-1');
    await d.access.assertSupportMayAct(
      {} as any,
      booking,
      ANA,
      'schedule.confirm',
    );
    const entries = d.audit.record.mock.calls.map(
      ([, , entry]: any[]) => entry,
    );
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'SUPPORT_SCHEDULE_CONFIRM',
          entity: 'appointment_booking',
          entityId: 'b1',
          tenantId: 'tenant-1',
        }),
        expect.objectContaining({
          action: 'SUPPORT_ACCESS_VIA_GRANT',
          entity: 'support_scope_grant',
          entityId: 'grant-1',
        }),
        expect.objectContaining({
          action: 'SUPPORT_ACCESS_ON_PRACTITIONER',
          entity: 'practitioner_profile',
          entityId: 'prof-perez',
        }),
      ]),
    );
  });

  it('M7: lo negado no deja sello de acceso concedido', async () => {
    const d = build(false);
    await expect(
      d.access.assertSupportMayAct({} as any, booking, ANA, 'schedule.view'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.audit.record).not.toHaveBeenCalled();
  });

  it('M7: un listado sella una vez por doctor y permiso, no una por cita', async () => {
    const d = build(true, true, 'grant-1');
    await d.access.keepVisibleToSupport(
      {} as any,
      [{ booking }, { booking: { ...booking, id: 'b2' } }],
      ANA,
    );
    const viaGrant = d.audit.record.mock.calls.filter(
      ([, , entry]: any[]) => entry.action === 'SUPPORT_ACCESS_VIA_GRANT',
    );
    expect(viaGrant).toHaveLength(1);
  });
});

describe('BookingAccess: agendar una cita nueva como persona de apoyo', () => {
  const resource = {
    tenantId: 'tenant-1',
    resourceRefType: 'health_practitioner_profiles',
    resourceRefId: 'prof-perez',
  };

  it('pregunta schedule.create por doctor, servicio y espacio y devuelve el permiso', async () => {
    const d = build(true, true, 'grant-9');
    const grant = await d.access.assertSupportMayCreate(
      resource,
      { careSpaceId: 'sala-105', healthcareServiceId: 'svc-consulta' },
      ANA,
      'schedule.create',
    );
    expect(grant).toBe('grant-9');
    expect(d.policy.decide).toHaveBeenCalledWith({
      userId: 'user-ana',
      tenantId: 'tenant-1',
      action: 'schedule.create',
      practitionerProfileId: 'prof-perez',
      healthcareServiceId: 'svc-consulta',
      careSpaceId: 'sala-105',
    });
  });

  it('si la política niega, responde 403 y no hay permiso que sellar', async () => {
    const d = build(false);
    await expect(
      d.access.assertSupportMayCreate(resource, {}, ANA, 'schedule.create'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sin política cableada falla cerrado', async () => {
    const d = build(true, false);
    await expect(
      d.access.assertSupportMayCreate(resource, {}, ANA, 'schedule.create'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('quien no es persona de apoyo pasa sin consultar y sin permiso', async () => {
    const d = build(false);
    const doctor = { id: 'doc', roles: ['PRACTITIONER'] } as any;
    await expect(
      d.access.assertSupportMayCreate(resource, {}, doctor, 'schedule.create'),
    ).resolves.toBeUndefined();
    expect(d.policy.decide).not.toHaveBeenCalled();
  });
});

describe('BookingAccess: la organización en la que actúa la persona de apoyo', () => {
  it('una cita de otra organización se niega con el mismo rechazo y sin consultar la política', async () => {
    const d = build(true);
    const deOtraOrg = { ...booking, tenantId: 'tenant-2' };
    // Tiene vínculo en las dos, pero actúa con la organización activa del request.
    const actor = { ...ANA, tenantIds: ['tenant-1', 'tenant-2'] };
    const error = await runWithTenant('tenant-1', () =>
      d.access
        .assertSupportMayAct({} as any, deOtraOrg, actor, 'schedule.cancel')
        .catch((e) => e),
    );
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.message).toBe(SUPPORT_DENIED_MESSAGE);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('con X-Tenant-Id de la organización de la cita sí se decide con la política', async () => {
    const d = build(true, true, 'g-1');
    const deOtraOrg = { ...booking, tenantId: 'tenant-2' };
    const actor = { ...ANA, tenantIds: ['tenant-1', 'tenant-2'] };
    await expect(
      runWithTenant('tenant-2', () =>
        d.access.assertSupportMayAct(
          {} as any,
          deOtraOrg,
          actor,
          'schedule.cancel',
        ),
      ),
    ).resolves.toBe('g-1');
    expect(d.policy.decide).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-2' }),
    );
  });

  it('el rechazo de la política y el de organización ajena dicen lo mismo', async () => {
    const negada = build(false);
    const porPolitica = await negada.access
      .assertSupportMayAct({} as any, booking, ANA, 'schedule.cancel')
      .catch((e) => e);
    const ajena = build(true);
    const porOrganizacion = await ajena.access
      .assertSupportMayAct(
        {} as any,
        { ...booking, tenantId: 'tenant-2' },
        ANA,
        'schedule.cancel',
      )
      .catch((e) => e);
    expect(porOrganizacion.message).toBe(porPolitica.message);
  });
});

describe('BookingAccess: operar sobre un cupo como persona de apoyo', () => {
  const slot = {
    resourceId: 'res-1',
    careSpaceId: 'sala-105',
    healthcareServiceId: 'svc-consulta',
  } as any;

  it('pregunta la acción por el doctor, servicio y espacio DEL CUPO y devuelve el permiso', async () => {
    const d = build(true, true, 'grant-5');
    const grant = await d.access.assertSupportMayOnSlot(
      {} as any,
      slot,
      ANA,
      'schedule.reschedule',
    );
    expect(grant).toBe('grant-5');
    expect(d.policy.decide).toHaveBeenCalledWith({
      userId: 'user-ana',
      tenantId: 'tenant-1',
      action: 'schedule.reschedule',
      practitionerProfileId: 'prof-perez',
      healthcareServiceId: 'svc-consulta',
      careSpaceId: 'sala-105',
    });
  });

  it('si la política niega, 403', async () => {
    const d = build(false);
    await expect(
      d.access.assertSupportMayOnSlot({} as any, slot, ANA, 'schedule.create'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el tenantId del cuerpo tiene que ser el de la agenda del cupo', async () => {
    const d = build(true);
    await expect(
      d.access.assertSupportMayOnSlot(
        {} as any,
        slot,
        ANA,
        'schedule.create',
        'tenant-2',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.policy.decide).not.toHaveBeenCalled();
  });

  it('un cupo cuya agenda no existe se niega a la persona de apoyo', async () => {
    const d = build(true);
    d.catalogRepo.findResourceById.mockResolvedValue(null);
    await expect(
      d.access.assertSupportMayOnSlot({} as any, slot, ANA, 'schedule.create'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('para quien no es persona de apoyo no hace nada', async () => {
    const d = build(false);
    await expect(
      d.access.assertSupportMayOnSlot(
        {} as any,
        slot,
        { id: 'p', roles: ['PATIENT'] } as any,
        'schedule.create',
      ),
    ).resolves.toBeUndefined();
    expect(d.policy.decide).not.toHaveBeenCalled();
  });
});

describe('SEG A-A1: candado de representación para quien es apoyo en OTRA organización', () => {
  const A = 'aaaaaaaa-0000-0000-0000-000000000001';
  const B = 'bbbbbbbb-0000-0000-0000-000000000002';
  // PoC dual.ts: secretaria del hospital A con cuenta de paciente en la clínica B.
  const dual = {
    id: 'user-ana',
    roles: ['PATIENT', 'SUPPORT_STAFF'],
    scopedRoles: { [A]: ['SUPPORT_STAFF'] },
    tenantIds: [A, B],
  } as any;

  function buildWithRepresentation() {
    const representation = {
      assertMayActForPatient: mockFn().mockRejectedValue(
        new ForbiddenException('No cuenta con autorización de tutoría'),
      ),
      representsPatient: mockFn().mockResolvedValue(false),
    };
    const access = new BookingAccess(
      {} as any,
      {} as any,
      representation as any,
      {} as any,
    );
    return { access, representation };
  }

  it('en la organización B (contexto activo) no se salta assertMayActForPatient', async () => {
    const d = buildWithRepresentation();
    await expect(
      runWithTenant(B, () =>
        d.access.assertMayActForPatient('pat-victima', dual),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.representation.assertMayActForPatient).toHaveBeenCalledTimes(1);
  });

  it('con la organización del recurso explícita (cita de B) tampoco', async () => {
    const d = buildWithRepresentation();
    await expect(
      d.access.assertMayActForPatient('pat-victima', dual, undefined, B),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('en A, donde es persona de apoyo, el candado de paciente no aplica (decide la política)', async () => {
    const d = buildWithRepresentation();
    await expect(
      runWithTenant(A, () =>
        d.access.assertMayActForPatient('pat-cualquiera', dual),
      ),
    ).resolves.toBeUndefined();
    expect(d.representation.assertMayActForPatient).not.toHaveBeenCalled();
  });
});
