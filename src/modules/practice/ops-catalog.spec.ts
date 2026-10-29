import { FORMS } from './infrastructure-catalog';
import { PRAC } from './practice.concepts';
import {
  AVAILABILITY,
  BLOCK_KINDS,
  BLOCK_REASONS,
  BLOCK_REASON_KINDS,
  CLEANING_PRIORITIES,
  CLEANING_STATUSES,
  CLEANING_TRANSITIONS,
  CLEANING_TRIGGERS,
  CLEANING_TYPES,
  KIND_TO_AVAILABILITY,
  axisCodes,
  hasOperationalState,
  occupancyCode,
} from './ops-catalog';

describe('familias de conceptos de la operación', () => {
  it('aceptan el código completo o el corto y emiten el completo', () => {
    expect(CLEANING_TRIGGERS.byInput('discharge')?.code).toBe(
      'CLN_TRG_DISCHARGE',
    );
    expect(CLEANING_TRIGGERS.byInput('CLN_TRG_DISCHARGE')?.code).toBe(
      'CLN_TRG_DISCHARGE',
    );
    expect(CLEANING_TYPES.byInput('TERMINAL')?.code).toBe('CLEAN_TERMINAL');
    expect(CLEANING_PRIORITIES.byInput('STAT')?.code).toBe('CLN_PRIO_STAT');
    expect(CLEANING_STATUSES.byInput('IN_PROGRESS')?.code).toBe(
      'CLN_IN_PROGRESS',
    );
    expect(BLOCK_KINDS.byInput('MAINTENANCE')?.id).toBe(PRAC.BLOCK_MAINTENANCE);
    expect(CLEANING_TRIGGERS.byInput('NADA')).toBeUndefined();
  });

  it('los ids son los que el SQL del modelo escribe como literal (mantenimiento y órdenes abiertas)', () => {
    expect(BLOCK_KINDS.byInput('BLOCK_MAINTENANCE')?.id).toBe(
      'b0516b50-47c6-5fdb-b1e7-6ae060fbb4c0',
    );
    expect(CLEANING_STATUSES.byInput('CLN_PENDING')?.id).toBe(
      'c0c5918f-cf97-51e1-9ede-72d856e61c93',
    );
    expect(CLEANING_STATUSES.byInput('CLN_IN_PROGRESS')?.id).toBe(
      '60ff8df8-4ba5-591c-b092-e8da81187539',
    );
    expect(CLEANING_STATUSES.byInput('CLN_DONE')?.id).toBe(
      '334b9e1f-b123-5477-a22e-2dd1b838c2fa',
    );
  });

  it('todo motivo declara a qué tipos aplica, el cierre y el mantenimiento tienen motivo, y «otro» sirve a todos', () => {
    for (const reason of BLOCK_REASONS.codes()) {
      expect(BLOCK_REASON_KINDS[reason]?.length).toBeGreaterThan(0);
    }
    expect(BLOCK_REASON_KINDS.BLOCK_RSN_OTHER).toHaveLength(4);
    expect(BLOCK_REASON_KINDS.BLOCK_RSN_PREVENTIVE_MAINTENANCE).toEqual([
      'BLOCK_MAINTENANCE',
    ]);
    for (const kind of BLOCK_KINDS.codes()) {
      expect(
        BLOCK_REASONS.codes().some((r) =>
          BLOCK_REASON_KINDS[r].includes(kind as 'BLOCK_ADMIN'),
        ),
      ).toBe(true);
    }
  });

  it('cada tipo de bloqueo lleva a una disponibilidad distinta que no es «disponible»', () => {
    const destinos = Object.values(KIND_TO_AVAILABILITY);
    expect(new Set(destinos).size).toBe(4);
    expect(destinos).not.toContain('SPACE_OP_AVAILABLE');
    for (const code of destinos)
      expect(AVAILABILITY.byInput(code)).toBeDefined();
  });

  it('la máquina de la orden: inspeccionar solo desde «hecha»; cancelar desde pendiente o en curso, nunca desde hecha', () => {
    expect(CLEANING_TRANSITIONS.inspectPass.from).toEqual(['CLN_DONE']);
    expect(CLEANING_TRANSITIONS.inspectFail.from).toEqual(['CLN_DONE']);
    expect(CLEANING_TRANSITIONS.cancel.from).toEqual([
      'CLN_PENDING',
      'CLN_IN_PROGRESS',
    ]);
    expect(CLEANING_TRANSITIONS.start.from).toEqual(['CLN_PENDING']);
    expect(CLEANING_TRANSITIONS.finish.from).toEqual(['CLN_IN_PROGRESS']);
  });

  it('un eje sin escribir vale su valor por omisión (disponible, limpio, sin aislamiento, libre)', () => {
    expect(axisCodes({})).toEqual({
      availability: 'SPACE_OP_AVAILABLE',
      hygiene: 'HYG_CLEAN',
      isolation: 'ISO_NONE',
    });
    expect(occupancyCode(undefined)).toBe('OCC_FREE');
    expect(axisCodes({ hygieneStatusConceptId: PRAC.HYG_DIRTY }).hygiene).toBe(
      'HYG_DIRTY',
    );
  });

  it('los contenedores de la estructura no tienen estado operativo; camas, habitaciones, áreas y espacios sin forma sí', () => {
    const forma = (code: string) => FORMS.byInput(code)!.id;
    expect(hasOperationalState(null)).toBe(true);
    for (const f of ['BED', 'ROOM', 'AREA'])
      expect(hasOperationalState(forma(f))).toBe(true);
    for (const f of [
      'SITE',
      'BUILDING',
      'WING',
      'LEVEL',
      'WARD',
      'CORRIDOR',
      'VIRTUAL',
    ]) {
      expect(hasOperationalState(forma(f))).toBe(false);
    }
  });
});
