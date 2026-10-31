import {
  AGENDA_ACTIONS,
  composeAgendaItem,
  maxAgendaDays,
  validateAgendaRange,
  type AgendaRow,
} from './support-agenda';

const row: AgendaRow = {
  bookingId: 'b1',
  resourceId: 'res-1',
  practitionerProfileId: 'prof-perez',
  startAt: new Date('2026-11-02T14:00:00Z'),
  endAt: new Date('2026-11-02T14:30:00Z'),
  statusConceptId: 'status-confirmed',
  careSpaceId: 'sala-103',
  healthcareServiceId: 'svc-consulta',
  patientProfileId: 'pat-1',
  patientName: 'Juan Quispe',
};

const allow =
  (actions: string[], grantId = 'g1') =>
  (q: { action: string }) =>
    actions.includes(q.action)
      ? { allowed: true, reason: 'ALLOWED', grantId }
      : { allowed: false, reason: 'ACTION_NOT_GRANTED' };

describe('composeAgendaItem', () => {
  it('con schedule.view muestra al paciente y lista solo las acciones permitidas', () => {
    const item = composeAgendaItem(
      row,
      allow(['schedule.view', 'schedule.confirm', 'schedule.check_in']),
    );
    expect(item.patientName).toBe('Juan Quispe');
    expect(item.allowedActions).toEqual([
      'schedule.view',
      'schedule.confirm',
      'schedule.check_in',
    ]);
    expect(item.denialReason).toBeUndefined();
  });

  it('B-b: sin schedule.view pero con otra acción de agenda, el bloque no lleva bookingId ni servicio y la cita cuenta como cubierta', () => {
    const item = composeAgendaItem(row, allow(['schedule.confirm']));
    expect(item.covered).toBe(true);
    expect(item).not.toHaveProperty('bookingId');
    expect(item).not.toHaveProperty('healthcareServiceId');
    expect(item.patientName).toBeUndefined();
    expect(item.denialReason).toBe('ACTION_NOT_GRANTED');
    expect(item.practitionerProfileId).toBe('prof-perez');
    expect(item.careSpaceId).toBe('sala-103');
  });

  it('B-b: sin ninguna acción de agenda permitida la cita no está cubierta (quien llama no la muestra)', () => {
    const item = composeAgendaItem(row, () => ({
      allowed: false,
      reason: 'NO_COVERING_GRANT',
    }));
    expect(item.covered).toBe(false);
    expect(item).not.toHaveProperty('bookingId');
    expect(item).not.toHaveProperty('healthcareServiceId');
  });

  it('con schedule.view sí lleva bookingId y servicio', () => {
    const item = composeAgendaItem(row, allow(['schedule.view']));
    expect(item.covered).toBe(true);
    expect(item.bookingId).toBe('b1');
    expect(item.healthcareServiceId).toBe('svc-consulta');
  });

  it('sin schedule.view omite al paciente y da el motivo, pero conserva el horario y el lugar', () => {
    const item = composeAgendaItem(row, () => ({
      allowed: false,
      reason: 'NO_COVERING_GRANT',
    }));
    expect(item.patientName).toBeUndefined();
    expect(item.patientProfileId).toBeUndefined();
    expect(item.denialReason).toBe('NO_COVERING_GRANT');
    expect(item.allowedActions).toEqual([]);
    expect(item.startAt).toEqual(row.startAt);
    expect(item.careSpaceId).toBe('sala-103');
    expect(item.resourceId).toBe('res-1');
  });

  it('evalúa cada acción con el doctor, el servicio y el espacio de LA cita', () => {
    const asked: unknown[] = [];
    composeAgendaItem(row, (q) => {
      asked.push(q);
      return { allowed: false, reason: 'X' };
    });
    expect(asked).toHaveLength(AGENDA_ACTIONS.length);
    for (const q of asked) {
      expect(q).toMatchObject({
        practitionerProfileId: 'prof-perez',
        healthcareServiceId: 'svc-consulta',
        careSpaceId: 'sala-103',
      });
    }
  });

  it('recoge los permisos que habilitaron la cita para sellar el acceso', () => {
    const item = composeAgendaItem(row, allow(['schedule.view'], 'g-9'));
    expect(item.grantIds).toEqual(['g-9']);
  });
});

describe('rango de la agenda', () => {
  const from = new Date('2026-11-02T00:00:00Z');

  it('acepta desde 1 hasta el máximo de días', () => {
    expect(validateAgendaRange(from, new Date('2026-11-09T00:00:00Z')).ok).toBe(
      true,
    );
    expect(
      validateAgendaRange(
        from,
        new Date(from.getTime() + maxAgendaDays() * 86_400_000),
      ).ok,
    ).toBe(true);
  });

  it('rechaza un rango invertido o mayor al máximo', () => {
    expect(validateAgendaRange(from, from).ok).toBe(false);
    expect(
      validateAgendaRange(
        from,
        new Date(from.getTime() + (maxAgendaDays() + 1) * 86_400_000),
      ).ok,
    ).toBe(false);
  });
});
