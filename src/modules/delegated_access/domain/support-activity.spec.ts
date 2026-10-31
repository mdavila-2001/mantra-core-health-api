import {
  ACTIVITY_KINDS,
  activityBoundary,
  activityKindOf,
  activitySummary,
  auditActionsFor,
  coverageSummary,
  decodeActivityCursor,
  encodeActivityCursor,
  looksLikeUuid,
  patientLabelOf,
  sameName,
} from './support-activity';
import { isSupportAction } from './support-actions';

describe('actividad del personal de apoyo', () => {
  describe('ACTIVITY_KINDS', () => {
    it('todo permiso que declara es una acción de apoyo real', () => {
      for (const kind of Object.values(ACTIVITY_KINDS)) {
        if (kind.permission)
          expect(isSupportAction(kind.permission)).toBe(true);
      }
    });

    it('las acciones de agenda se leen como el permiso con el que se hacen', () => {
      expect(activityKindOf('BOOKING_CHECKED_IN')).toMatchObject({
        code: 'schedule.check_in',
        permission: 'schedule.check_in',
      });
      expect(activityKindOf('WALK_IN_APPOINTMENT_CREATED').permission).toBe(
        'schedule.walk_in',
      );
    });

    it('un asiento que no se reconoce conserva su acción y no inventa un permiso', () => {
      const kind = activityKindOf('ALGO_RARO');
      expect(kind.code).toBe('ALGO_RARO');
      expect(kind.permission).toBeUndefined();
    });
  });

  describe('auditActionsFor', () => {
    it('un código del cliente trae todos sus asientos', () => {
      expect(auditActionsFor('schedule.confirm').sort()).toEqual([
        'BOOKING_ACCEPTED',
        'BOOKING_CONFIRMED',
      ]);
    });

    it('un asiento crudo o desconocido se busca tal cual', () => {
      expect(auditActionsFor('BOOKING_CANCELLED')).toEqual([
        'BOOKING_CANCELLED',
      ]);
      expect(auditActionsFor('otra.cosa')).toEqual(['otra.cosa']);
    });
  });

  describe('activityBoundary', () => {
    it('un día sin hora es el día completo en la hora de La Paz (UTC-4)', () => {
      expect(activityBoundary('2026-10-30', 'start')?.toISOString()).toBe(
        '2026-10-30T04:00:00.000Z',
      );
      expect(activityBoundary('2026-10-30', 'end')?.toISOString()).toBe(
        '2026-10-31T03:59:59.999Z',
      );
    });

    it('un instante con hora se respeta tal cual', () => {
      expect(
        activityBoundary('2026-10-30T12:30:00Z', 'end')?.toISOString(),
      ).toBe('2026-10-30T12:30:00.000Z');
    });

    it('lo ilegible no es un límite', () => {
      expect(activityBoundary('mañana', 'start')).toBeUndefined();
    });
  });

  describe('cursor', () => {
    it('lleva instante e id y vuelve igual', () => {
      const recordedAt = new Date('2026-10-30T10:00:00.123Z');
      const encoded = encodeActivityCursor({ recordedAt, id: 'abc' });
      expect(decodeActivityCursor(encoded)).toEqual({ recordedAt, id: 'abc' });
    });

    it('lee el cursor de la primera versión, que solo traía el instante', () => {
      const old = Buffer.from('2026-10-30T10:00:00.000Z').toString('base64url');
      expect(decodeActivityCursor(old)).toEqual({
        recordedAt: new Date('2026-10-30T10:00:00.000Z'),
      });
    });

    it('un cursor ilegible equivale a no tenerlo', () => {
      expect(decodeActivityCursor('###')).toBeUndefined();
      expect(
        decodeActivityCursor(Buffer.from('basura|x').toString('base64url')),
      ).toBeUndefined();
    });
  });

  describe('filtros por texto', () => {
    it('distingue un uuid de un nombre', () => {
      expect(looksLikeUuid('785d1671-5754-58d3-b1a3-e3cd467b82b7')).toBe(true);
      expect(looksLikeUuid('Ana Gutiérrez')).toBe(false);
    });

    it('compara nombres sin distinguir mayúsculas, acentos ni espacios de los bordes', () => {
      expect(sameName('Ana Gutiérrez', ' ana gutierrez ')).toBe(true);
      expect(sameName('Ana Gutiérrez', 'Ana Gutierrez Paz')).toBe(false);
      expect(sameName(undefined, 'Ana')).toBe(false);
    });
  });

  describe('textos', () => {
    it('resume lo que hizo la persona, con el doctor si se puede decir', () => {
      const kind = activityKindOf('BOOKING_CANCELLED');
      expect(activitySummary('Ana Gutiérrez', kind, 'Andrés Pérez', true)).toBe(
        'Ana Gutiérrez canceló una cita (agenda de Andrés Pérez).',
      );
      expect(activitySummary('Ana Gutiérrez', kind, undefined, false)).toBe(
        'Ana Gutiérrez canceló una cita: no se pudo hacer.',
      );
      expect(activitySummary('', kind, undefined, true)).toBe(
        'Una persona de apoyo canceló una cita.',
      );
    });

    it('resume lo que cubre una persona', () => {
      expect(coverageSummary([])).toBe('Sin permisos vigentes sobre su agenda');
      expect(coverageSummary(['schedule.view', 'schedule.create'])).toBe(
        'Ver la agenda, crear citas',
      );
      expect(
        coverageSummary([
          'schedule.view',
          'schedule.create',
          'schedule.reschedule',
          'schedule.cancel',
          'schedule.confirm',
          'schedule.check_in',
        ]),
      ).toBe(
        'Ver la agenda, crear citas, reprogramar citas, cancelar citas y 2 más',
      );
    });

    it('rotula al paciente sin su nombre completo', () => {
      expect(patientLabelOf('Juan Carlos Pérez Rojas')).toBe('Juan R.');
      expect(patientLabelOf('Juan')).toBe('Juan');
      expect(patientLabelOf(undefined)).toBe('Paciente');
      expect(patientLabelOf('   ')).toBe('Paciente');
    });
  });
});
