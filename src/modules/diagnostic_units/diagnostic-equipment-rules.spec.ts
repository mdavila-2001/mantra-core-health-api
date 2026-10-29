import { PreconditionFailedException } from '../../common';
import { DUNIT } from './diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from './diagnostic_units.error-reasons';
import {
  assertEquipmentStatus,
  isOutOfService,
  normalizeAeTitle,
  normalizeStationName,
} from './diagnostic-equipment-rules';

describe('normalizeAeTitle', () => {
  it('recorta los espacios de los extremos: dos títulos que sólo difieren en ellos son el mismo', () => {
    expect(normalizeAeTitle('  CT_SALA1 ')).toBe('CT_SALA1');
  });

  it('null pide quitar el título', () => {
    expect(normalizeAeTitle(null)).toBeNull();
  });

  it('acepta 1 y 16 caracteres, con espacios y signos internos', () => {
    expect(normalizeAeTitle('A')).toBe('A');
    expect(normalizeAeTitle('1234567890ABCDEF')).toBe('1234567890ABCDEF');
    expect(normalizeAeTitle('CT SALA-1_b')).toBe('CT SALA-1_b');
  });

  it.each([
    ['vacío', ''],
    ['sólo espacios', '     '],
    ['17 caracteres', '1234567890ABCDEFG'],
    ['barra invertida', 'CT\\1'],
    ['tabulador', 'CT\t1'],
    ['salto de línea', 'CT\n1'],
    ['acento', 'CÓ1'],
    ['emoji', 'CT😀'],
  ])('rechaza %s con 422 AE_TITLE_INVALID', (_name, value) => {
    expect.assertions(2);
    try {
      normalizeAeTitle(value);
    } catch (error) {
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as { reason?: string }).reason).toBe(
        DiagnosticUnitsErrorReason.AE_TITLE_INVALID,
      );
    }
  });

  it('el largo se mide después de recortar', () => {
    expect(normalizeAeTitle(' 1234567890ABCDEF ')).toBe('1234567890ABCDEF');
  });
});

describe('normalizeStationName', () => {
  it('aplica la misma forma que el AE Title y falla con su propio reason', () => {
    expect(normalizeStationName(' EST-CT ')).toBe('EST-CT');
    expect(normalizeStationName(null)).toBeNull();
    expect.assertions(4);
    try {
      normalizeStationName('x'.repeat(17));
    } catch (error) {
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as { reason?: string }).reason).toBe(
        DiagnosticUnitsErrorReason.STATION_NAME_INVALID,
      );
    }
  });
});

describe('estados operativos del equipo', () => {
  it('admite operativo, mantenimiento y fuera de servicio', () => {
    for (const id of [
      DUNIT.EQUIPMENT_OPERATIONAL,
      DUNIT.EQUIPMENT_MAINTENANCE,
      DUNIT.EQUIPMENT_OUT_OF_SERVICE,
    ]) {
      expect(() => assertEquipmentStatus(id)).not.toThrow();
    }
  });

  it('rechaza un concepto que no es un estado del equipo', () => {
    expect(() => assertEquipmentStatus(DUNIT.SITE_ACTIVE)).toThrow(
      PreconditionFailedException,
    );
  });

  it('sólo mantenimiento y fuera de servicio impiden atender estudios', () => {
    expect(isOutOfService(DUNIT.EQUIPMENT_OPERATIONAL)).toBe(false);
    expect(isOutOfService(DUNIT.EQUIPMENT_MAINTENANCE)).toBe(true);
    expect(isOutOfService(DUNIT.EQUIPMENT_OUT_OF_SERVICE)).toBe(true);
  });
});
