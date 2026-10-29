import { SCHED } from '../../../domain/scheduling.concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  exceptionSourceKind,
  isManualException,
} from '../../../domain/catalog/catalog-concepts';
import { assertManualException } from './exception-source';

describe('origen de una excepción de disponibilidad', () => {
  it('las filas anteriores a F5d (sin origen) y las manuales son MANUAL y se editan', () => {
    for (const kind of [undefined, null, SCHED.EXC_SRC_MANUAL]) {
      expect(exceptionSourceKind(kind)).toBe('MANUAL');
      expect(isManualException(kind)).toBe(true);
      expect(() => assertManualException(kind)).not.toThrow();
    }
  });

  it('las de un bloqueo del consultorio y las del estado del equipo son de solo lectura (422)', () => {
    expect(exceptionSourceKind(SCHED.EXC_SRC_CARE_SPACE_BLOCK)).toBe(
      'CARE_SPACE_BLOCK',
    );
    expect(exceptionSourceKind(SCHED.EXC_SRC_EQUIPMENT_STATUS)).toBe(
      'EQUIPMENT_STATUS',
    );
    for (const kind of [
      SCHED.EXC_SRC_CARE_SPACE_BLOCK,
      SCHED.EXC_SRC_EQUIPMENT_STATUS,
    ]) {
      expect(() => assertManualException(kind)).toThrow(
        expect.objectContaining({
          status: 422,
          reason: SchedulingErrorReason.EXCEPTION_SOURCE_READ_ONLY,
        }),
      );
    }
  });

  it('un origen que no se conoce se trata como manual (no bloquea una edición legítima)', () => {
    expect(exceptionSourceKind('desconocido')).toBe('MANUAL');
  });
});
